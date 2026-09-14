import { renderWageTheftUI } from "./ui";
import { WAGE_THEFT_SEED_DATA, WageTheftSeedRecord } from "./data";
import { runLiveEnforcementSync } from "./live_sync";

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  AUTH_SECRET?: string;
  DOL_API_KEY?: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runLiveEnforcementSync(env));
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

    // Root Interactive Web Application
    if (url.pathname === "/" || url.pathname === "") {
      return new Response(renderWageTheftUI(), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

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

    // Search and filter enforcement cases
    if (url.pathname === "/cases") {
      const accept = request.headers.get("Accept") || "";
      if (accept.includes("text/html")) {
        return new Response(renderWageTheftUI(), {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }

      const q = (url.searchParams.get("q") || "").trim();
      const agency = (url.searchParams.get("agency") || "").trim();
      const repeatOnly = url.searchParams.get("repeat") === "true";

      let queryStr = `
        SELECT * FROM wage_theft_records
        WHERE 1=1
      `;
      const binds: any[] = [];

      if (q) {
        const isDeRoma = /deroma|de\s*roma|jager|j[aä]ger/i.test(q);
        binds.push(`%${q}%`);
        const idx1 = binds.length;
        binds.push(`%${q.replace(/\s+/g, '%')}%`);
        const idx2 = binds.length;
        binds.push(isDeRoma ? 1 : 0);
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

      if (repeatOnly) {
        queryStr += ` AND repeat_violator = 1`;
      }

      queryStr += ` ORDER BY (back_wages_recovered + civil_penalties_assessed) DESC LIMIT 100`;

      try {
        const stmt = env.DB.prepare(queryStr);
        const res = binds.length > 0 ? await stmt.bind(...binds).all() : await stmt.all();

        return new Response(JSON.stringify({ query: q, cases: res.results }, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Top corporate offenders aggregated
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

        return new Response(JSON.stringify({ top_offenders: topRes.results }, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Aggregate statistics
    if (url.pathname === "/stats") {
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

        return new Response(JSON.stringify({ stats }, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // CSV dataset export for researchers, unions, and journalists
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
          "Workers Affected", "Repeat Violator", "Status", "Findings Date", "Description", "Data Provenance", "Docket URL"
        ];

        // Every field is quoted: raw values like violation_type routinely
        // contain commas ("CASE,FLSA"), which shifted columns and hid the
        // real docket URL in an unnamed trailing column.
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
            csvCell(row.provenance_type === 'VERIFIED_PUBLIC_ACTION' ? "VERIFIED_PUBLIC_ACTION" : "PROTOTYPE_SEED_PENDING_FOIA"),
            csvCell(row.source_docket_url)
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

    // Markdown dataset export for LLMs, researchers, and journalists
    if (url.pathname === "/export.md") {
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

        let md = [
          "# Twin Cities Wage Theft & Labor Standards Enforcement Dossier",
          `Generated: ${new Date().toISOString()}`,
          "Source: https://twin-cities-wage-theft-worker.a-8c6.workers.dev",
          `Total Cases: ${allCases.results.length}`,
          "",
          "> **Data Provenance Notice**:",
          "> - 🟢 **VERIFIED PUBLIC ENFORCEMENT ACTION**: Confirmed civil court consent decree or official state AG/DLI enforcement filing.",
          "> - 🟡 **PROTOTYPE SEED / PENDING FOIA SYNC**: Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.",
          "",
          "---",
          ""
        ];

        for (const [idx, row] of (allCases.results as any[]).entries()) {
          const total = (parseFloat(row.back_wages_recovered || 0) + parseFloat(row.civil_penalties_assessed || 0)).toLocaleString(undefined, {minimumFractionDigits: 2});
          const isVerified = row.provenance_type === 'VERIFIED_PUBLIC_ACTION';
          md.push(`## ${idx + 1}. ${row.respondent_legal_name || 'Unknown Entity'} (d/b/a ${row.trade_name || 'N/A'})`);
          md.push(`- **Data Provenance**: ${isVerified ? '🟢 VERIFIED PUBLIC ENFORCEMENT ACTION' : '🟡 PROTOTYPE SEED / PENDING FOIA SYNC'}`);
          if (!isVerified) {
            md.push(`  - *Note*: Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.`);
          }
          md.push(`- **Case ID / Docket**: \`${row.case_id || 'N/A'}\``);
          md.push(`- **Enforcement Agency**: ${row.source_agency || 'N/A'}`);
          md.push(`- **Location**: ${row.address || ''}, ${row.city || 'Twin Cities'}, ${row.state || 'MN'} ${row.zip_code || ''}`);
          md.push(`- **Industry Sector**: ${row.industry_description || 'Building / Property Services'}`);
          md.push(`- **Violation Category**: ${row.violation_type || 'Wage Theft'}`);
          md.push(`- **Status**: ${row.status || 'Active'}${row.repeat_violator ? ' ⚠️ [REPEAT OFFENDER]' : ''}`);
          md.push(`- **Total Financial Restitution & Penalties**: $${total}`);
          md.push(`  - Back Wages Recovered: $${parseFloat(row.back_wages_recovered || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`);
          md.push(`  - Civil Money Penalties: $${parseFloat(row.civil_penalties_assessed || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`);
          md.push(`- **Affected Workforce**: ${row.workers_affected || 0} workers`);
          md.push(`- **Official Findings Summary**: ${row.description || 'Confirmed civil/administrative wage theft findings.'}`);
          md.push(`- **Primary Records & Legal Dockets**:`);
          if (row.source_docket_url) {
            md.push(`  - Primary Source Docket Document: ${row.source_docket_url}`);
          }
          md.push(`  - US DOL Enforcement Database: https://enforcement.dol.gov`);
          md.push(`  - Minnesota District Court MCRO: https://publicaccess.courts.state.mn.us`);
          md.push(`  - Minneapolis Civil Rights Labor Standards: https://www2.minneapolismn.gov/government/departments/civil-rights/labor-standards`);
          md.push(`  - Cross-Reference Landlord Shell: https://mpls-rental-sync-worker.a-8c6.workers.dev/search?q=${encodeURIComponent(row.trade_name || row.respondent_legal_name || '')}`);
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

    // Confidential whistleblower / worker incident report submission
    if (url.pathname === "/report" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const employer = (body.employer_name || "").trim();
        const narrative = (body.narrative || "").trim();

        if (!employer || !narrative) {
          return new Response(
            JSON.stringify({ error: "Missing required fields: employer_name and narrative" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

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
          (body.violation_types || "").trim(),
          parseFloat(body.estimated_unpaid_amount || 0),
          parseInt(body.weeks_worked || 0, 10),
          narrative,
          (body.contact_email || "").trim(),
          (body.contact_phone || "").trim(),
          (body.union_affiliation || "NON_UNION").trim(),
          "PENDING_ORGANIZER_REVIEW"
        ).run();

        return new Response(
          JSON.stringify({
            success: true,
            report_id: insertRes.meta.last_row_id,
            message: "Report logged confidentially. Thank you for standing up for labor standards.",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Seed/sync endpoint to refresh database records
    if (url.pathname === "/seed" && request.method === "POST") {
      try {
        const batchStatements: D1PreparedStatement[] = [];
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
              c.case_id,
              c.source_agency,
              c.respondent_legal_name,
              c.trade_name,
              c.address,
              c.city,
              c.state,
              c.zip_code,
              c.naics_code,
              c.industry_description,
              c.violation_type,
              c.back_wages_recovered,
              c.civil_penalties_assessed,
              c.workers_affected,
              c.repeat_violator,
              c.status,
              c.findings_date,
              c.settlement_amount,
              c.description,
              c.provenance_type,
              c.source_docket_url
            )
          );
        }

        await env.DB.batch(batchStatements);
        return new Response(
          JSON.stringify({ status: "Seeded successfully", count: batchStatements.length }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Automated Live Government Ingestion Sync (US DOL Open Data + MN DLI Orders)
    if (url.pathname === "/sync/live") {
      try {
        const syncResult = await runLiveEnforcementSync(env);
        return new Response(JSON.stringify(syncResult, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Sync history & telemetry logs
    if (url.pathname === "/sync/status") {
      try {
        const logs = await env.DB.prepare(`
          SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10
        `).all();
        return new Response(JSON.stringify({ sync_history: logs.results }, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60",
          },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      "Twin Cities Wage Theft & Labor Standards Registry Worker. Routes: /, /cases, /offenders/top, /stats, /export.csv, /export.md, /sync/live, /sync/status, /report, /seed",
      { status: 200 }
    );
  },
};

async function backupSnapshotToR2(env: Env): Promise<void> {
  try {
    const allRecords = await env.DB.prepare("SELECT * FROM wage_theft_records").all();
    const today = new Date().toISOString().split("T")[0];
    const key = `snapshots/wage_theft_records_${today}.json`;
    await env.R2_BUCKET.put(key, JSON.stringify(allRecords.results, null, 2), {
      httpMetadata: { contentType: "application/json" },
    });
    console.log(`Backed up ${allRecords.results.length} wage theft records to R2: ${key}`);
  } catch (err) {
    console.error("R2 backup error:", err);
  }
}
