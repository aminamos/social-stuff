/**
 * One watch run: poll every registered URL, hash-diff against the snapshot
 * in R2, then run per-jurisdiction search queries through the configured
 * provider and record new hits. Findings land in R2:
 *
 *   watch/state/<sourceId>/<urlHash>.json   — last-seen snapshot per URL
 *   watch/seen.json                         — search URLs already reported
 *   watch/changes/<ISO-ts>.json             — batch of ChangeRecords
 *   watch/changes/latest.json               — copy of the most recent batch
 *   watch/status.json                       — last-run summary
 *
 * Deterministic: no LLM in the loop; findings are review queue, not truth.
 */

import { looksOfficial, pickProvider } from "./providers.js";
import { SEARCH_TEMPLATES, WATCH_SOURCES } from "./registry.js";
import type { ChangeRecord, SourceState, WatchRunSummary, WatchSource } from "./types.js";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 tax-engine/watch";
const STATE_KEYS = "watch/state/";
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DC: "District of Columbia", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky",
  LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", PR: "Puerto Rico", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Strip markup noise so cosmetic HTML churn doesn't false-positive. */
function normalize(body: string, contentType: string): string {
  if (!contentType.includes("html")) return body;
  return body
    .replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function put(bucket: R2Bucket, key: string, body: string): Promise<void> {
  await bucket.put(key, body, { httpMetadata: { contentType: "application/json" } });
}

/**
 * A URL "changed" when >=4 differing words (or >=0.3% of its
 * vocabulary) appear/vanish between snapshots — real edits add whole
 * sentences; timestamps/counters don't reach the threshold.
 */
function meaningfulChange(prevWords: string[], words: string[]): boolean {
  const a = new Set(prevWords);
  const b = new Set(words);
  let diff = 0;
  for (const w of b) if (!a.has(w)) diff++;
  for (const w of a) if (!b.has(w)) diff++;
  return diff >= Math.max(4, Math.ceil(Math.max(a.size, b.size) * 0.003));
}

/** Poll a single URL; returns a change record if it changed or errored. */
async function pollUrl(
  bucket: R2Bucket,
  source: WatchSource,
  url: string,
  now: string,
): Promise<ChangeRecord | undefined> {
  const urlHash = (await sha256Hex(url)).slice(0, 16);
  const stateKey = `${STATE_KEYS}${source.id}/${urlHash}.json`;
  const base = { at: now, sourceId: source.id, jurisdiction: source.jurisdiction, level: source.level, url };

  let res: Response;
  try {
    res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15_000), redirect: "follow" });
  } catch (e) {
    return { ...base, kind: "fetch-error", detail: String(e) };
  }
  if (!res.ok) return { ...base, kind: "fetch-error", detail: `HTTP ${res.status}` };

  const text = normalize(await res.text(), res.headers.get("content-type") ?? "");
  const hash = await sha256Hex(text);
  const words = [...new Set(text.split(" "))].sort();
  const prev = await bucket.get(stateKey).then((o) => o?.json() as Promise<SourceState | undefined>);

  const state: SourceState = { sourceId: source.id, url, sha256: hash, status: res.status, fetchedAt: now, words };
  await put(bucket, stateKey, JSON.stringify(state));

  if (!prev?.words || prev.sha256 === hash) return undefined; // baseline or identical
  if (!meaningfulChange(prev.words, words)) return undefined; // cosmetic churn
  return { ...base, kind: "content-change", oldHash: prev.sha256, newHash: hash };
}

function queriesFor(source: WatchSource, year: number): string[] {
  const name = source.level === "federal" ? "IRS federal" : (STATE_NAMES[source.jurisdiction] ?? source.jurisdiction);
  const domain = (() => {
    try {
      return new URL(source.urls[0]).hostname;
    } catch {
      return "";
    }
  })();
  const fromTemplates = SEARCH_TEMPLATES.map((t) =>
    t.replace("{name}", name).replace("{domain}", domain).replace("{year}", String(year)),
  );
  return [...fromTemplates, ...(source.searchQueries ?? [])];
}

/** Small concurrency pool — cron has generous wall time but be polite. */
async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runWatch(
  bucket: R2Bucket,
  env: Record<string, string | undefined>,
  opts?: { searches?: boolean },
): Promise<WatchRunSummary> {
  const now = new Date().toISOString();
  const changes: ChangeRecord[] = [];
  let urlsPolled = 0;

  const pollTasks = WATCH_SOURCES.flatMap((source) =>
    source.urls.map((url) => async () => {
      urlsPolled++;
      const change = await pollUrl(bucket, source, url, now);
      if (change) changes.push(change);
    }),
  );
  await pool(pollTasks, 5, (fn) => fn());

  // ---- search discovery ----
  const provider = pickProvider(env);
  const searchesEnabled = opts?.searches ?? env.WATCH_SEARCH_ENABLED !== "0";
  const limit = Math.max(1, Math.min(20, Number(env.WATCH_SEARCH_LIMIT ?? 5) || 5));
  // Free HTML endpoints throttle aggressively; paid APIs don't need pacing.
  const searchDelayMs = Number(env.WATCH_SEARCH_DELAY_MS ?? (provider.name === "duckduckgo" ? 2000 : 0)) || 0;
  const year = new Date().getFullYear();
  const seenObj = await bucket.get("watch/seen.json").then((o) => o?.json() as Promise<Record<string, string> | undefined>);
  const seen = seenObj ?? {};
  let seenDirty = false;

  if (searchesEnabled) {
    const searchTasks = WATCH_SOURCES.flatMap((source) =>
      queriesFor(source, year).map((query) => async () => {
        let hits;
        try {
          hits = await provider.search(query, limit, env);
        } catch (e) {
          changes.push({
            at: now, sourceId: source.id, jurisdiction: source.jurisdiction, level: source.level,
            kind: "fetch-error", url: query, detail: `search(${provider.name}): ${String(e)}`,
          });
          return;
        }
        for (const hit of hits) {
          if (seen[hit.url]) continue;
          seen[hit.url] = now;
          seenDirty = true;
          changes.push({
            at: now, sourceId: source.id, jurisdiction: source.jurisdiction, level: source.level,
            kind: "new-search-result", url: hit.url,
            detail: [hit.title, hit.snippet].filter(Boolean).join(" — ").slice(0, 500) || `query: ${query}`,
            official: looksOfficial(hit.url),
          });
        }
      }),
    );
    await pool(searchTasks, 3, async (fn) => {
      await fn();
      if (searchDelayMs) await sleep(searchDelayMs);
    });
    if (seenDirty) await put(bucket, "watch/seen.json", JSON.stringify(seen));
  }

  const ts = now.replace(/[:.]/g, "-");
  const summary: WatchRunSummary = {
    ranAt: now,
    provider: provider.name,
    sourcesPolled: WATCH_SOURCES.length,
    urlsPolled,
    fetchErrors: changes.filter((c) => c.kind === "fetch-error").length,
    contentChanges: changes.filter((c) => c.kind === "content-change").length,
    newSearchResults: changes.filter((c) => c.kind === "new-search-result").length,
    changesKey: `watch/changes/${ts}.json`,
  };
  const batch = JSON.stringify({ summary, changes });
  await put(bucket, summary.changesKey, batch);
  await put(bucket, "watch/changes/latest.json", batch);
  await put(bucket, "watch/status.json", JSON.stringify(summary));
  return summary;
}
