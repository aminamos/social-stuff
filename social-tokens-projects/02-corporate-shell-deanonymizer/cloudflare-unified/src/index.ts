// Unified Twin Cities Housing + Labor Standards Registry (4th worker).
//
// Merges the three standalone workers without changing their behavior:
//   - housing registry  (mpls-rental-sync-worker):  /search /cities /sync/* ...
//   - wage-theft registry (twin-cities-wage-theft-worker): /cases /offenders/top ...
//   - crossover matrix (twin-cities-slumlord-labor-matrix): /matrix ...
// New development lands here under /api/* and mounted sub-UIs.
// Legacy bare paths are preserved (see README route table) so the three
// embedded UIs keep working unmodified, except two remapped links:
//   crossover UI export  -> /crossover/export.md
//   labor UI sync-status -> /labor/sync/status

import { renderUI as renderHousingUI } from "./housing/housing-ui";
import { ADAPTERS } from "./housing/adapters";
import {
  D1_QUERY_BUDGET,
  runSyncTick,
  syncOne,
  loadStates,
} from "./housing/sync";
import {
  VIOLATION_ADAPTERS,
  getViolationAdapter,
  syncViolationAdapter,
} from "./housing/violations";
import { WAGE_THEFT_SEED_DATA } from "./labor/data";
import { runLiveEnforcementSync } from "./labor/live_sync";
import { renderWageTheftUI } from "./labor/labor-ui";
import { renderCrossoverUI } from "./crossover/crossover-ui";
import { VERIFIED_CROSSOVER_SYNDICATES } from "./crossover/matrix-data";
import { renderUnifiedUI } from "./ui-unified";

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  AUTH_SECRET?: string;
  SOCRATA_APP_TOKEN?: string;
  DOL_API_KEY?: string;
}

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

