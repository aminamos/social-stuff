/* Rural Planning Bot ("Can I Build / Do This?") frontend worker.
 * One worker covers all 60 nonmetro MN counties. Reads county source
 * records from D1 (rural-planning-bot) and serves archived PDFs from R2.
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/counties") {
      const { results } = await env.DB.prepare("SELECT * FROM counties ORDER BY county").all<County>();
      return Response.json(results);
    }

    const apiMatch = url.pathname.match(/^\/api\/counties\/([A-Za-z .']+)$/);
    if (apiMatch) {
      const county = await env.DB.prepare("SELECT * FROM counties WHERE county = ?")
        .bind(apiMatch[1])
        .first<County>();
      if (!county) return Response.json({ error: "unknown county" }, { status: 404 });
      const docs = await env.DB.prepare("SELECT kind, source_url, r2_key, fetched_at FROM documents WHERE county = ?")
        .bind(apiMatch[1])
        .all();
      return Response.json({ ...county, documents: docs.results });
    }

    const pageMatch = url.pathname.match(/^\/county\/([A-Za-z .']+)$/);
    if (pageMatch) {
      const county = await env.DB.prepare("SELECT * FROM counties WHERE county = ?")
        .bind(pageMatch[1])
        .first<County>();
      if (!county) return new Response("Unknown county", { status: 404 });
      const docs = await env.DB.prepare("SELECT kind, source_url, r2_key, fetched_at FROM documents WHERE county = ?")
        .bind(pageMatch[1])
        .all<{ kind: string; source_url: string; r2_key: string | null; fetched_at: string }>();
      const docRows = docs.results
        .map((d) => `<tr><td>${d.kind}</td><td><a href="${d.source_url}" rel="noopener">source</a></td><td>${d.r2_key ?? "—"}</td></tr>`)
        .join("");
      return new Response(
        page(
          `${county.county} County, MN — Can I Build?`,
          `<p><a href="/">← all counties</a></p>
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
${docRows ? `<table><tr><th>Kind</th><th>Source</th><th>R2 key</th></tr>${docRows}</table>` : "<p>None archived yet.</p>"}`
        ),
        { headers: { "content-type": "text/html;charset=utf-8" } }
      );
    }

    if (url.pathname === "/" || url.pathname === "") {
      const { results } = await env.DB.prepare(
        "SELECT county, status, gis_portal_url IS NOT NULL AS has_gis, gis_parcels_service_url IS NOT NULL AS has_parcels FROM counties ORDER BY county"
      ).all<{ county: string; status: string; has_gis: number; has_parcels: number }>();
      const rows = results
        .map(
          (r) =>
            `<tr><td><a href="/county/${encodeURIComponent(r.county)}">${r.county}</a></td>` +
            `<td>${r.status}</td><td>${r.has_gis ? "yes" : "no"}</td><td>${r.has_parcels ? "yes" : "no"}</td></tr>`
        )
        .join("");
      return new Response(
        page(
          "Rural MN Planning Bot — Can I Build / Do This?",
          `<h1>Can I Build / Do This?</h1>
<p>Planning-bot source coverage for Minnesota's 60 nonmetro (rural) counties, per the USDA ERS rural definition (nonmetro county). Pick a county to see its GIS parcel service, zoning ordinance, and city code sources.</p>
<table><tr><th>County</th><th>Status</th><th>GIS portal</th><th>Parcels</th></tr>${rows}</table>`
        ),
        { headers: { "content-type": "text/html;charset=utf-8" } }
      );
    }

    return new Response("Not found", { status: 404 });
  },
};
