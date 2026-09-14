// Unit tests for the Twin Cities wage-theft registry UI.
// Run: deno test src/ui.test.ts   (also wired into .github/workflows/wage-theft-ui.yml)
import {
  AGENCY_PORTAL_URLS,
  AGENCY_SOURCE_LABELS,
  GLOBAL_PORTALS,
  humanizeStatus,
  isPdfUrl,
  primarySourceFor,
  renderWageTheftUI,
} from "./ui.ts";
import { WAGE_THEFT_SEED_DATA } from "./data.ts";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

// ---------- helpers ----------

Deno.test("humanizeStatus: known statuses become short human labels", () => {
  assert(humanizeStatus("SETTLEMENT_REACHED") === "Settlement reached", "settlement");
  assert(humanizeStatus("JUDGMENT_ENTERED") === "Judgment entered", "judgment");
  assert(humanizeStatus("ACTIVE_LITIGATION") === "Active litigation", "litigation");
  assert(humanizeStatus("CONSENT_DECREE") === "Consent decree", "consent");
  assert(humanizeStatus("VIOLATION_CONFIRMED") === "Violation confirmed", "confirmed");
});

Deno.test("humanizeStatus: output never contains SNAKE_CASE underscores", () => {
  for (const s of ["SETTLEMENT_REACHED", "JUDGMENT_ENTERED", "SOME_FUTURE_STATUS", ""]) {
    assert(!humanizeStatus(s).includes("_"), "underscores in " + JSON.stringify(s));
  }
  assert(humanizeStatus("SOME_FUTURE_STATUS") === "Some Future Status", "fallback title-case");
});

Deno.test("isPdfUrl: true only for real document URLs", () => {
  assert(isPdfUrl("https://www.ag.state.mn.us/Office/Reports/LaborReport_2024.pdf"), "2024 pdf");
  assert(isPdfUrl("https://www.ag.state.mn.us/Office/Reports/LaborReport_2025.pdf"), "2025 pdf");
  assert(isPdfUrl("https://example.com/doc.PDF?x=1"), "case-insensitive + query");
  assert(!isPdfUrl("https://publicaccess.courts.state.mn.us"), "mcro portal");
  assert(!isPdfUrl("https://enforcement.dol.gov"), "dol portal");
  assert(!isPdfUrl("https://www.dli.mn.gov"), "dli portal");
  assert(!isPdfUrl(""), "empty");
  assert(!isPdfUrl(null), "null");
});

Deno.test("primarySourceFor: one link, honest PDF labeling", () => {
  const pdf = primarySourceFor({
    source_agency: "MN_AG_OFFICE",
    source_docket_url: "https://www.ag.state.mn.us/Office/Reports/LaborReport_2025.pdf",
  });
  assert(pdf.href.endsWith(".pdf"), "pdf href passthrough");
  assert(pdf.isPdf && pdf.label.includes("(PDF)"), "pdf labeled PDF");
  assert(pdf.label.includes("Attorney General"), "agency label");

  const portal = primarySourceFor({
    source_agency: "COURT_JUDGMENT",
    source_docket_url: "https://publicaccess.courts.state.mn.us",
  });
  assert(portal.href === "https://publicaccess.courts.state.mn.us", "portal href passthrough");
  assert(!portal.isPdf && !portal.label.includes("(PDF)"), "portal must NOT claim PDF");

  const missing = primarySourceFor({ source_agency: "MN_DLI", source_docket_url: "" });
  assert(missing.href === AGENCY_PORTAL_URLS["MN_DLI"], "agency fallback portal");

  const unknown = primarySourceFor({ source_agency: "NOPE", source_docket_url: "" });
  assert(unknown.href === "https://enforcement.dol.gov", "global fallback");
  assert(unknown.label === "Official docket / agency record", "default label, no PDF claim");
});

// ---------- seed data integrity ----------

Deno.test("seed data: every record links its own https source URL", () => {
  assert(WAGE_THEFT_SEED_DATA.length > 0, "seed non-empty");
  for (const r of WAGE_THEFT_SEED_DATA) {
    assert(
      typeof r.source_docket_url === "string" && r.source_docket_url.startsWith("https://"),
      "bad source_docket_url on " + r.case_id,
    );
  }
});

