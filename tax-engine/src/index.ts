/**
 * Cloudflare Worker API for the TY2025 federal tax engine.
 *
 *   GET  /health          -> { ok, taxYear }
 *   POST /compute         -> TaxResult for a posted TaxInput
 *   POST /returns         -> compute + persist { id, result } (requires D1)
 *   GET  /returns/{id}    -> stored { input, result }         (requires D1)
 *   GET  /artifacts       -> list R2 objects (?prefix= to filter) (requires R2)
 *   GET  /artifacts/{key} -> fetch an R2 object body            (requires R2)
 *   POST /watch/run       -> run tax-watch now (?searches=0 to poll only) (R2)
 *   GET  /watch/status    -> last watch run summary                        (R2)
 *
 * Weekly cron (`triggers.crons`) runs tax-watch: hash-diffs the registered
 * federal/state/local tax-law sources and runs discovery queries through the
 * SEARCH_PROVIDER-configured search provider. Findings land in R2 under
 * watch/. See src/watch/.
 *
 * Everything is stateless per request; D1/R2 bindings are optional — compute
 * routes work without them.
 */

import { compute } from "./engine.js";
import { runWatch } from "./watch/run.js";
import type { TaxInput } from "./types.js";

interface Env {
  DB?: D1Database;
  RETURNS_BUCKET?: R2Bucket;
  SEARCH_PROVIDER?: string;
  WATCH_SEARCH_ENABLED?: string;
  WATCH_SEARCH_LIMIT?: string;
  WATCH_SEARCH_DELAY_MS?: string;
  BRAVE_API_KEY?: string;
  EXA_API_KEY?: string;
  PERPLEXITY_API_KEY?: string;
  FIRECRAWL_API_KEY?: string;
  FIRECRAWL_BASE_URL?: string;
}

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: JSON_HEADERS });
}

function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

const VALID_STATUS = new Set(["single", "mfj", "mfs", "hoh", "qss"]);

function parseInput(raw: unknown): TaxInput | string {
  if (typeof raw !== "object" || raw === null) return "body must be a JSON object";
  const input = raw as TaxInput;
  if (!VALID_STATUS.has(input.filingStatus)) {
    return `filingStatus must be one of ${[...VALID_STATUS].join(", ")}`;
  }
  if (typeof input.taxpayer !== "object" || input.taxpayer === null) {
    return "taxpayer object is required";
  }
  return input;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: JSON_HEADERS });

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, taxYear: 2025, persistence: env.DB ? "d1" : "none" });
      }

      if (request.method === "POST" && url.pathname === "/compute") {
        const parsed = parseInput(await request.json());
        if (typeof parsed === "string") return err(parsed);
        return json(compute(parsed));
      }

      if (request.method === "POST" && url.pathname === "/returns") {
        if (!env.DB) return err("D1 binding not configured", 501);
        const body = (await request.json()) as { input?: unknown };
        const parsed = parseInput(body.input);
        if (typeof parsed === "string") return err(parsed);
        const result = compute(parsed);
        const id = crypto.randomUUID();
        await env.DB.prepare(
          "INSERT INTO returns (id, filing_status, input_json, result_json) VALUES (?, ?, ?, ?)",
        )
          .bind(id, parsed.filingStatus, JSON.stringify(parsed), JSON.stringify(result))
          .run();
        let artifact: string | undefined;
        if (env.RETURNS_BUCKET) {
          artifact = `returns/${id}.json`;
          await env.RETURNS_BUCKET.put(artifact, JSON.stringify({ id, input: parsed, result }), {
            httpMetadata: { contentType: "application/json" },
          });
        }
        return json(artifact ? { id, result, artifact } : { id, result }, 201);
      }

      const match = url.pathname.match(/^\/returns\/([0-9a-f-]+)$/i);
      if (request.method === "GET" && match) {
        if (!env.DB) return err("D1 binding not configured", 501);
        const row = await env.DB.prepare(
          "SELECT id, created_at, filing_status, input_json, result_json FROM returns WHERE id = ?",
        )
          .bind(match[1])
          .first<{ id: string; created_at: string; filing_status: string; input_json: string; result_json: string }>();
        if (!row) return err("not found", 404);
        return json({
          id: row.id,
          createdAt: row.created_at,
          filingStatus: row.filing_status,
          input: JSON.parse(row.input_json),
          result: JSON.parse(row.result_json),
        });
      }

      if (request.method === "GET" && url.pathname === "/artifacts") {
        if (!env.RETURNS_BUCKET) return err("R2 binding not configured", 501);
        const listed = await env.RETURNS_BUCKET.list({
          prefix: url.searchParams.get("prefix") ?? undefined,
          limit: 200,
        });
        return json({
          truncated: listed.truncated,
          cursor: listed.truncated ? listed.cursor : undefined,
          objects: listed.objects.map((o) => ({ key: o.key, size: o.size, uploaded: o.uploaded })),
        });
      }

      const artMatch = url.pathname.match(/^\/artifacts\/(.+)$/);
      if (request.method === "GET" && artMatch) {
        if (!env.RETURNS_BUCKET) return err("R2 binding not configured", 501);
        const key = decodeURIComponent(artMatch[1]);
        const obj = await env.RETURNS_BUCKET.get(key);
        if (!obj) return err("not found", 404);
        const headers = new Headers(JSON_HEADERS);
        headers.set(
          "content-type",
          obj.httpMetadata?.contentType ?? (key.endsWith(".json") ? "application/json" : "application/octet-stream"),
        );
        headers.set("etag", obj.httpEtag);
        return new Response(obj.body, { headers });
      }

      if (request.method === "GET" && url.pathname === "/watch/status") {
        if (!env.RETURNS_BUCKET) return err("R2 binding not configured", 501);
        const obj = await env.RETURNS_BUCKET.get("watch/status.json");
        if (!obj) return err("no watch run recorded yet", 404);
        return new Response(obj.body, { headers: JSON_HEADERS });
      }

      if (request.method === "POST" && url.pathname === "/watch/run") {
        if (!env.RETURNS_BUCKET) return err("R2 binding not configured", 501);
        const searches = url.searchParams.get("searches") !== "0";
        return json(await runWatch(env.RETURNS_BUCKET, env as Record<string, string | undefined>, { searches }));
      }

      return err("not found", 404);
    } catch (e) {
      return err(e instanceof SyntaxError ? "invalid JSON body" : String(e), e instanceof SyntaxError ? 400 : 500);
    }
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.RETURNS_BUCKET) return;
    ctx.waitUntil(runWatch(env.RETURNS_BUCKET, env as Record<string, string | undefined>));
  },
};
