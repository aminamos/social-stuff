/* bruenig-chart-updates — serves updated versions of Matt Bruenig /
 * People's Policy Project charts, recomputed from public datasets
 * (CPS ASEC, SCF, OECD IDD). D1 holds charts/series/points/releases,
 * R2 holds archived source files, a monthly cron re-checks each
 * dataset's index page for a newer vintage and flags charts stale.
 */

import { esc, mdLite, page, chartFigure, type SeriesData } from "./ui";
import { GENERIC_YEAR_HINT, RELEASE_SOURCES } from "./release-sources";

interface Env {
  DB: D1Database;
  R2_DATA: R2Bucket;
}

interface ChartRow {
  slug: string;
  family: string;
  title: string;
  subtitle: string | null;
  provenance: string;
  updated_at: string;
}

interface Provenance {
  bruenig_post_url?: string;
  bruenig_post_title?: string;
  source_name?: string;
  source_url?: string;
  recipe_md?: string;
}

interface ReleaseRow {
  dataset: string;
  label: string;
  source_index_url: string;
  latest_vintage: string | null;
  checked_at: string | null;
  stale: number;
}

const UA = { "User-Agent": "bruenig-chart-updates/1.0 (dataset vintage check; +https://bruenig-chart-updates.a-8c6.workers.dev)" };
const HTML = { "content-type": "text/html;charset=utf-8" };
const DOC_KEY = /^(asec|scf|oecd|lis)\/[A-Za-z0-9._\-\/]+$/;
const FAMILY_ORDER = ["poverty", "wealth", "intl"];

function provenanceOf(row: ChartRow): Provenance {
  try {
    const p = JSON.parse(row.provenance) as Provenance;
    return typeof p === "object" && p ? p : {};
  } catch {
    return {};
  }
}

interface LoadedChart {
  chart: ChartRow;
  provenance: Provenance;
  series: SeriesData[];
}

/** One chart with its series + points, or null if the slug is unknown. */
async function loadChart(env: Env, slug: string): Promise<LoadedChart | null> {
  const chart = await env.DB.prepare("SELECT * FROM charts WHERE slug = ?")
    .bind(slug)
    .first<ChartRow>();
  if (!chart) return null;
  const { results: srows } = await env.DB.prepare(
    "SELECT id, label, unit FROM series WHERE chart_slug = ? ORDER BY id"
  ).bind(slug).all<{ id: string; label: string; unit: string }>();
  const series: SeriesData[] = [];
  for (const s of srows) {
    const { results: pts } = await env.DB.prepare(
      "SELECT x, y FROM points WHERE series_id = ? ORDER BY x"
    ).bind(s.id).all<{ x: string; y: number }>();
    series.push({ id: s.id, label: s.label, unit: s.unit, points: pts.map((p) => ({ x: String(p.x), y: Number(p.y) })) });
  }
  return { chart, provenance: provenanceOf(chart), series };
}

const chartJson = ({ chart, provenance, series }: LoadedChart) => ({
  slug: chart.slug,
  family: chart.family,
  title: chart.title,
  subtitle: chart.subtitle,
  updated_at: chart.updated_at,
  provenance,
  series: series.map(({ id, label, unit, points }) => ({ id, label, unit, points })),
});

function provenanceBlock(p: Provenance, updatedAt: string): string {
  const bruenig = p.bruenig_post_url
    ? `<a href="${esc(p.bruenig_post_url)}" rel="noopener">${esc(p.bruenig_post_title || p.bruenig_post_url)}</a>`
    : `<span class="empty">original post not recorded</span>`;
  const source = p.source_url
    ? `<a href="${esc(p.source_url)}" rel="noopener">${esc(p.source_name || p.source_url)}</a>`
    : esc(p.source_name || "source not recorded");
  return `<section class="provenance"><h2>Provenance</h2>
<p><strong>Updates:</strong> ${bruenig}</p>
<p><strong>Source data:</strong> ${source}</p>
<p><strong>Last recomputed:</strong> ${esc(updatedAt)}</p>
${p.recipe_md ? `<div class="recipe"><strong>Method / recipe</strong>\n\n${mdLite(p.recipe_md)}</div>` : ""}
</section>`;
}