Deno.test("seed data: every agency is covered by labels + fallback portals", () => {
  const agencies = new Set(WAGE_THEFT_SEED_DATA.map((r) => r.source_agency));
  assert(agencies.size > 1, "multiple agencies present");
  for (const a of agencies) {
    assert(a in AGENCY_SOURCE_LABELS, "missing label for " + a);
    assert(a in AGENCY_PORTAL_URLS, "missing portal for " + a);
  }
});

Deno.test("seed data: AG cases link worker-hosted excerpts, never full reports", () => {
  const docsOrigin = "https://twin-cities-wage-theft-worker.a-8c6.workers.dev/docs/";
  for (const r of WAGE_THEFT_SEED_DATA) {
    if (r.source_agency !== "MN_AG_OFFICE") continue;
    assert(
      r.source_docket_url.startsWith(docsOrigin) && r.source_docket_url.endsWith(".pdf"),
      "AG record must link a hosted excerpt: " + r.case_id,
    );
    assert(!/LaborReport_\d{4}\.pdf([?#]|$)/.test(r.source_docket_url), "no full report: " + r.case_id);
  }
});

Deno.test("seed data: PDF claims match reality for every record", () => {
  for (const r of WAGE_THEFT_SEED_DATA) {
    const src = primarySourceFor(r);
    assert(src.isPdf === src.label.includes("(PDF)"), "label/href mismatch on " + r.case_id);
    if (!isPdfUrl(r.source_docket_url)) assert(!src.label.includes("(PDF)"), "false PDF on " + r.case_id);
  }
});

// ---------- rendered HTML ----------

function cardTemplateRegion(html: string): string {
  const start = html.indexOf("cases.map((");
  const end = html.indexOf(".join('')", start);
  assert(start > 0 && end > start, "card template region found");
  return html.slice(start, end);
}

Deno.test("cards: no repeated generic portal links inside the per-card template", () => {
  const tpl = cardTemplateRegion(renderWageTheftUI());
  for (const p of GLOBAL_PORTALS) {
    assert(!tpl.includes(p.href), "portal repeated per card: " + p.href);
  }
  assert(!tpl.includes("Official Docket Document / Report PDF"), "lying PDF label gone");
  assert(tpl.includes("primarySourceFor(c)"), "card uses single primary source");
  assert(tpl.includes("humanizeStatus(c.status)"), "card uses humanized status");
  assert(!tpl.includes("${c.status}"), "no raw SNAKE status rendered");
});

Deno.test("page: portals appear once in a global strip", () => {
  const html = renderWageTheftUI();
  assert(html.includes("Official sources & agency portals"), "global strip heading");
  for (const p of GLOBAL_PORTALS) {
    assert(html.includes(p.href), "global strip has " + p.href);
  }
  // Agency maps come from one server-side source of truth.
  assert(html.includes(JSON.stringify(AGENCY_SOURCE_LABELS)), "labels serialized to client");
  assert(html.includes(JSON.stringify(AGENCY_PORTAL_URLS)), "portals serialized to client");
  assert(html.includes("/\\.pdf(\\?|#|$)/i"), "client gates (PDF) suffix on intact pdf regex");
});

Deno.test("page: financial grid cannot overflow narrow cards", () => {
  const html = renderWageTheftUI();
  assert(html.includes(".financial-grid > div { min-width: 0; }"), "grid children can shrink");
  assert(html.includes("overflow-wrap: anywhere"), "long values wrap");
  assert(html.includes("status-val"), "status has wrap-safe class");
});

Deno.test("markdown exporters: single primary source, no portal spam", () => {
  const html = renderWageTheftUI();
  const copyStart = html.indexOf("function copyCaseAsMarkdown");
  const exportStart = html.indexOf("function exportWageTheftAsMarkdown");
  const groundedStart = html.indexOf("function getGroundedContext");
  assert(copyStart > 0 && exportStart > copyStart && groundedStart > exportStart, "exporters found");
  for (const body of [html.slice(copyStart, exportStart), html.slice(exportStart, groundedStart)]) {
    assert(body.includes("primarySourceFor(c)"), "exporter uses primary source");
    assert(!body.includes("enforcement.dol.gov"), "no DOL portal spam in exporter");
    assert(!body.includes("publicaccess.courts.state.mn.us"), "no MCRO portal spam in exporter");
    assert(!body.includes("civil-rights/labor-standards"), "no Mpls portal spam in exporter");
  }
});
