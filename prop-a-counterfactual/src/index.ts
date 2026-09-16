import { INDEX_HTML } from "./ui";
import { runModel, defaultParams, type ModelParams, type CountyRow, type ClassRow } from "./model";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: JSON_HEADERS });
}
function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

async function loadParams(env: Env, url: URL): Promise<{ params: ModelParams; source: "d1" | "defaults" | "query" }> {
  const params = defaultParams();
  let source: "d1" | "defaults" | "query" = "defaults";
  if (env.DB) {
    try {
      const { results } = await env.DB.prepare("SELECT key, value FROM model_params").all<{ key: string; value: string }>();
      const map = new Map(results.map((r) => [r.key, r.value]));
      for (const k of Object.keys(params) as (keyof ModelParams)[]) {
        const raw = map.get(k);
        if (raw == null) continue;
        const v = JSON.parse(raw) as number | string;
        const rec = params as unknown as Record<string, unknown>;
        if (typeof v === "number" && Number.isFinite(v)) rec[k] = v;
        else if (typeof v === "string") rec[k] = v;
      }
      source = "d1";
    } catch { /* fall through to defaults */ }
  }
  // query-string overrides always win (scenario links)
  let touched = false;
  for (const k of Object.keys(params)) {
    const q = url.searchParams.get(k);
    if (q == null) continue;
    const v = Number(q);
    if (Number.isFinite(v)) { (params as unknown as Record<string, unknown>)[k] = v; touched = true; }
  }
  if (touched) source = "query";
  return { params, source };
}

async function loadData(env: Env): Promise<{ counties: CountyRow[]; classes: ClassRow[] } | null> {
  if (!env.DB) return null;
  const [c, cl] = await Promise.all([
    env.DB.prepare("SELECT * FROM counties ORDER BY gap DESC").all<CountyRow>(),
    env.DB.prepare("SELECT * FROM class_values").all<ClassRow>(),
  ]);
  return { counties: c.results, classes: cl.results };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { ...JSON_HEADERS, "access-control-allow-methods": "GET,OPTIONS" } });
    }
    if (request.method !== "GET") return err("GET only", 405);

    switch (url.pathname) {
      case "/":
        return new Response(INDEX_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
      case "/api/model": {
        const data = await loadData(env);
        if (!data) return err("Registry unavailable", 503);
        const { params, source } = await loadParams(env, url);
        return json({ paramsSource: source, result: runModel(data.counties, data.classes, params), generatedAt: new Date().toISOString() });
      }
      case "/api/counties": {
        if (!env.DB) return err("Registry unavailable", 503);
        const { results } = await env.DB.prepare("SELECT * FROM counties ORDER BY gap DESC").all<CountyRow>();
        return json({ counties: results });
      }
      case "/api/series": {
        if (!env.DB) return err("Registry unavailable", 503);
        const { results } = await env.DB.prepare("SELECT * FROM state_series ORDER BY year").all();
        return json({ series: results });
      }
      case "/api/classes": {
        if (!env.DB) return err("Registry unavailable", 503);
        const { results } = await env.DB.prepare("SELECT * FROM class_values ORDER BY year, cls").all();
        return json({ classes: results });
      }
      case "/api/sources": {
        if (!env.DB) return err("Registry unavailable", 503);
        const { results } = await env.DB.prepare(
          "SELECT r2_key, title, source_url, fetched_at, content_type, notes FROM source_documents ORDER BY r2_key",
        ).all();
        return json({
          documents: (results as Array<Record<string, unknown>>).map((r) => ({ ...r, download: `/docs/${r.r2_key}` })),
        });
      }
      default:
        if (url.pathname.startsWith("/docs/")) {
          if (!env.DOCS) return err("Archive unavailable", 503);
          const key = decodeURIComponent(url.pathname.slice("/docs/".length));
          if (!key || key.includes("..")) return err("Bad key", 400);
          const obj = await env.DOCS.get(key);
          if (!obj) return err("Document not found", 404);
          return new Response(obj.body, {
            headers: {
              "content-type": obj.httpMetadata?.contentType ?? "application/octet-stream",
              "cache-control": "public, max-age=86400",
              etag: obj.httpEtag,
            },
          });
        }
        return err("Not found", 404);
    }
  },
} satisfies ExportedHandler<Env>;