async function renderIndex(env: Env): Promise<Response> {
  const [{ results: charts }, { results: releases }] = await Promise.all([
    env.DB.prepare("SELECT slug, family, title, subtitle, provenance, updated_at FROM charts ORDER BY family, slug").all<ChartRow>(),
    env.DB.prepare("SELECT dataset, label, source_index_url, latest_vintage, checked_at, stale FROM releases").all<ReleaseRow>(),
  ]);
  const staleDatasets = new Set(releases.filter((r) => r.stale).map((r) => r.dataset));
  const byFamily = new Map<string, ChartRow[]>();
  for (const c of charts) {
    const list = byFamily.get(c.family) ?? [];
    list.push(c);
    byFamily.set(c.family, list);
  }
  const families = [...FAMILY_ORDER.filter((f) => byFamily.has(f)), ...[...byFamily.keys()].filter((f) => !FAMILY_ORDER.includes(f))];
  const sections = families
    .map((fam) => {
      const rows = (byFamily.get(fam) ?? [])
        .map((c) => {
          const p = provenanceOf(c);
          return `<tr><td><a href="/chart/${encodeURIComponent(c.slug)}">${esc(c.title)}</a>${c.subtitle ? `<div class="empty" style="font-size:.85em">${esc(c.subtitle)}</div>` : ""}</td><td>${esc(p.source_name ?? "—")}</td><td>${esc(c.updated_at.slice(0, 10))}</td></tr>`;
        })
        .join("");
      return `<h2>${esc(fam)}</h2><table><tr><th>Chart</th><th>Source</th><th>Updated</th></tr>${rows}</table>`;
    })
    .join("\n");
  const banner = staleDatasets.size
    ? `<div class="banner">New source-data vintage detected for <strong>${esc([...staleDatasets].join(", "))}</strong> — charts are being recomputed. See <a href="/changes">changes</a>.</div>`
    : "";
  return new Response(
    page(
      "Bruenig Chart Updates",
      `<div class="nav"><a href="/">index</a><a href="/changes">dataset changes</a><a href="/api/charts">JSON API</a></div>
<h1>Bruenig Chart Updates</h1>
<p class="subtitle">Updated versions of <a href="https://www.peoplespolicyproject.org" rel="noopener">People's Policy Project</a> charts, recomputed from the underlying public datasets as new vintages are released. Every chart links its original post, its source data, and the recipe used.</p>
${banner}${sections || "<p class=\"empty\">No charts published yet — the pipeline has not seeded the database.</p>"}`
    ),
    { headers: HTML }
  );
}

async function renderChartPage(env: Env, slug: string): Promise<Response> {
  const loaded = await loadChart(env, slug);
  if (!loaded) return new Response("Not found", { status: 404 });
  const { chart, provenance, series } = loaded;
  return new Response(
    page(
      `${chart.title} — Bruenig Chart Updates`,
      `<div class="nav"><a href="/">← all charts</a><a href="/changes">dataset changes</a><a href="/api/chart/${encodeURIComponent(slug)}">JSON</a></div>
<h1>${esc(chart.title)}</h1>
${chart.subtitle ? `<p class="subtitle">${esc(chart.subtitle)}</p>` : ""}
${chartFigure(series)}
${provenanceBlock(provenance, chart.updated_at)}`
    ),
    { headers: HTML }
  );
}

async function renderChanges(env: Env): Promise<Response> {
  const [{ results: changes }, { results: releases }] = await Promise.all([
    env.DB.prepare("SELECT dataset, old_vintage, new_vintage, detected_at FROM change_log ORDER BY detected_at DESC LIMIT 200").all<{ dataset: string; old_vintage: string | null; new_vintage: string; detected_at: string }>(),
    env.DB.prepare("SELECT dataset, label, source_index_url, latest_vintage, checked_at, stale FROM releases ORDER BY dataset").all<ReleaseRow>(),
  ]);
  const relRows = releases
    .map(
      (r) =>
        `<tr><td>${esc(r.dataset)}</td><td>${esc(r.label)}</td><td><a href="${esc(r.source_index_url)}" rel="noopener">index</a></td><td>${esc(r.latest_vintage ?? "—")}</td><td>${esc(r.checked_at ?? "never")}</td><td>${r.stale ? '<span class="badge stale">stale — recompute pending</span>' : '<span class="badge ok">current</span>'}</td></tr>`
    )
    .join("");
  const changeRows = changes
    .map(
      (c) =>
        `<tr><td>${esc(c.detected_at)}</td><td>${esc(c.dataset)}</td><td>${esc(c.old_vintage ?? "—")}</td><td>${esc(c.new_vintage)}</td></tr>`
    )
    .join("");
  return new Response(
    page(
      "Dataset changes — Bruenig Chart Updates",
      `<div class="nav"><a href="/">← all charts</a></div>
<h1>Dataset changes</h1>
<p>The worker re-checks each source index monthly (<code>0 8 2 * *</code>). A newer vintage flags the release <span class="badge stale">stale</span> until the pipeline recomputes its charts.</p>
<h2>Tracked releases</h2>
${relRows ? `<table><tr><th>Dataset</th><th>Label</th><th>Index</th><th>Latest vintage</th><th>Last checked</th><th>Status</th></tr>${relRows}</table>` : '<p class="empty">No datasets tracked yet.</p>'}
<h2>Detected vintages</h2>
${changeRows ? `<table><tr><th>Detected</th><th>Dataset</th><th>Previous</th><th>New</th></tr>${changeRows}</table>` : '<p class="empty">No vintage changes detected yet.</p>'}`
    ),
    { headers: HTML }
  );
}

/** Newest vintage in an index page body: max of capture-group-1 matches. */
export function detectVintage(body: string, regexHint: string): string | null {
  const re = new RegExp(regexHint, "gi");
  let best: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const v = m[1] ?? m[0];
    if (best === null || compareVintage(v, best) > 0) best = v;
  }
  return best;
}

