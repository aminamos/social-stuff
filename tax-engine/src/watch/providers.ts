/**
 * Pluggable web-search providers for tax-watch discovery queries.
 *
 * Selected via the SEARCH_PROVIDER var ("duckduckgo" default — no key).
 * API keys come from secrets: BRAVE_API_KEY, EXA_API_KEY,
 * PERPLEXITY_API_KEY, FIRECRAWL_API_KEY (`wrangler secret put <NAME>`).
 */

import type { SearchHit, SearchProvider } from "./types.js";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 tax-engine/watch";

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000), ...init });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${url} -> ${res.status}`);
  return res.json();
}

/** DuckDuckGo lite HTML endpoint — no key required. */
const duckduckgo: SearchProvider = {
  name: "duckduckgo",
  async search(query, limit) {
    const res = await fetch(`https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`, {
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`duckduckgo lite -> ${res.status}`);
    const html = await res.text();
    const hits: SearchHit[] = [];
    // Results are wrapped: //duckduckgo.com/l/?uddg=<urlencoded>&rut=...
    for (const m of html.matchAll(/uddg=([^&"']+)/g)) {
      const url = decodeURIComponent(m[1]);
      if (!url || hits.some((h) => h.url === url)) continue;
      hits.push({ url });
      if (hits.length >= limit) break;
    }
    return hits;
  },
};

/** Brave Search API — BRAVE_API_KEY. */
const brave: SearchProvider = {
  name: "brave",
  async search(query, limit, env) {
    if (!env.BRAVE_API_KEY) throw new Error("BRAVE_API_KEY secret not set");
    const data = (await fetchJson(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`,
      { headers: { "x-subscription-token": env.BRAVE_API_KEY, accept: "application/json" } },
    )) as { web?: { results?: { url: string; title?: string; description?: string }[] } };
    return (data.web?.results ?? []).map((r) => ({ url: r.url, title: r.title, snippet: r.description }));
  },
};

/** Exa search API — EXA_API_KEY. */
const exa: SearchProvider = {
  name: "exa",
  async search(query, limit, env) {
    if (!env.EXA_API_KEY) throw new Error("EXA_API_KEY secret not set");
    const data = (await fetchJson("https://api.exa.ai/search", {
      method: "POST",
      headers: { "x-api-key": env.EXA_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ query, numResults: limit }),
    })) as { results?: { url: string; title?: string; text?: string }[] };
    return (data.results ?? []).map((r) => ({ url: r.url, title: r.title, snippet: r.text?.slice(0, 300) }));
  },
};

/** Perplexity sonar — citations become hits. PERPLEXITY_API_KEY. */
const perplexity: SearchProvider = {
  name: "perplexity",
  async search(query, limit, env) {
    if (!env.PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY secret not set");
    const data = (await fetchJson("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${env.PERPLEXITY_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: `Find official government pages about: ${query}. Return sources.` }],
      }),
    })) as { citations?: string[] };
    return (data.citations ?? []).slice(0, limit).map((url) => ({ url }));
  },
};

/** Firecrawl search API — FIRECRAWL_API_KEY. */
const firecrawl: SearchProvider = {
  name: "firecrawl",
  async search(query, limit, env) {
    if (!env.FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY secret not set");
    const base = env.FIRECRAWL_BASE_URL ?? "https://api.firecrawl.dev";
    const data = (await fetchJson(`${base}/v2/search`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.FIRECRAWL_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ query, limit }),
    })) as { data?: { web?: { url: string; title?: string; description?: string }[] } };
    return (data.data?.web ?? []).map((r) => ({ url: r.url, title: r.title, snippet: r.description }));
  },
};

const PROVIDERS: Record<string, SearchProvider> = {
  duckduckgo,
  brave,
  exa,
  perplexity,
  firecrawl,
};

/** Resolve the configured provider; falls back to duckduckgo. */
export function pickProvider(env: Record<string, string | undefined>): SearchProvider {
  return PROVIDERS[(env.SEARCH_PROVIDER ?? "duckduckgo").toLowerCase()] ?? duckduckgo;
}

/** Rough official-domain heuristic for flagging search hits. */
export function looksOfficial(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.endsWith(".gov") ||
      host.endsWith(".gov.us") ||
      /\.(state|revenue|dor|tax|ftb)\.[a-z-]+\.(us|gov)$/.test(host) ||
      /(^|\.)(revenue|dor|tax|ftb)\./.test(host)
    );
  } catch {
    return false;
  }
}
