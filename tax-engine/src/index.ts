/**
 * Cloudflare Worker API for the TY2025 federal tax engine.
 *
 *   GET  /health          -> { ok, taxYear }
 *   POST /compute         -> TaxResult for a posted TaxInput
 *   POST /returns         -> compute + persist { id, result } (requires D1)
 *   GET  /returns/{id}    -> stored { input, result }         (requires D1)
 *
 * Everything is stateless per request; D1/R2 bindings are optional — compute
 * routes work without them.
 */

import { compute } from "./engine.js";
import type { TaxInput } from "./types.js";

interface Env {
  DB?: D1Database;
  RETURNS_BUCKET?: R2Bucket;
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
        return json({ id, result }, 201);
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

      return err("not found", 404);
    } catch (e) {
      return err(e instanceof SyntaxError ? "invalid JSON body" : String(e), e instanceof SyntaxError ? 400 : 500);
    }
  },
};