function html(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

function authorized(request: Request, env: Env): boolean {
  if (!env.AUTH_SECRET) return true;
  return request.headers.get("Authorization") === `Bearer ${env.AUTH_SECRET}`;
}

function isDeRomaQuery(q: string): boolean {
  return /deroma|de\s*roma|jager|j[aä]ger|club\s*j|teutohellene|hansaware/i.test(q);
}

export default {
  /**
   * Merged cron dispatch (see wrangler.toml):
   *   - 04:00 daily  -> fresh housing full-cycle reset
   *   - every 15 min -> resume unfinished housing jurisdictions
   *   - 05:00 daily  -> wage-theft live enforcement sync
   *   - 06:00 daily  -> crossover matrix R2 snapshot
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (event.cron === "0 5 * * *") {
      ctx.waitUntil(runLiveEnforcementSync(env));
    } else if (event.cron === "0 6 * * *") {
      ctx.waitUntil((async () => {
        await backupMatrixSnapshot(env);
        // Rebuild the materialized dual-match table; the live instr() join is
        // too large for request-time queries. Chunks resume via sync_state if
        // the event dies before finishing.
        for (let guard = 0; guard < 60; guard++) {
          const r = await rebuildDualMatches(env, 25);
          if (r.done) break;
        }
      })());
    } else {
      const isDaily = event.cron === "0 4 * * *";
      ctx.waitUntil(runSyncTick(env, { reset: isDaily }));
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    console.log(JSON.stringify({
      event: "request",
      path: url.pathname,
      country: request.cf?.country ?? null,
      region: request.cf?.region ?? null,
      city: request.cf?.city ?? null,
      asn: request.cf?.asn ?? null,
    }));

    // ------------------------------------------------------------ UIs
    if (url.pathname === "/" || url.pathname === "") return html(renderUnifiedUI());
    if (url.pathname === "/housing") return html(renderHousingUI());
    if (url.pathname === "/labor") return html(renderWageTheftUI());
    if (url.pathname === "/crossover") return html(renderCrossoverUI());

    // Worker-hosted primary source documents (R2): one quick excerpt PDF per
    // case, so readers never have to scroll a full-length agency report.
    if (url.pathname.startsWith("/docs/")) {
      const key = url.pathname.slice(1);
      if (!/^docs\/[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$/.test(key)) {
        return new Response("Not found", { status: 404 });
      }
      const obj = await env.R2_BUCKET.get(key);
      if (!obj) {
        return new Response("Not found", { status: 404 });
      }
      return new Response(obj.body, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${key.split("/").pop()}"`,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
    // -------------------------------------------------- housing ingest
    if (url.pathname === "/sync" && request.method === "POST") {
      if (!authorized(request, env)) return new Response("Unauthorized", { status: 401 });
      const reset = url.searchParams.get("reset") === "1";
      const budget = parseInt(url.searchParams.get("budget") || String(D1_QUERY_BUDGET), 10);
      const results = await runSyncTick(env, { reset, budget });
      return json({ status: "sync tick complete", budget, results });
    }

    // Labor live sync BEFORE the generic /sync/:feed catch (else "live"
    // would resolve as a housing feed id). Accepts GET or POST, as legacy.
    if (url.pathname === "/sync/live" || url.pathname === "/labor/sync/live") {
      try {
        const syncResult = await runLiveEnforcementSync(env);
        return new Response(JSON.stringify(syncResult, null, 2), {
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    // Combined sync status: housing feed cursors (legacy shape, `.feeds`)
    // plus labor telemetry (`.sync_history`). Both legacy consumers read
    // only their own key, so the superset keeps each working.
    if (url.pathname === "/sync/status") {
      const states = await loadStates(env);
      const feeds = ADAPTERS.map((a) => ({
        feed_id: a.feed.id,
        kind: "registry",
        label: a.feed.label,
        defaults: a.defaults,
        platform: a.source.platform,
        dataset: a.source.dataset,
        linker: a.linker,
        note: a.note || null,
        sync: states.get(a.feed.id) || null,
      }));
      const violationFeeds = VIOLATION_ADAPTERS.map((a) => ({
        feed_id: a.feed.id,
        kind: "violations",
        label: a.feed.label,
        enabled: a.enabled,
        platform: a.source.platform,
        dataset: a.source.dataset,
        note: a.note || null,
        sync: states.get(a.feed.id) || null,
      }));
      let syncHistory: unknown[] = [];
      try {
        const logs = await env.DB.prepare(
          `SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10`,
        ).all();
        syncHistory = logs.results;
      } catch {
        syncHistory = [];
      }
      return json({ feeds: [...feeds, ...violationFeeds], sync_history: syncHistory });
    }

    if (url.pathname === "/labor/sync/status") {
      try {
        const logs = await env.DB.prepare(
          `SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10`,
        ).all();
        return new Response(JSON.stringify({ sync_history: logs.results }, null, 2), {
          headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
        });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    if (url.pathname.startsWith("/sync/")) {
      if (!authorized(request, env)) return new Response("Unauthorized", { status: 401 });
      const id = url.pathname.slice("/sync/".length);
      const reset = url.searchParams.get("reset") === "1";
      const budgetParam = url.searchParams.get("budget");
      const budget = budgetParam ? parseInt(budgetParam, 10) : undefined;
      const result = await syncOne(env, id, { reset, budget });
      if (result) return json({ status: "ok", result });
      const vAdapter = getViolationAdapter(id);
      if (vAdapter) {
        const states = await loadStates(env);
        const vResult = await syncViolationAdapter(env, vAdapter, {
          budget,
          state: states.get(id),
          reset,
        });
        return json({ status: "ok", result: vResult });
      }
      return json({ error: `Unknown jurisdiction: ${id}` }, { status: 404 });
    }
    // -------------------------------------------------- housing reference
    if (url.pathname === "/feeds") {
      const registry = ADAPTERS.map((a) => ({
        feed_id: a.feed.id,
        kind: "registry",
        label: a.feed.label,
        defaults: a.defaults,
        platform: a.source.platform,
        dataset: a.source.dataset,
        endpoint: a.source.endpoint,
        linker: a.linker,
        severity_map: a.severityMap,
        note: a.note || null,
      }));
      const violations = VIOLATION_ADAPTERS.map((a) => ({
        feed_id: a.feed.id,
        kind: "violations",
        label: a.feed.label,
        enabled: a.enabled,
        platform: a.source.platform,
        dataset: a.source.dataset,
        endpoint: a.source.endpoint,
        note: a.note || null,
      }));
      return json({ count: registry.length + violations.length, feeds: [...registry, ...violations] });
    }

    if (url.pathname === "/violations") {
      try {
        const perFeed = await env.DB.prepare(`
          SELECT feed_id, COUNT(*) as rows,
                 SUM(is_open) as open_rows,
                 COUNT(DISTINCT join_key) as parcels
          FROM violations
          GROUP BY feed_id
        `).all();
        const matched = await env.DB.prepare(`
          SELECT COUNT(DISTINCT v.join_key) as matched_parcels
          FROM violations v
          WHERE v.is_open = 1 AND v.join_key IS NOT NULL
            AND EXISTS (SELECT 1 FROM rental_licenses r WHERE r.apn = v.join_key)
        `).first() as any;
        const total = await env.DB.prepare(`
          SELECT COUNT(DISTINCT join_key) as open_parcels
          FROM violations
          WHERE is_open = 1 AND join_key IS NOT NULL
        `).first() as any;
        const matchedParcels = (matched?.matched_parcels as number) || 0;
        const openParcels = (total?.open_parcels as number) || 0;
        return json({
          feeds: perFeed.results,
          bbl_resolution: {
            open_parcels: openParcels,
            matched_parcels: matchedParcels,
            unmatched_parcels: openParcels - matchedParcels,
          },
        });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    if (url.pathname === "/cities") {
      const citiesRes = await env.DB.prepare(`
        SELECT jurisdiction_id, city, county, state,
               COUNT(*) as license_count,
               SUM(units) as total_units
        FROM rental_licenses
        GROUP BY jurisdiction_id, city, county, state
        ORDER BY license_count DESC
      `).all();
      return json({ cities: citiesRes.results });
    }
    // -------------------------------------------------- housing search
    if (url.pathname === "/search" || url.pathname === "/api/landlords") {
      const accept = request.headers.get("Accept") || "";
      if (accept.includes("text/html") && url.pathname === "/search") {
        return html(renderHousingUI());
      }
      const q = (url.searchParams.get("q") || "").trim();
      const jurisdiction = (url.searchParams.get("jurisdiction") || "").trim();
      const city = (url.searchParams.get("city") || "").trim();
      const severity = (url.searchParams.get("severity") || "").trim().toUpperCase();
      const state = (url.searchParams.get("state") || "").trim().toUpperCase();
      const atRisk = url.searchParams.get("at_risk") === "1";
      if (!q && !jurisdiction && !city && !severity && !state && !atRisk) {
        return json(
          { error: "Provide at least one of ?q=, ?jurisdiction=, ?city=, ?severity=, ?state=, ?at_risk=1" },
          { status: 400 },
        );
      }
      const deRoma = isDeRomaQuery(q);
      const pattern = `%${q}%`;
      const tokenPattern = `%${q.replace(/\s+/g, "%")}%`;
      const noSpacePattern = `%${q.replace(/\s+/g, "")}%`;
      try {
        const searchRes = await env.DB.prepare(`
          SELECT
            r.parcel_id, r.apn, r.feed_id, r.jurisdiction_id, r.address, r.city, r.county, r.state,
            r.owner_name, r.owner_address, r.applicant_name, r.applicant_email,
            r.units, r.tier, r.severity_class, r.status,
            r.source_platform, r.source_dataset,
            (SELECT COUNT(*) FROM violations v
             WHERE v.join_key = r.apn AND v.is_open = 1) as open_violations,
            (SELECT CASE MAX(CASE v.violation_class
               WHEN 'C' THEN 3 WHEN 'B' THEN 2 WHEN 'A' THEN 1 ELSE 0 END)
             WHEN 3 THEN 'C' WHEN 2 THEN 'B' WHEN 1 THEN 'A' ELSE NULL END
             FROM violations v
             WHERE v.join_key = r.apn AND v.is_open = 1) as worst_open_class,
            (SELECT COUNT(*) FROM rental_licenses r2
             WHERE r.link_key IS NOT NULL AND r2.link_key = r.link_key) as sister_properties_count,
            (SELECT SUM(r3.units) FROM rental_licenses r3
             WHERE r.link_key IS NOT NULL AND r3.link_key = r.link_key) as total_syndicate_units,
            (SELECT COALESCE(
               (SELECT dm.case_id || '::' || dm.violation_type || '::' || dm.back_wages_recovered || '::' || dm.workers_affected || '::' || COALESCE(dm.provenance_type, 'PROTOTYPE_SEED_PENDING_FOIA')
                FROM dual_matches dm
                WHERE dm.landlord_name = r.owner_name LIMIT 1),
               (SELECT w.case_id || '::' || w.violation_type || '::' || w.back_wages_recovered || '::' || w.workers_affected || '::' || COALESCE(w.provenance_type, 'PROTOTYPE_SEED_PENDING_FOIA')
                FROM wage_theft_records w
                WHERE (lower(w.trade_name) LIKE '%jager%' OR lower(w.respondent_legal_name) LIKE '%deroma%') AND (
                    instr(lower(r.owner_name), 'deroma') > 0
                    OR instr(lower(r.owner_name), 'de roma') > 0
                    OR instr(lower(r.applicant_name), 'deroma') > 0
                    OR instr(lower(r.applicant_name), 'de roma') > 0
                    OR instr(lower(r.owner_address), '4133 dupont') > 0
                    OR r.apn = '2202924210384'
                )
                LIMIT 1)
            )) as wage_theft_match
          FROM rental_licenses r
          WHERE (
              r.owner_name LIKE ?1
              OR r.applicant_name LIKE ?1
              OR r.applicant_email LIKE ?1
              OR r.address LIKE ?1
              OR r.apn LIKE ?1
              OR r.owner_address LIKE ?1
              OR r.city LIKE ?1
              OR r.state LIKE ?1
              OR r.tier LIKE ?1
              OR r.owner_name LIKE ?2
              OR r.applicant_name LIKE ?2
              OR r.owner_name LIKE ?3
              OR r.applicant_name LIKE ?3
              OR (?4 = 1 AND (
                  lower(r.owner_name) LIKE '%deroma%'
                  OR lower(r.owner_name) LIKE '%de roma%'
                  OR lower(r.applicant_name) LIKE '%deroma%'
                  OR lower(r.applicant_name) LIKE '%de roma%'
                  OR lower(r.owner_address) LIKE '%4133 dupont%'
                  OR r.applicant_email IN ('teutohellene@gmail.com', 'hansaware@gmail.com')
                  OR r.apn = '2202924210384'
                  OR r.address LIKE '%923 WASHINGTON%'
              ))
          )
          AND (?5 = '' OR r.jurisdiction_id = ?5)
          AND (?6 = '' OR r.city = ?6)
          AND (?7 = '' OR r.severity_class = ?7)
          AND (?8 = '' OR r.state = ?8)
          AND (?9 = 0 OR r.severity_class = 'C'
              OR EXISTS (SELECT 1 FROM violations v
                         WHERE v.join_key = r.apn AND v.is_open = 1
                           AND v.violation_class = 'C'))
          ORDER BY r.units DESC
          LIMIT 50
        `).bind(
          pattern, tokenPattern, noSpacePattern, deRoma ? 1 : 0,
          jurisdiction, city, severity, state, atRisk ? 1 : 0,
        ).all();
        return json({ query: q, jurisdiction, city, severity, state, at_risk: atRisk, results: searchRes.results });
      } catch (err: any) {
        return json({ error: err.message, stack: err.stack }, { status: 500 });
      }
    }

    if (url.pathname === "/wage-theft") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) return json({ error: "Missing query param ?q=" }, { status: 400 });
      const deRoma = isDeRomaQuery(q);
      const pattern = `%${q}%`;
      const tokenPattern = `%${q.replace(/\s+/g, "%")}%`;
      const wageRes = await env.DB.prepare(`
        SELECT * FROM wage_theft_records
        WHERE respondent_legal_name LIKE ?1
           OR trade_name LIKE ?1
           OR case_id LIKE ?1
           OR description LIKE ?1
           OR address LIKE ?1
           OR respondent_legal_name LIKE ?2
           OR trade_name LIKE ?2
           OR (?3 = 1 AND (
               lower(respondent_legal_name) LIKE '%deroma%'
               OR lower(respondent_legal_name) LIKE '%de roma%'
               OR lower(trade_name) LIKE '%jager%'
               OR lower(trade_name) LIKE '%jäger%'
               OR lower(address) LIKE '%923 washington%'
           ))
        ORDER BY (back_wages_recovered + settlement_amount) DESC
        LIMIT 50
      `).bind(pattern, tokenPattern, deRoma ? 1 : 0).all();
      return json({ query: q, results: wageRes.results });
    }

    if (url.pathname === "/wage-theft/top") {
      const topRes = await env.DB.prepare(`
        SELECT
          respondent_legal_name,
          trade_name,
          city,
          COUNT(*) as case_count,
          SUM(back_wages_recovered) as total_back_wages,
          SUM(civil_penalties_assessed) as total_penalties,
          SUM(COALESCE(NULLIF(settlement_amount, 0), back_wages_recovered + civil_penalties_assessed)) as total_recovered,
          SUM(workers_affected) as total_workers_affected,
          MAX(repeat_violator) as is_repeat_violator
        FROM wage_theft_records
        GROUP BY respondent_legal_name
        ORDER BY total_recovered DESC
        LIMIT 20
      `).all();
      return json({ top_wage_theft_offenders: topRes.results });
    }
    // -------------------------------------------------- labor cases
    if (url.pathname === "/cases" || url.pathname === "/api/wage-theft") {
      const accept = request.headers.get("Accept") || "";
      if (accept.includes("text/html") && url.pathname === "/cases") {
        return html(renderWageTheftUI());
      }
      const q = (url.searchParams.get("q") || "").trim();
      const agency = (url.searchParams.get("agency") || "").trim();
      const cityFilter = (url.searchParams.get("city") || "").trim();
      const repeatOnly = url.searchParams.get("repeat") === "true";
      let queryStr = `SELECT * FROM wage_theft_records WHERE 1=1`;
      const binds: any[] = [];
      if (q) {
        const deRoma = isDeRomaQuery(q);
        binds.push(`%${q}%`);
        const idx1 = binds.length;
        binds.push(`%${q.replace(/\s+/g, "%")}%`);
        const idx2 = binds.length;
        binds.push(deRoma ? 1 : 0);
        const idx3 = binds.length;
        queryStr += ` AND (
          respondent_legal_name LIKE ?${idx1}
          OR trade_name LIKE ?${idx1}
          OR case_id LIKE ?${idx1}
          OR description LIKE ?${idx1}
          OR violation_type LIKE ?${idx1}
          OR address LIKE ?${idx1}
          OR city LIKE ?${idx1}
          OR respondent_legal_name LIKE ?${idx2}
          OR trade_name LIKE ?${idx2}
          OR (?${idx3} = 1 AND (
              lower(respondent_legal_name) LIKE '%deroma%'
              OR lower(respondent_legal_name) LIKE '%de roma%'
              OR lower(trade_name) LIKE '%jager%'
              OR lower(trade_name) LIKE '%jäger%'
              OR lower(address) LIKE '%923 washington%'
          ))
        )`;
      }
      if (agency) {
        binds.push(agency);
        queryStr += ` AND source_agency = ?${binds.length}`;
      }
      if (cityFilter) {
        binds.push(cityFilter);
        queryStr += ` AND city = ?${binds.length}`;
      }
      if (repeatOnly) queryStr += ` AND repeat_violator = 1`;
      queryStr += ` ORDER BY (back_wages_recovered + civil_penalties_assessed) DESC LIMIT 100`;
      try {
        const stmt = env.DB.prepare(queryStr);
        const res = binds.length > 0 ? await stmt.bind(...binds).all() : await stmt.all();
        return json({ query: q, agency, city: cityFilter, cases: res.results });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    if (url.pathname === "/offenders/top") {
      try {
        const topRes = await env.DB.prepare(`
          SELECT
            respondent_legal_name,
            trade_name,
            industry_description,
            city,
            state,
            COUNT(*) as case_count,
            SUM(back_wages_recovered) as total_back_wages,
            SUM(civil_penalties_assessed) as total_penalties,
            SUM(COALESCE(NULLIF(settlement_amount, 0), back_wages_recovered + civil_penalties_assessed)) as total_recovered,
            SUM(workers_affected) as total_workers_affected,
            MAX(repeat_violator) as is_repeat_violator
          FROM wage_theft_records
          GROUP BY respondent_legal_name
          ORDER BY total_recovered DESC
          LIMIT 25
        `).all();
        return json({ top_offenders: topRes.results });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    if (url.pathname === "/labor/stats") {
      try {
        const stats = await env.DB.prepare(`
          SELECT
            COUNT(*) as total_cases,
            SUM(back_wages_recovered) as total_back_wages,
            SUM(civil_penalties_assessed) as total_penalties,
            SUM(COALESCE(NULLIF(settlement_amount, 0), back_wages_recovered + civil_penalties_assessed)) as total_recovered,
            SUM(workers_affected) as total_workers_affected,
            SUM(CASE WHEN repeat_violator = 1 THEN 1 ELSE 0 END) as repeat_violator_count
          FROM wage_theft_records
        `).first();
        return json({ stats });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    if (url.pathname === "/export.csv") {
      try {
        const allCases = await env.DB.prepare(`
          SELECT
            case_id, source_agency, respondent_legal_name, trade_name, address, city, state, zip_code,
            industry_description, violation_type, back_wages_recovered, civil_penalties_assessed,
            settlement_amount, workers_affected, repeat_violator, status, findings_date, description,
            COALESCE(provenance_type, 'PROTOTYPE_SEED_PENDING_FOIA') as provenance_type,
            COALESCE(source_docket_url, '') as source_docket_url
          FROM wage_theft_records
          ORDER BY (back_wages_recovered + civil_penalties_assessed) DESC
        `).all();
        const headers = [
          "Case ID", "Agency", "Employer Legal Name", "Trade Name", "Address", "City", "State", "Zip",
          "Industry", "Violation Type", "Back Wages ($)", "Civil Penalties ($)", "Settlement Amount ($)",
          "Workers Affected", "Repeat Violator", "Status", "Findings Date", "Description", "Data Provenance", "Docket URL",
        ];
        const csvCell = (v: unknown): string => `"${String(v ?? "").replace(/"/g, '""')}"`;
        let csv = headers.join(",") + "\n";
        for (const row of allCases.results as any[]) {
          const vals = [
            csvCell(row.case_id),
            csvCell(row.source_agency),
            csvCell(row.respondent_legal_name),
            csvCell(row.trade_name),
            csvCell(row.address),
            csvCell(row.city),
            csvCell(row.state),
            csvCell(row.zip_code),
            csvCell(row.industry_description),
            csvCell(row.violation_type),
            csvCell(row.back_wages_recovered),
            csvCell(row.civil_penalties_assessed),
            csvCell(row.settlement_amount),
            csvCell(row.workers_affected),
            csvCell(row.repeat_violator ? "YES" : "NO"),
            csvCell(row.status),
            csvCell(row.findings_date),
            csvCell(row.description),
            csvCell(row.provenance_type === "VERIFIED_PUBLIC_ACTION" ? "VERIFIED_PUBLIC_ACTION" : "PROTOTYPE_SEED_PENDING_FOIA"),
            csvCell(row.source_docket_url),
          ];
          csv += vals.join(",") + "\n";
        }
        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="twin_cities_wage_theft_records.csv"',
          },
        });
      } catch (err: any) {
        return new Response(`Error generating CSV: ${err.message}`, { status: 500 });
      }
    }

    if (url.pathname === "/export.md" || url.pathname === "/labor/export.md") {
      try {
        const allCases = await env.DB.prepare(`
          SELECT
            case_id, source_agency, respondent_legal_name, trade_name, address, city, state, zip_code,
            industry_description, violation_type, back_wages_recovered, civil_penalties_assessed,
            settlement_amount, workers_affected, repeat_violator, status, findings_date, description,
            COALESCE(provenance_type, 'PROTOTYPE_SEED_PENDING_FOIA') as provenance_type,
            COALESCE(source_docket_url, '') as source_docket_url
          FROM wage_theft_records
          ORDER BY (back_wages_recovered + civil_penalties_assessed) DESC
        `).all();
        const md = [
          "# Twin Cities Wage Theft & Labor Standards Enforcement Dossier",
          `Generated: ${new Date().toISOString()}`,
          `Total Cases: ${allCases.results.length}`,
          "",
          "> **Data Provenance Notice**:",
          "> - 🟢 **VERIFIED PUBLIC ENFORCEMENT ACTION**: Confirmed civil court consent decree or official state AG/DLI enforcement filing.",
          "> - 🟡 **PROTOTYPE SEED / PENDING FOIA SYNC**: Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.",
          "",
          "---",
          "",
        ];
        for (const [idx, row] of (allCases.results as any[]).entries()) {
          const total = (parseFloat(row.back_wages_recovered || 0) + parseFloat(row.civil_penalties_assessed || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 });
          const isVerified = row.provenance_type === "VERIFIED_PUBLIC_ACTION";
          md.push(`## ${idx + 1}. ${row.respondent_legal_name || "Unknown Entity"} (d/b/a ${row.trade_name || "N/A"})`);
          md.push(`- **Data Provenance**: ${isVerified ? "🟢 VERIFIED PUBLIC ENFORCEMENT ACTION" : "🟡 PROTOTYPE SEED / PENDING FOIA SYNC"}`);
          md.push(`- **Case ID / Docket**: \`${row.case_id || "N/A"}\``);
          md.push(`- **Enforcement Agency**: ${row.source_agency || "N/A"}`);
          md.push(`- **Location**: ${row.address || ""}, ${row.city || "Twin Cities"}, ${row.state || "MN"} ${row.zip_code || ""}`);
          md.push(`- **Violation Category**: ${row.violation_type || "Wage Theft"}`);
          md.push(`- **Status**: ${row.status || "Active"}${row.repeat_violator ? " ⚠️ [REPEAT OFFENDER]" : ""}`);
          md.push(`- **Total Financial Restitution & Penalties**: $${total}`);
          md.push(`- **Affected Workforce**: ${row.workers_affected || 0} workers`);
          md.push(`- **Official Findings Summary**: ${row.description || "Confirmed civil/administrative wage theft findings."}`);
          if (row.case_id) md.push(`- **Evidence Document (mirrored PDF)**: ${url.origin}/docs/${encodeURIComponent(row.case_id)}.pdf`);
          md.push("");
        }
        return new Response(md.join("\n"), {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": 'attachment; filename="twin_cities_wage_theft_dossier.md"',
          },
        });
      } catch (err: any) {
        return new Response(`Error generating Markdown: ${err.message}`, { status: 500 });
      }
    }

    if ((url.pathname === "/seed" || url.pathname === "/labor/seed") && request.method === "POST") {
      try {
        const batchStatements = [];
        for (const c of WAGE_THEFT_SEED_DATA) {
          batchStatements.push(
            env.DB.prepare(`
              INSERT INTO wage_theft_records (
                case_id, source_agency, respondent_legal_name, trade_name, address,
                city, state, zip_code, naics_code, industry_description, violation_type,
                back_wages_recovered, civil_penalties_assessed, workers_affected, repeat_violator,
                status, findings_date, settlement_amount, description, provenance_type, source_docket_url, synced_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(case_id) DO UPDATE SET
                source_agency=excluded.source_agency,
                respondent_legal_name=excluded.respondent_legal_name,
                trade_name=excluded.trade_name,
                address=excluded.address,
                city=excluded.city,
                state=excluded.state,
                zip_code=excluded.zip_code,
                naics_code=excluded.naics_code,
                industry_description=excluded.industry_description,
                violation_type=excluded.violation_type,
                back_wages_recovered=excluded.back_wages_recovered,
                civil_penalties_assessed=excluded.civil_penalties_assessed,
                workers_affected=excluded.workers_affected,
                repeat_violator=excluded.repeat_violator,
                status=excluded.status,
                findings_date=excluded.findings_date,
                settlement_amount=excluded.settlement_amount,
                description=excluded.description,
                provenance_type=excluded.provenance_type,
                source_docket_url=excluded.source_docket_url,
                synced_at=CURRENT_TIMESTAMP
            `).bind(
              c.case_id, c.source_agency, c.respondent_legal_name, c.trade_name,
              c.address, c.city, c.state, c.zip_code, c.naics_code, c.industry_description,
              c.violation_type, c.back_wages_recovered, c.civil_penalties_assessed,
              c.workers_affected, c.repeat_violator, c.status, c.findings_date,
              c.settlement_amount, c.description, c.provenance_type, c.source_docket_url,
            ),
          );
        }
        await env.DB.batch(batchStatements as any);
        return json({ status: "Seeded successfully", count: batchStatements.length });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }
    // -------------------------------------------------- crossover matrix
    if (url.pathname === "/matrix" || url.pathname === "/api/crossover-curated") {
      const accept = request.headers.get("Accept") || "";
      if (accept.includes("text/html") && url.pathname === "/matrix") {
        return html(renderCrossoverUI());
      }
      const q = (url.searchParams.get("q") || "").trim().toLowerCase();
      let results = VERIFIED_CROSSOVER_SYNDICATES;
      if (q) {
        results = results.filter((s) =>
          s.entity_name.toLowerCase().includes(q) ||
          s.trade_name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.search_slug.toLowerCase().includes(q) ||
          s.case_id.toLowerCase().includes(q) ||
          s.violation_type.toLowerCase().includes(q),
        );
      }
      return json({ query: q, matrix: results });
    }

    if (url.pathname === "/crossover/stats") {
      const totalUnits = VERIFIED_CROSSOVER_SYNDICATES.reduce((acc, s) => acc + s.total_units, 0);
      const totalRecovered = VERIFIED_CROSSOVER_SYNDICATES.reduce((acc, s) => acc + s.total_wage_theft_recovered, 0);
      const totalWorkers = VERIFIED_CROSSOVER_SYNDICATES.reduce((acc, s) => acc + s.workers_affected, 0);
      return json({
        syndicates_count: VERIFIED_CROSSOVER_SYNDICATES.length,
        total_units_monitored: totalUnits,
        total_stolen_wages_recovered: totalRecovered,
        total_workers_affected: totalWorkers,
      });
    }

    if (url.pathname === "/crossover/export.md") {
      const md = [
        "# Twin Cities Slumlord & Wage Theft Crossover Matrix",
        `Generated: ${new Date().toISOString()}`,
        `Confirmed Dual Violators: ${VERIFIED_CROSSOVER_SYNDICATES.length}`,
        "",
        "> **Dual Data Provenance Notice**:",
        "> - **Housing Data Provenance**: 🟢 VERIFIED MUNICIPAL GIS RECORD (Direct parcel and licensing data from Minneapolis Open Data & Hennepin County Assessor).",
        "> - **Labor Data Provenance**:",
        ">   - 🟢 **VERIFIED PUBLIC ENFORCEMENT ACTION**: Formal civil court judgment / consent decree or AG enforcement finding.",
        ">   - 🟡 **PROTOTYPE SEED / PENDING FOIA SYNC**: Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.",
        "",
        "---",
        "",
      ];
      for (const [idx, s] of VERIFIED_CROSSOVER_SYNDICATES.entries()) {
        const isLaborVerified = s.labor_provenance.includes("VERIFIED");
        md.push(`## ${idx + 1}. ${s.entity_name} (${s.trade_name})`);
        md.push(`- **Risk Classification**: ${s.risk_tier} (Composite Exploitation Score: ${s.composite_score}/100)`);
        md.push(`- **Metro Geography**: ${s.city}, MN`);
        md.push(`- **Housing Data Provenance**: ${s.housing_provenance}`);
        md.push(`- **Housing Exploitation Footprint**:`);
        md.push(`  - Unmasked Residential Units: ${s.total_units.toLocaleString()}`);
        md.push(`  - Disparate Shell LLC Properties: ${s.properties_count}`);
        md.push(`  - Habitability Status: ${s.has_tier3 ? "⚠️ TIER 3 CHRONIC SLUMLORD" : "Tier 1/2"}`);
        md.push(`  - Housing Profile: ${s.housing_narrative}`);
        md.push(`- **Labor Data Provenance**: ${s.labor_provenance}`);
        if (!isLaborVerified) {
          md.push(`  - *Note*: Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.`);
        }
        md.push(`- **Labor Exploitation & Wage Theft Profile**:`);
        md.push(`  - Legal Docket / Case ID: \`${s.case_id}\``);
        md.push(`  - Enforcement Agency: ${s.source_agency}`);
        md.push(`  - Violation Category: ${s.violation_type}`);
        md.push(`  - Stolen Wages Recovered: $${s.total_wage_theft_recovered.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
        md.push(`  - Workers Impacted: ${s.workers_affected}`);
        md.push(`  - Labor Profile: ${s.labor_narrative}`);
        md.push(`- **Joint Organizing Playbook**: ${s.organizing_playbook}`);
        if (s.source_excerpt_file || s.case_id) md.push(`- **Evidence Excerpt (mirrored PDF)**: ${url.origin}/docs/${encodeURIComponent(s.source_excerpt_file || s.case_id + ".pdf")}${s.source_pages ? ` (${s.source_pages}${s.source_doc_title ? ", " + s.source_doc_title : ""})` : ""}`);
        if (s.housing_source_excerpt_file && s.housing_source_excerpt_file !== s.source_excerpt_file) md.push(`- **Housing Evidence Excerpt (mirrored PDF)**: ${url.origin}/docs/${encodeURIComponent(s.housing_source_excerpt_file)}${s.housing_source_pages ? ` (${s.housing_source_pages}${s.housing_source_doc_title ? ", " + s.housing_source_doc_title : ""})` : ""}`);
        md.push("");
      }
      return new Response(md.join("\n"), {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": 'attachment; filename="twin_cities_slumlord_wage_theft_matrix.md"',
        },
      });
    }

    // Live dual-offender join: landlords in D1 with BOTH a housing
    // footprint and a matching wage-theft record, browsable by city.
    // Curated dossier entries are included separately under `curated`.
    if (url.pathname === "/api/crossover") {
      const q = (url.searchParams.get("q") || "").trim();
      const cityFilter = (url.searchParams.get("city") || "").trim();
      try {
        const pattern = `%${q}%`;
        const live = await env.DB.prepare(`
          SELECT
            landlord_name, landlord_city, landlord_county, landlord_state,
            properties_count, total_units, tier3_properties,
            case_id, source_agency, respondent_legal_name, trade_name,
            violation_type, back_wages_recovered, workers_affected,
            COALESCE(provenance_type, 'PROTOTYPE_SEED_PENDING_FOIA') as provenance_type,
            COALESCE(source_docket_url, '') as source_docket_url
          FROM dual_matches
          WHERE (?1 = '%%' OR landlord_name LIKE ?1 OR trade_name LIKE ?1 OR respondent_legal_name LIKE ?1)
            AND (?2 = '' OR landlord_city = ?2)
          ORDER BY back_wages_recovered DESC
          LIMIT 50
        `).bind(pattern, cityFilter).all();
        const ql = q.toLowerCase();
        const curated = VERIFIED_CROSSOVER_SYNDICATES.filter((s) =>
          (!q || s.entity_name.toLowerCase().includes(ql) || s.trade_name.toLowerCase().includes(ql) ||
            s.search_slug.toLowerCase().includes(ql) || s.case_id.toLowerCase().includes(ql)) &&
          (!cityFilter || s.city.toLowerCase().includes(cityFilter.toLowerCase())),
        );
        return json({ query: q, city: cityFilter, live_matches: live.results, curated });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }
    // Manual dual-match rebuild, one chunk per call. Repeat until done:true —
    // progress resumes via sync_state.feed_id = 'dual_matches'.
    if (url.pathname === "/crossover/rebuild" && request.method === "POST") {
      if (!authorized(request, env)) return new Response("Unauthorized", { status: 401 });
      try {
        return json(await rebuildDualMatches(env, 25));
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }
    // -------------------------------------------------- unified browsing
    // Every city/area with data, across housing + labor, in one call.
    if (url.pathname === "/api/cities") {
      try {
        const housing = await env.DB.prepare(`
          SELECT city, county, state, jurisdiction_id,
                 COUNT(*) as license_count, SUM(units) as total_units
          FROM rental_licenses
          WHERE city IS NOT NULL AND city != ''
          GROUP BY city, county, state, jurisdiction_id
          ORDER BY license_count DESC
        `).all();
        const labor = await env.DB.prepare(`
          SELECT city, state, COUNT(*) as case_count,
                 SUM(back_wages_recovered) as total_back_wages,
                 SUM(workers_affected) as total_workers_affected
          FROM wage_theft_records
          WHERE city IS NOT NULL AND city != ''
          GROUP BY city, state
          ORDER BY case_count DESC
        `).all();
        return json({ housing_cities: housing.results, labor_cities: labor.results });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    // Unified + legacy whistleblower intake. Accepts both the labor form
    // (employer_name/contact_email/...) and the crossover form
    // (employer/contact/housing_issues/labor_issues), hence the aliases.
    if ((url.pathname === "/report" || url.pathname === "/api/reports") && request.method === "POST") {
      try {
        const body: any = await request.json();
        const employer = ((body.employer_name || body.employer) || "").trim();
        const narrative = (body.narrative || "").trim();
        if (!employer || !narrative) {
          return json({ error: "Missing required fields: employer_name and narrative" }, { status: 400 });
        }
        const combinedNarrative = body.housing_issues || body.labor_issues
          ? `[DUAL EXPLOITATION REPORT]\nHousing Issues: ${body.housing_issues || "N/A"}\nLabor Issues: ${body.labor_issues || "N/A"}\nNarrative: ${narrative}`
          : narrative;
        const insertRes = await env.DB.prepare(`
          INSERT INTO worker_reports (
            employer_name, worksite_address, city, job_title, violation_types,
            estimated_unpaid_amount, weeks_worked, narrative, contact_email,
            contact_phone, union_affiliation, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          employer,
          (body.worksite_address || "").trim(),
          (body.city || "Minneapolis").trim(),
          (body.job_title || "").trim(),
          (body.violation_types || (body.housing_issues || body.labor_issues ? "HOUSING_AND_LABOR_CROSSOVER" : "")).trim(),
          parseFloat(body.estimated_unpaid_amount || 0),
          parseInt(body.weeks_worked || 0, 10),
          combinedNarrative,
          (body.contact_email || body.contact || "").trim(),
          (body.contact_phone || "").trim(),
          (body.union_affiliation || (body.housing_issues || body.labor_issues ? "DUAL_ORGANIZING_COALITION" : "NON_UNION")).trim(),
          "PENDING_ORGANIZER_REVIEW",
        ).run();
        return json({
          success: true,
          report_id: (insertRes.meta as any).last_row_id,
          message: "Report logged confidentially. Thank you for standing up for labor standards.",
        }, { status: 201 });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    // Merged stats: `stats` unions the housing + labor keys (disjoint, so
    // both legacy UIs render), with each domain also broken out.
    if (url.pathname === "/stats" || url.pathname === "/api/stats") {
      try {
        const housingTotals = await env.DB.prepare(`
          SELECT
            COUNT(*) as total,
            SUM(units) as units_total,
            SUM(CASE WHEN units > 1 THEN 1 ELSE 0 END) as multifamily_parcels,
            SUM(CASE WHEN lower(owner_name) LIKE '%llc%'
                       OR lower(owner_name) LIKE '% inc%'
                       OR lower(owner_name) LIKE '% corp%'
                       OR lower(owner_name) LIKE '% lp%'
                       OR lower(owner_name) LIKE '% ltd%'
                       OR lower(owner_name) LIKE '% holdings%'
                       OR lower(owner_name) LIKE '% properties%'
                       OR lower(owner_name) LIKE '% ventures%'
                       OR lower(owner_name) LIKE '% partners%'
                     THEN 1 ELSE 0 END) as entity_owners,
            COUNT(DISTINCT jurisdiction_id) as jurisdictions,
            COUNT(DISTINCT state) as states
          FROM rental_licenses
        `).first() as any;
        const topSyndicates = await env.DB.prepare(`
          SELECT
            r.link_key,
            COUNT(*) as props,
            SUM(r.units) as total_units,
            MIN(r.city) as sample_city,
            (SELECT COUNT(DISTINCT x.state) FROM rental_licenses x WHERE x.link_key = r.link_key) as state_count,
            (SELECT x.owner_name FROM rental_licenses x
               WHERE x.link_key = r.link_key AND x.owner_name != '' LIMIT 1) as sample_owner,
            (SELECT x.applicant_name FROM rental_licenses x
               WHERE x.link_key = r.link_key AND x.applicant_name != '' LIMIT 1) as sample_contact,
            (SELECT x.applicant_email FROM rental_licenses x
               WHERE x.link_key = r.link_key AND x.applicant_email != '' LIMIT 1) as sample_email
          FROM rental_licenses r
          WHERE r.link_key IS NOT NULL
          GROUP BY r.link_key
          HAVING props > 1
          ORDER BY total_units DESC
          LIMIT 25
        `).all();
        const laborTotals = await env.DB.prepare(`
          SELECT
            COUNT(*) as total_cases,
            SUM(back_wages_recovered) as total_back_wages,
            SUM(civil_penalties_assessed) as total_penalties,
            SUM(COALESCE(NULLIF(settlement_amount, 0), back_wages_recovered + civil_penalties_assessed)) as total_recovered,
            SUM(workers_affected) as total_workers_affected,
            SUM(CASE WHEN repeat_violator = 1 THEN 1 ELSE 0 END) as repeat_violator_count
          FROM wage_theft_records
        `).first() as any;
        let violationsSummary: unknown = null;
        try {
          const vTotals = await env.DB.prepare(`
            SELECT COUNT(*) as violation_rows,
                   SUM(is_open) as open_rows,
                   COUNT(DISTINCT CASE WHEN is_open = 1 THEN join_key END) as open_parcels
            FROM violations
          `).first() as any;
          const vMatched = await env.DB.prepare(`
            SELECT COUNT(DISTINCT v.join_key) as matched_parcels
            FROM violations v
            WHERE v.is_open = 1 AND v.join_key IS NOT NULL
              AND EXISTS (SELECT 1 FROM rental_licenses r WHERE r.apn = v.join_key)
          `).first() as any;
          const openParcels = (vTotals?.open_parcels as number) || 0;
          const matchedParcels = (vMatched?.matched_parcels as number) || 0;
          violationsSummary = {
            ...(vTotals || {}),
            matched_parcels: matchedParcels,
            unmatched_parcels: openParcels - matchedParcels,
          };
        } catch {
          violationsSummary = { unavailable: true };
        }
        const crossoverTotals = {
          syndicates_count: VERIFIED_CROSSOVER_SYNDICATES.length,
          total_units_monitored: VERIFIED_CROSSOVER_SYNDICATES.reduce((a, s) => a + s.total_units, 0),
          total_stolen_wages_recovered: VERIFIED_CROSSOVER_SYNDICATES.reduce((a, s) => a + s.total_wage_theft_recovered, 0),
          total_workers_affected: VERIFIED_CROSSOVER_SYNDICATES.reduce((a, s) => a + s.workers_affected, 0),
        };
        return json({
          stats: { ...(housingTotals || {}), ...(laborTotals || {}) },
          top_syndicates: topSyndicates.results,
          violations: violationsSummary,
          housing: housingTotals,
          labor: laborTotals,
          crossover: crossoverTotals,
        });
      } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
      }
    }

    return new Response(
      "US Housing & Labor Standards Unified Registry. " +
        "UIs: / (unified), /housing, /labor, /crossover. " +
        "Housing: /search /cities /violations /feeds /sync /sync/status /wage-theft. " +
        "Labor: /cases /offenders/top /labor/stats /export.csv /export.md /seed /sync/live /labor/sync/status. " +
        "Crossover: /matrix /crossover/stats /crossover/export.md. " +
        "Unified: /api/cities /api/landlords /api/wage-theft /api/crossover /api/crossover-curated /api/stats /api/reports, POST /report.",
      { status: 200 },
    );
  },
};

const DUAL_MATCH_FEED = "dual_matches";

// Rebuilds dual_matches one wage_theft_records chunk at a time (each row is a
// full-scan instr() match against rental_licenses). Progress persists in
// sync_state so cron and manual calls resume where the last run stopped.
// Rows written carry matched_at; stale rows from the previous cycle are
// deleted only once a full pass completes.
async function rebuildDualMatches(
  env: Env,
  maxRows: number,
): Promise<{ done: boolean; processed: number; total: number }> {
  const now = new Date().toISOString();
  const state = await env.DB.prepare(
    `SELECT * FROM sync_state WHERE feed_id = ?`,
  ).bind(DUAL_MATCH_FEED).first<any>();
  const offset: number = state?.offset ?? 0;
  const cycleStart: string = state?.started_at ?? now;

  const totalRes = await env.DB.prepare(
    `SELECT COUNT(*) as n FROM wage_theft_records`,
  ).first<any>();
  const total: number = totalRes?.n ?? 0;

  const chunk = await env.DB.prepare(
    `SELECT case_id, source_agency, respondent_legal_name, trade_name, violation_type,
            back_wages_recovered, workers_affected, provenance_type, source_docket_url
     FROM wage_theft_records ORDER BY case_id LIMIT ? OFFSET ?`,
  ).bind(maxRows, offset).all();

  const rows = chunk.results as any[];
  // Scans are independent I/O; run the chunk concurrently (~2s each, not ~35s
  // sequential). Per-query D1 CPU stays bounded because each scan is its own
  // statement.
  await Promise.all(rows.map(async (w) => {
    const names = [w.trade_name, w.respondent_legal_name].filter(
      (n) => n && String(n).trim(),
    );
    if (names.length) {
      // Word-boundary containment: needle must start the field or follow a
      // space/comma/dash/paren — plain instr() matches 'dominium' inside
      // 'CONDOMINIUM'.
      const cond = names
        .map(
          () =>
            `((lower(r.owner_name) = lower(?) OR instr(lower(r.owner_name), ' ' || lower(?)) > 0 OR instr(lower(r.owner_name), ', ' || lower(?)) > 0 OR instr(lower(r.owner_name), '-' || lower(?)) > 0 OR instr(lower(r.owner_name), '(' || lower(?)) > 0)
             OR (lower(r.applicant_name) = lower(?) OR instr(lower(r.applicant_name), ' ' || lower(?)) > 0 OR instr(lower(r.applicant_name), ', ' || lower(?)) > 0 OR instr(lower(r.applicant_name), '-' || lower(?)) > 0 OR instr(lower(r.applicant_name), '(' || lower(?)) > 0))`,
        )
        .join(" OR ");
      const matches = await env.DB.prepare(
        `SELECT r.owner_name as landlord_name, r.city as landlord_city,
                r.county as landlord_county, r.state as landlord_state,
                COUNT(DISTINCT r.apn) as properties_count,
                SUM(r.units) as total_units,
                SUM(CASE WHEN r.severity_class = 'C' THEN 1 ELSE 0 END) as tier3_properties
         FROM rental_licenses r WHERE ${cond} GROUP BY r.owner_name LIMIT 200`,
      )
        .bind(...names.flatMap((n) => [n, n, n, n, n, n, n, n, n, n]))
        .all();
      for (const m of matches.results as any[]) {
        await env.DB.prepare(
          `INSERT OR REPLACE INTO dual_matches
           (landlord_name, landlord_city, landlord_county, landlord_state,
            properties_count, total_units, tier3_properties, case_id,
            source_agency, respondent_legal_name, trade_name, violation_type,
            back_wages_recovered, workers_affected, provenance_type,
            source_docket_url, matched_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
          .bind(
            m.landlord_name, m.landlord_city, m.landlord_county, m.landlord_state,
            m.properties_count ?? 0, m.total_units ?? 0, m.tier3_properties ?? 0,
            w.case_id, w.source_agency, w.respondent_legal_name, w.trade_name,
            w.violation_type, w.back_wages_recovered ?? 0, w.workers_affected ?? 0,
            w.provenance_type ?? "PROTOTYPE_SEED_PENDING_FOIA",
            w.source_docket_url ?? "", now,
          )
          .run();
      }
    }
  }));

  const processed = offset + rows.length;
  const done = processed >= total;
  await env.DB.prepare(
    `INSERT INTO sync_state (feed_id, offset, rows_total, started_at, updated_at, completed_at, last_error)
     VALUES (?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(feed_id) DO UPDATE SET
       offset = excluded.offset,
       rows_total = excluded.rows_total,
       started_at = CASE WHEN excluded.offset = 0 THEN excluded.started_at ELSE sync_state.started_at END,
       updated_at = excluded.updated_at,
       completed_at = excluded.completed_at`,
  ).bind(DUAL_MATCH_FEED, done ? 0 : processed, total, offset === 0 ? now : cycleStart, now, done ? now : null).run();

  if (done) {
    await env.DB.prepare(
      `DELETE FROM dual_matches WHERE matched_at < ?`,
    ).bind(cycleStart).run();
    await env.DB.prepare(
      `INSERT INTO sync_logs (source, cases_synced, status, details) VALUES ('crossover-dual-matches', ?, 'SUCCESS', ?)`,
    ).bind(total, `rebuilt dual_matches in chunks`).run();
  }
  return { done, processed, total };
}

async function backupMatrixSnapshot(env: Env): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const key = `snapshots/crossover_matrix_${today}.json`;
    await env.R2_BUCKET.put(key, JSON.stringify(VERIFIED_CROSSOVER_SYNDICATES, null, 2), {
      httpMetadata: { contentType: "application/json" },
    });
    console.log(`Backed up crossover matrix to R2: ${key}`);
  } catch (err) {
    console.error("R2 backup error:", err);
  }
}
