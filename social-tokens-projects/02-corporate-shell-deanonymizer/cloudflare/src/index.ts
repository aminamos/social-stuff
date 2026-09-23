import { renderUI } from "./ui";
import { ADAPTERS } from "./adapters";
import {
  D1_QUERY_BUDGET,
  runSyncTick,
  syncOne,
  loadStates,
} from "./sync";
import {
  VIOLATION_ADAPTERS,
  getViolationAdapter,
  syncViolationAdapter,
} from "./violations";

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  AUTH_SECRET?: string;
  SOCRATA_APP_TOKEN?: string;
}

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

function authorized(request: Request, env: Env): boolean {
  if (!env.AUTH_SECRET) return true;
  return request.headers.get("Authorization") === `Bearer ${env.AUTH_SECRET}`;
}

export default {
  /**
   * Two schedules:
   *   - 04:00 daily  -> start a fresh full cycle for every jurisdiction
   *   - every 15 min -> resume unfinished jurisdictions within the D1 budget
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const isDaily = event.cron === "0 4 * * *";
    ctx.waitUntil(runSyncTick(env, { reset: isDaily }));
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

    // Interactive Web UI for Organizers, Tenants & Public
    if (url.pathname === "/" || url.pathname === "") {
      return new Response(renderUI(), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // ---------------------------------------------------------------- ingest

    if (url.pathname === "/sync" && request.method === "POST") {
      if (!authorized(request, env)) return new Response("Unauthorized", { status: 401 });
      const reset = url.searchParams.get("reset") === "1";
      const budget = parseInt(url.searchParams.get("budget") || String(D1_QUERY_BUDGET), 10);
      const results = await runSyncTick(env, { reset, budget });
      return json({ status: "sync tick complete", budget, results });
    }

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
      return json({ feeds: [...feeds, ...violationFeeds] });
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

    // -------------------------------------------------------------- reference

    // Registry of ingest feeds and their sources
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

    // Violation counts per feed plus BBL join resolution (matched vs
    // unmatched parcels). Unmatched = open violations whose join_key has no
    // registry row yet, i.e. the registry fill has not reached that BBL.
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

    // List all municipalities and unit/license totals
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

    // ----------------------------------------------------------------- search

    if (url.pathname === "/search") {
      const accept = request.headers.get("Accept") || "";
      if (accept.includes("text/html")) {
        return new Response(renderUI(), {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }

      const q = (url.searchParams.get("q") || "").trim();
      const jurisdiction = (url.searchParams.get("jurisdiction") || "").trim();
      const severity = (url.searchParams.get("severity") || "").trim().toUpperCase();
      const state = (url.searchParams.get("state") || "").trim().toUpperCase();
      const atRisk = url.searchParams.get("at_risk") === "1";

      if (!q && !jurisdiction && !severity && !state && !atRisk) {
        return json(
          { error: "Provide at least one of ?q=, ?jurisdiction=, ?severity=, ?state=, ?at_risk=1" },
          { status: 400 },
        );
      }

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
            (SELECT case_id || '::' || violation_type || '::' || back_wages_recovered || '::' || workers_affected || '::' || COALESCE(provenance_type, 'PROTOTYPE_SEED_PENDING_FOIA')
             FROM wage_theft_records w
             WHERE (w.trade_name != '' AND (
                 instr(lower(r.owner_name), lower(w.trade_name)) > 0
                 OR instr(lower(r.applicant_name), lower(w.trade_name)) > 0
                 OR instr(lower(r.applicant_email), lower(w.trade_name)) > 0
             ))
             OR (w.respondent_legal_name != '' AND (
                 instr(lower(r.owner_name), lower(w.respondent_legal_name)) > 0
                 OR instr(lower(r.applicant_name), lower(w.respondent_legal_name)) > 0
             ))
             LIMIT 1) as wage_theft_match
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
          )
          AND (?4 = '' OR r.jurisdiction_id = ?4)
          AND (?5 = '' OR r.severity_class = ?5)
          AND (?6 = '' OR r.state = ?6)
          AND (?7 = 0 OR r.severity_class = 'C'
              OR EXISTS (SELECT 1 FROM violations v
                         WHERE v.join_key = r.apn AND v.is_open = 1
                           AND v.violation_class = 'C'))
          ORDER BY r.units DESC
          LIMIT 50
        `).bind(
          pattern,
          tokenPattern,
          noSpacePattern,
          jurisdiction,
          severity,
          state,
          atRisk ? 1 : 0,
        ).all();

        return json({ query: q, jurisdiction, severity, state, at_risk: atRisk, results: searchRes.results });
      } catch (err: any) {
        return json({ error: err.message, stack: err.stack }, { status: 500 });
      }
    }

    // ------------------------------------------------------------------ labor

    // Search wage theft and labor enforcement records
    if (url.pathname === "/wage-theft") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) {
        return json({ error: "Missing query param ?q=" }, { status: 400 });
      }
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
        ORDER BY (back_wages_recovered + settlement_amount) DESC
        LIMIT 50
      `).bind(pattern, tokenPattern).all();

      return json({ query: q, results: wageRes.results });
    }

    // Top wage theft offenders
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

    if (url.pathname === "/stats") {
      const totals = await env.DB.prepare(`
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
      `).first();

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

      return json({ stats: totals, top_syndicates: topSyndicates.results, violations: violationsSummary });
    }

    return new Response(
      "Multi-jurisdiction Housing & Labor Standards Registry Worker. " +
        "Endpoints: /, /sync, /sync/{feed}, /sync/status, /feeds, /cities, " +
        "/search?q=...&jurisdiction=...&severity=..., /violations, /wage-theft?q=..., /wage-theft/top, /stats",
      { status: 200 },
    );
  },
};