/** >0 if a is the newer vintage. Dotted versions compare component-wise
 *  ("1.10" > "1.4"); non-numeric values compare lexically. */
export function compareVintage(a: string, b: string): number {
  const pa = a.split(".");
  const pb = b.split(".");
  if (pa.every((p) => /^\d+$/.test(p)) && pb.every((p) => /^\d+$/.test(p))) {
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = Number(pa[i] ?? 0) - Number(pb[i] ?? 0);
      if (d !== 0) return Math.sign(d);
    }
    return 0;
  }
  return a === b ? 0 : a > b ? 1 : -1;
}

/** Monthly cron: fetch each tracked dataset's index page, flag newer vintages stale. */
async function checkReleases(env: Env): Promise<void> {
  const { results: releases } = await env.DB.prepare(
    "SELECT dataset, label, source_index_url, latest_vintage, checked_at, stale FROM releases ORDER BY dataset"
  ).all<ReleaseRow>();
  for (const r of releases) {
    try {
      const src = RELEASE_SOURCES[r.dataset];
      const url = r.source_index_url || src?.index_url;
      if (!url) continue;
      const resp = await fetch(url, { headers: { ...UA, ...(src?.headers ?? {}) } });
      if (!resp.ok) {
        await env.DB.prepare("UPDATE releases SET checked_at = datetime('now') WHERE dataset = ?").bind(r.dataset).run();
        continue;
      }
      const vintage = detectVintage(await resp.text(), src?.regex_hint ?? GENERIC_YEAR_HINT);
      if (vintage === null) {
        await env.DB.prepare("UPDATE releases SET checked_at = datetime('now') WHERE dataset = ?").bind(r.dataset).run();
        continue;
      }
      if (r.latest_vintage !== null && compareVintage(vintage, r.latest_vintage) > 0) {
        await env.DB.prepare(
          "UPDATE releases SET latest_vintage = ?, stale = 1, checked_at = datetime('now') WHERE dataset = ?"
        ).bind(vintage, r.dataset).run();
        await env.DB.prepare(
          "INSERT INTO change_log (dataset, old_vintage, new_vintage) VALUES (?, ?, ?)"
        ).bind(r.dataset, r.latest_vintage, vintage).run();
      } else if (r.latest_vintage === null) {
        await env.DB.prepare(
          "UPDATE releases SET latest_vintage = ?, checked_at = datetime('now') WHERE dataset = ?"
        ).bind(vintage, r.dataset).run();
      } else {
        await env.DB.prepare("UPDATE releases SET checked_at = datetime('now') WHERE dataset = ?").bind(r.dataset).run();
      }
    } catch {
      // one dataset failing must not stop the sweep
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/charts") {
      const { results: charts } = await env.DB.prepare("SELECT slug FROM charts ORDER BY family, slug").all<{ slug: string }>();
      const out = [];
      for (const c of charts) {
        const loaded = await loadChart(env, c.slug);
        if (loaded) out.push(chartJson(loaded));
      }
      return Response.json({ charts: out });
    }

    const apiMatch = path.match(/^\/api\/chart\/(.+)$/);
    if (apiMatch) {
      let slug = "";
      try {
        slug = decodeURIComponent(apiMatch[1]);
      } catch {
        return Response.json({ error: "not found" }, { status: 404 });
      }
      const loaded = await loadChart(env, slug);
      if (!loaded) return Response.json({ error: "unknown chart" }, { status: 404 });
      return Response.json(chartJson(loaded));
    }

    if (path === "/changes") return renderChanges(env);

    if (path.startsWith("/docs/")) {
      let key = "";
      try {
        key = decodeURIComponent(path.slice("/docs/".length));
      } catch {
        return new Response("Not found", { status: 404 });
      }
      if (!DOC_KEY.test(key) || key.includes("..") || key.includes("//")) return new Response("Not found", { status: 404 });
      const obj = await env.R2_DATA.get(key);
      if (!obj) return new Response("Not found", { status: 404 });
      const headers: Record<string, string> = {};
      if (key.endsWith(".pdf")) headers["content-type"] = "application/pdf";
      else if (key.endsWith(".csv")) headers["content-type"] = "text/csv;charset=utf-8";
      else if (key.endsWith(".zip")) headers["content-type"] = "application/zip";
      else headers["content-type"] = "application/octet-stream";
      headers["etag"] = obj.httpEtag;
      return new Response(obj.body, { headers });
    }

    const chartMatch = path.match(/^\/chart\/(.+)$/);
    if (chartMatch) {
      let slug = "";
      try {
        slug = decodeURIComponent(chartMatch[1]);
      } catch {
        return new Response("Not found", { status: 404 });
      }
      return renderChartPage(env, slug);
    }

    if (path === "/" || path === "") return renderIndex(env);

    return new Response("Not found", { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    await checkReleases(env);
  },
};
