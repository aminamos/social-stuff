// Runtime tests for the worker-hosted /docs/ source-document route.
// Runs WITHOUT type-checking (index.ts references Cloudflare runtime types):
//   deno test --no-check src/docs-route.test.ts
import worker from "./index.ts";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

const PDF_BYTES = new TextEncoder().encode("%PDF-1.4 fake-excerpt");

function envWith(docs: Record<string, Uint8Array>, seen: string[]) {
  return {
    DB: {},
    R2_BUCKET: {
      get: async (key: string) => {
        seen.push(key);
        const b = docs[key];
        if (!b) return null;
        return {
          body: new ReadableStream({
            start(c) {
              c.enqueue(b);
              c.close();
            },
          }),
        };
      },
    },
  };
}

const fetch_ = (w: any, path: string, env: any) =>
  w.fetch(new Request("https://twin-cities-wage-theft-worker.a-8c6.workers.dev" + path), env);

Deno.test("docs route serves a worker-hosted PDF with cache headers", async () => {
  const seen: string[] = [];
  const env = envWith({ "docs/mn-ag-2024-labor-report-p6.pdf": PDF_BYTES }, seen);
  const res = await fetch_(worker, "/docs/mn-ag-2024-labor-report-p6.pdf", env);
  assert(res.status === 200, "status 200, got " + res.status);
  assert(res.headers.get("Content-Type") === "application/pdf", "pdf content type");
  assert((res.headers.get("Cache-Control") || "").includes("immutable"), "immutable cache");
  assert(
    (res.headers.get("Content-Disposition") || "").includes("mn-ag-2024-labor-report-p6.pdf"),
    "inline filename",
  );
  const body = new Uint8Array(await res.arrayBuffer());
  assert(body.join(",") === PDF_BYTES.join(","), "bytes passthrough");
  assert(seen.join(",") === "docs/mn-ag-2024-labor-report-p6.pdf", "exact R2 key");
});

Deno.test("docs route 404s when R2 has no such object", async () => {
  const env = envWith({}, []);
  const res = await fetch_(worker, "/docs/does-not-exist.pdf", env);
  assert(res.status === 404, "missing object is 404, got " + res.status);
});

Deno.test("docs route rejects traversal and non-PDF paths without touching R2", async () => {
  const seen: string[] = [];
  const env = envWith({ "docs/mn-ag-2024-labor-report-p6.pdf": PDF_BYTES }, seen);
  for (const p of ["/docs/", "/docs/notes.txt"]) {
    const res = await fetch_(worker, p, env);
    await res.arrayBuffer().catch(() => {});
    assert(res.status === 404, p + " must 404, got " + res.status);
  }
  // Dot-segments (plain and %2e-encoded) normalize away before routing
  // ("/docs/../x" -> "/x"), so they can never address R2 — but they must
  // still never serve a PDF.
  for (const p of ["/docs/../wrangler.toml", "/docs/%2e%2e/x.pdf", "/docs/%2E%2E/x.pdf"]) {
    const res = await fetch_(worker, p, env);
    await res.arrayBuffer().catch(() => {});
    assert(res.headers.get("Content-Type") !== "application/pdf", p + " never serves a PDF");
  }
  assert(seen.length === 0, "rejected paths never reach R2, saw: " + seen.join(","));
});
