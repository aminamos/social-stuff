/* Rural Planning Bot ("Can I Build / Do This?") frontend worker.
 * One worker covers all 60 nonmetro MN counties. Reads county source
 * records from D1 (rural-planning-bot), serves archived code documents
 * from R2, and re-checks tracked code URLs on a schedule so changes to
 * city codes / zoning ordinances get detected and reported.
 */

interface Env {
  DB: D1Database;
  R2_DATA: R2Bucket;
}

interface County {
  county: string;
  county_seat: string | null;
  gis_portal_url: string | null;
  gis_parcels_service_url: string | null;
  zoning_ordinance_url: string | null;
  city_code_url: string | null;
  assessor_url: string | null;
  status: string;
  notes: string | null;
}

interface Doc {
  county: string;
  kind: string;
  source_url: string;
  r2_key: string | null;
  content_sha256: string | null;
  fetched_at: string;
}

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" };
const DOC_KEY = /^(city-code|zoning)\/[A-Za-z0-9 .'\-\/]+\.(html|pdf)$/;

function link(label: string, url: string | null): string {
  return url ? `<a href="${url}" rel="noopener">${label}</a>` : `<span class="missing">${label}: not yet found</span>`;
}

function page(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem;line-height:1.5}
.missing{color:#888}.badge{font-size:.8em;background:#eee;border-radius:.5em;padding:.1em .5em}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:.4em;text-align:left}</style>
</head><body>${body}</body></html>`;
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function extFor(url: string, contentType: string): string {
  if (contentType.includes("pdf") || url.toLowerCase().endsWith(".pdf")) return "pdf";
  return "html";
}

/** Re-fetch one tracked source; archive + log when the bytes changed. */
async function recheckSource(
  env: Env, county: string, kind: "city_code" | "zoning", sourceUrl: string, prefix: string
): Promise<{ changed: boolean; detail: string }> {
  const latest = await env.DB.prepare(
    "SELECT r2_key, content_sha256 FROM documents WHERE county = ? AND kind = ? AND r2_key IS NOT NULL ORDER BY fetched_at DESC LIMIT 1"
  ).bind(county, kind).first<{ r2_key: string; content_sha256: string | null }>();
  let resp: Response;
  try {
    resp = await fetch(sourceUrl, { headers: UA });
  } catch (e) {
    return { changed: false, detail: `fetch failed: ${String(e)}` };
  }
  if (!resp.ok) return { changed: false, detail: `HTTP ${resp.status}` };
  const bytes = await resp.arrayBuffer();
  const hash = await sha256Hex(bytes);
  if (latest && latest.content_sha256 === hash) {
    await env.DB.prepare("UPDATE documents SET checked_at = datetime('now') WHERE county = ? AND kind = ? AND r2_key = ?")
      .bind(county, kind, latest.r2_key).run();
    return { changed: false, detail: "unchanged" };
  }
  const stamp = new Date().toISOString().slice(0, 10);
  const ext = extFor(sourceUrl, resp.headers.get("content-type") ?? "");
  const newKey = `${prefix}/${county}/${stamp}.${ext}`;
  await env.R2_DATA.put(newKey, bytes);
  await env.DB.prepare(
    "INSERT INTO documents (county, kind, source_url, r2_key, content_sha256, checked_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
  ).bind(county, kind, sourceUrl, newKey, hash).run();
  if (latest) {
    await env.DB.prepare(
      "INSERT INTO change_log (county, kind, old_r2_key, new_r2_key, old_sha256, new_sha256) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(county, kind, latest.r2_key, newKey, latest.content_sha256, hash).run();
    return { changed: true, detail: `changed: ${latest.r2_key} -> ${newKey}` };
  }
  return { changed: true, detail: `first archive: ${newKey}` };
}

/** Re-fetch one archived child document by row id; update in place on change. */
async function recheckDocument(
  env: Env, id: number
): Promise<{ changed: boolean; detail: string }> {
  const doc = await env.DB.prepare(
    "SELECT county, kind, source_url, r2_key, content_sha256 FROM documents WHERE id = ?"
  ).bind(id).first<{ county: string; kind: string; source_url: string; r2_key: string | null; content_sha256: string | null }>();
  if (!doc || !doc.r2_key) return { changed: false, detail: "no archived copy" };
  let resp: Response;
  try {
    resp = await fetch(doc.source_url, { headers: UA });
  } catch (e) {
    return { changed: false, detail: `fetch failed: ${String(e)}` };
  }
  if (!resp.ok) return { changed: false, detail: `HTTP ${resp.status}` };
  const bytes = await resp.arrayBuffer();
  const hash = await sha256Hex(bytes);
  if (hash === doc.content_sha256) {
    await env.DB.prepare("UPDATE documents SET checked_at = datetime('now') WHERE id = ?").bind(id).run();
    return { changed: false, detail: "unchanged" };
  }
  await env.R2_DATA.put(doc.r2_key, bytes);
  await env.DB.prepare(
    "UPDATE documents SET content_sha256 = ?, checked_at = datetime('now') WHERE id = ?"
  ).bind(hash, id).run();
  await env.DB.prepare(
    "INSERT INTO change_log (county, kind, old_r2_key, new_r2_key, old_sha256, new_sha256) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(doc.county, doc.kind, doc.r2_key, doc.r2_key, doc.content_sha256, hash).run();
  return { changed: true, detail: `refreshed in place: ${doc.r2_key}` };
}

async function recheckCounty(env: Env, county: string): Promise<object> {
  const row = await env.DB.prepare("SELECT * FROM counties WHERE county = ?").bind(county).first<County>();
  if (!row) return { county, error: "unknown county" };
  const out: Record<string, object> = {};
  if (row.city_code_url) out.city_code = await recheckSource(env, county, "city_code", row.city_code_url, "city-code");
  if (row.zoning_ordinance_url) out.zoning = await recheckSource(env, county, "zoning", row.zoning_ordinance_url, "zoning");
  // Child documents (per-PDF archives): refresh the stalest few in place so a
  // county official editing or deleting a file can't silently rot our copy.
  // Capped per run so the monthly sweep stays inside Worker CPU limits.
  const stale = await env.DB.prepare(
    `SELECT id FROM documents WHERE county = ? AND r2_key IS NOT NULL
     AND source_url NOT IN (?, ?) ORDER BY checked_at ASC LIMIT 5`
  ).bind(county, row.city_code_url ?? "", row.zoning_ordinance_url ?? "").all<{ id: number }>();
  const refreshed: Record<string, object> = {};
  for (const { id } of (stale.results || [])) {
    try {
      refreshed[String(id)] = await recheckDocument(env, id);
    } catch {
      refreshed[String(id)] = { changed: false, detail: "error" };
    }
  }
  if (Object.keys(refreshed).length) out.child_docs = refreshed;
  return { county, ...out };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/counties") {
      const { results } = await env.DB.prepare("SELECT * FROM counties ORDER BY county").all<County>();
      return Response.json(results);
    }

    const recheck = url.pathname === "/api/recheck" ? url.searchParams.get("county") : null;
    if (recheck) {
      return Response.json(await recheckCounty(env, recheck));
    }

    if (url.pathname === "/changes") {
      const { results } = await env.DB.prepare(
        "SELECT county, kind, old_r2_key, new_r2_key, detected_at FROM change_log ORDER BY detected_at DESC LIMIT 100"
      ).all<Record<string, string>>();
      const rows = results
        .map((c) =>
          `<tr><td>${c.detected_at.slice(0, 10)}</td><td><a href="/county/${encodeURIComponent(c.county)}">${c.county}</a></td>` +
          `<td>${c.kind}</td><td><a href="/docs/${c.old_r2_key}">before</a> → <a href="/docs/${c.new_r2_key}">after</a></td></tr>`)
        .join("");
      return new Response(
        page("Code changes detected", `<p><a href="/">← all counties</a></p><h1>Detected code changes</h1>
${rows ? `<table><tr><th>Date</th><th>County</th><th>Kind</th><th>Diff</th></tr>${rows}</table>` : "<p>No changes detected yet. Tracked city codes and zoning pages are re-checked on schedule.</p>"}`),
        { headers: { "content-type": "text/html;charset=utf-8" } }
      );
    }

    if (url.pathname.startsWith("/docs/")) {
      const key = decodeURIComponent(url.pathname.slice("/docs/".length));
      if (!DOC_KEY.test(key) || key.includes("..")) return new Response("Not found", { status: 404 });
      const obj = await env.R2_DATA.get(key);
      if (!obj) return new Response("Not found", { status: 404 });
      const headers: Record<string, string> = {};
      if (key.endsWith(".pdf")) headers["content-type"] = "application/pdf";
      else headers["content-type"] = "text/html;charset=utf-8";
      return new Response(obj.body, { headers });
    }

    const apiMatch = url.pathname.match(/^\/api\/counties\/(.+)$/);
    if (apiMatch) {
      let name = "";
      try { name = decodeURIComponent(apiMatch[1]); } catch { /* fall through to 404 */ }
      if (!/^[A-Za-z .']+$/.test(name)) return Response.json({ error: "unknown county" }, { status: 404 });
      const county = await env.DB.prepare("SELECT * FROM counties WHERE county = ?")
        .bind(name).first<County>();
      if (!county) return Response.json({ error: "unknown county" }, { status: 404 });
      const docs = await env.DB.prepare("SELECT kind, source_url, r2_key, fetched_at FROM documents WHERE county = ?")
        .bind(name).all();
      return Response.json({ ...county, documents: docs.results });
    }

    const pageMatch = url.pathname.match(/^\/county\/(.+)$/);
    if (pageMatch) {
      let name = "";
      try { name = decodeURIComponent(pageMatch[1]); } catch { /* fall through to 404 */ }
      if (!/^[A-Za-z .']+$/.test(name)) return new Response("Unknown county", { status: 404 });
      const county = await env.DB.prepare("SELECT * FROM counties WHERE county = ?")
        .bind(name).first<County>();
      if (!county) return new Response("Unknown county", { status: 404 });
      const docs = await env.DB.prepare("SELECT kind, source_url, r2_key, fetched_at FROM documents WHERE county = ?")
        .bind(name).all<{ kind: string; source_url: string; r2_key: string | null; fetched_at: string }>();
      const docRows = docs.results
        .map((d) => `<tr><td>${d.kind}</td><td><a href="${d.source_url}" rel="noopener">source</a></td><td>${d.r2_key ? `<a href="/docs/${d.r2_key}">archived</a>` : "—"}</td></tr>`)
        .join("");
      return new Response(
        page(
          `${county.county} County, MN — Can I Build?`,
          `<p><a href="/">← all counties</a> · <a href="/changes">code changes</a></p>
<h1>${county.county} County, MN <span class="badge">${county.status}</span></h1>
<ul>
<li>County seat: ${county.county_seat ?? "not yet researched"}</li>
<li>${link("GIS open data portal", county.gis_portal_url)}</li>
<li>${link("Parcel feature service", county.gis_parcels_service_url)}</li>
<li>${link("County zoning ordinance", county.zoning_ordinance_url)}</li>
<li>${link("Municipal (county seat) code", county.city_code_url)}</li>
<li>${link("Assessor / property-tax records", county.assessor_url)}</li>
</ul>
${county.notes ? `<p><strong>Review notes:</strong> ${county.notes}</p>` : ""}
<h2>Archived documents</h2>
${docRows ? `<table><tr><th>Kind</th><th>Source</th><th>Archive</th></tr>${docRows}</table>` : "<p>None archived yet.</p>"}`
        ),
        { headers: { "content-type": "text/html;charset=utf-8" } }
      );
    }

    if (url.pathname === "/" || url.pathname === "") {
      const { results } = await env.DB.prepare(
        "SELECT county, status, gis_portal_url IS NOT NULL AS has_gis, gis_parcels_service_url IS NOT NULL AS has_parcels FROM counties ORDER BY county"
      ).all<{ county: string; status: string; has_gis: number; has_parcels: number }>();
      const rows = results
        .map((r) =>
          `<tr><td><a href="/county/${encodeURIComponent(r.county)}">${r.county}</a></td>` +
          `<td>${r.status}</td><td>${r.has_gis ? "yes" : "no"}</td><td>${r.has_parcels ? "yes" : "no"}</td></tr>`)
        .join("");
      return new Response(
        page(
          "Rural MN Planning Bot — Can I Build / Do This?",
          `<h1>Can I Build / Do This?</h1>
<p>Planning-bot source coverage for Minnesota's 60 nonmetro (rural) counties, per the USDA ERS rural definition (nonmetro county). Pick a county to see its GIS parcel service, zoning ordinance, and city code sources. See <a href="/changes">detected code changes</a>.</p>
<table><tr><th>County</th><th>Status</th><th>GIS portal</th><th>Parcels</th></tr>${rows}</table>`
        ),
        { headers: { "content-type": "text/html;charset=utf-8" } }
      );
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const { results } = await env.DB.prepare("SELECT county FROM counties ORDER BY county").all<{ county: string }>();
    for (const { county } of results) {
      try {
        await recheckCounty(env, county);
      } catch {
        // one county failing must not stop the sweep
      }
    }
  },
};
