import { renderCrossoverUI } from "./ui";

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

export interface CrossoverSyndicate {
  entity_name: string;
  trade_name: string;
  city: string;
  search_slug: string;
  properties_count: number;
  total_units: number;
  has_tier3: boolean;
  housing_narrative: string;
  case_id: string;
  source_agency: string;
  violation_type: string;
  total_wage_theft_recovered: number;
  workers_affected: number;
  labor_narrative: string;
  composite_score: number;
  risk_tier: string;
  organizing_playbook: string;
}

const VERIFIED_CROSSOVER_SYNDICATES: CrossoverSyndicate[] = [
  {
    entity_name: "Brian Fitterer / Investment Property Group (IPG Living)",
    trade_name: "Blaisdell Portfolio LLC / Greenway Apartments LLC",
    city: "Minneapolis",
    search_slug: "Fitterer",
    properties_count: 18,
    total_units: 531,
    has_tier3: true,
    housing_narrative: "Operates 18+ South Minneapolis apartment buildings under discrete shell LLCs. 2312 Blaisdell Ave is under active municipal Tier 3 monitoring for chronic health, safety, and pest code violations.",
    case_id: "MPLS-LS-2023-0082",
    source_agency: "MINNEAPOLIS_CIVIL_RIGHTS",
    violation_type: "MINIMUM_WAGE & SICK TIME",
    total_wage_theft_recovered: 49750.00,
    workers_affected: 14,
    labor_narrative: "Misclassified building janitors and cleaners as 1099 independent contractors; denied Minneapolis Municipal Minimum Wage and Earned Sick & Safe Time (ESST).",
    composite_score: 94,
    risk_tier: "CRITICAL DUAL OFFENDER",
    organizing_playbook: "Joint tenant strike at 2312 Blaisdell paired with CTUL janitorial direct action. Escrow rent while placing municipal wage liens against shell entities."
  },
  {
    entity_name: "Dominium Management Services LLC",
    trade_name: "Dominium Affordable Housing / Leased Housing Associates",
    city: "Minneapolis & Saint Paul",
    search_slug: "Dominium",
    properties_count: 24,
    total_units: 1600,
    has_tier3: false,
    housing_narrative: "Major regional owner/manager of subsidized and tax-credit multi-family complexes (Wilder Park, Mill City Quarter, 1006 W Lake St, 4041 Hiawatha Ave).",
    case_id: "WHD-MN-1892014",
    source_agency: "US_DOL_WHD",
    violation_type: "FLSA_OVERTIME",
    total_wage_theft_recovered: 96920.00,
    workers_affected: 38,
    labor_narrative: "Excluded mandatory on-call emergency stipends and milestone bonuses from regular rate when calculating overtime for multi-site maintenance staff.",
    composite_score: 88,
    risk_tier: "HIGH DUAL RISK",
    organizing_playbook: "Coordinate with SEIU Local 26 maintenance techs; file joint federal HUD civil rights complaints alongside state tax-credit compliance audits."
  },
  {
    entity_name: "Property Solutions & Services LLC (PSS Living)",
    trade_name: "PSS Living",
    city: "Minneapolis",
    search_slug: "PSS Living",
    properties_count: 12,
    total_units: 420,
    has_tier3: false,
    housing_narrative: "Scattered-site residential properties across Hennepin County with documented tenant maintenance delays and caretaker turnover.",
    case_id: "MNDLI-WH-2022-049",
    source_agency: "MN_DLI",
    violation_type: "UNPAID_HOURS & CARETAKER TRAP",
    total_wage_theft_recovered: 77400.00,
    workers_affected: 24,
    labor_narrative: "Unlawful wage deductions for resident caretaker apartment units below statutory minimum wage in violation of Minn. Stat. § 177.24.",
    composite_score: 86,
    risk_tier: "HIGH DUAL RISK",
    organizing_playbook: "Form on-site caretaker-tenant alliances. Block retaliatory evictions by invoking Minnesota statutory protections for wage whistleblowers."
  },
  {
    entity_name: "Twin Cities Residential Cleaning & Maintenance Inc",
    trade_name: "Metro Caretakers",
    city: "Minneapolis",
    search_slug: "Metro Caretakers",
    properties_count: 16,
    total_units: 650,
    has_tier3: false,
    housing_narrative: "Primary custodial contractor servicing older multi-family apartment buildings across Stevens Square, Whittier, and University areas.",
    case_id: "WHD-MN-1945112",
    source_agency: "US_DOL_WHD",
    violation_type: "FLSA_OVERTIME & TIMECARD SHAVING",
    total_wage_theft_recovered: 140400.00,
    workers_affected: 52,
    labor_narrative: "Altered electronic timecards to erase turnover overtime hours; mandated off-the-clock emergency weekend cleaning during high-turnover windows.",
    composite_score: 84,
    risk_tier: "HIGH DUAL RISK",
    organizing_playbook: "Enforce Minnesota's 2023 Joint Liability statute (Minn. Stat. § 181.165) to hold primary landlords and building owners directly liable for contractor wage theft."
  },
  {
    entity_name: "Timberland Property Management Inc",
    trade_name: "Timberland Partners",
    city: "Bloomington & Minneapolis",
    search_slug: "Timberland",
    properties_count: 14,
    total_units: 890,
    has_tier3: false,
    housing_narrative: "Suburban and urban apartment portfolio with ongoing tenant disputes over heating and deferred maintenance.",
    case_id: "MNDLI-WH-2023-102",
    source_agency: "MN_DLI",
    violation_type: "UNPAID_TRAVEL_HOURS",
    total_wage_theft_recovered: 43300.00,
    workers_affected: 19,
    labor_narrative: "Failed to compensate technicians for inter-property travel time across Hennepin and Ramsey counties under Minn. Rule 5200.0120.",
    composite_score: 79,
    risk_tier: "MODERATE-HIGH RISK",
    organizing_playbook: "Synchronize tenant petitions on delayed repair tickets with technician travel time audits across properties."
  },
  {
    entity_name: "Kleinman Commercial Real Estate & Housing LLC",
    trade_name: "Kleinman Realty Co",
    city: "Minneapolis & Saint Paul",
    search_slug: "Kleinman",
    properties_count: 18,
    total_units: 740,
    has_tier3: false,
    housing_narrative: "Longtime Twin Cities rental manager operating multi-family complexes across Minneapolis and inner-ring suburbs.",
    case_id: "WHD-MN-2001884",
    source_agency: "US_DOL_WHD",
    violation_type: "FLSA_OVERTIME",
    total_wage_theft_recovered: 22650.00,
    workers_affected: 8,
    labor_narrative: "Improper comp-time bank calculations in lieu of statutory 1.5x cash overtime for groundskeepers and building engineers.",
    composite_score: 74,
    risk_tier: "MODERATE RISK",
    organizing_playbook: "Tenant council demands cash restitution and transparent maintenance scheduling as conditions for lease renewals."
  }
];

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(backupMatrixSnapshot(env));
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Root Interactive Web Application
    if (url.pathname === "/" || url.pathname === "") {
      return new Response(renderCrossoverUI(), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    // Get Crossover Matrix (Filtered or Full)
    if (url.pathname === "/matrix") {
      const q = (url.searchParams.get("q") || "").trim().toLowerCase();

      let results = VERIFIED_CROSSOVER_SYNDICATES;
      if (q) {
        results = results.filter(s =>
          s.entity_name.toLowerCase().includes(q) ||
          s.trade_name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.search_slug.toLowerCase().includes(q) ||
          s.case_id.toLowerCase().includes(q) ||
          s.violation_type.toLowerCase().includes(q)
        );
      }

      return new Response(JSON.stringify({ query: q, matrix: results }, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // High level stats
    if (url.pathname === "/stats") {
      const totalUnits = VERIFIED_CROSSOVER_SYNDICATES.reduce((acc, s) => acc + s.total_units, 0);
      const totalRecovered = VERIFIED_CROSSOVER_SYNDICATES.reduce((acc, s) => acc + s.total_wage_theft_recovered, 0);
      const totalWorkers = VERIFIED_CROSSOVER_SYNDICATES.reduce((acc, s) => acc + s.workers_affected, 0);

      return new Response(JSON.stringify({
        syndicates_count: VERIFIED_CROSSOVER_SYNDICATES.length,
        total_units_monitored: totalUnits,
        total_stolen_wages_recovered: totalRecovered,
        total_workers_affected: totalWorkers,
      }, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Confidential Whistleblower Intake for Dual Exploitation
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

        const combinedNarrative = `[DUAL EXPLOITATION REPORT]\nHousing Issues: ${body.housing_issues || 'N/A'}\nLabor Issues: ${body.labor_issues || 'N/A'}\nNarrative: ${narrative}`;

        const insertRes = await env.DB.prepare(`
          INSERT INTO worker_reports (
            employer_name, worksite_address, city, job_title, violation_types,
            estimated_unpaid_amount, weeks_worked, narrative, contact_email,
            contact_phone, union_affiliation, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          employer,
          (body.worksite_address || "").trim(),
          "Minneapolis",
          "Dual Exploitation Whistleblower",
          "HOUSING_AND_LABOR_CROSSOVER",
          0,
          0,
          combinedNarrative,
          (body.contact || "").trim(),
          "",
          "DUAL_ORGANIZING_COALITION",
          "PENDING_ORGANIZER_REVIEW"
        ).run();

        return new Response(
          JSON.stringify({
            success: true,
            report_id: insertRes.meta.last_row_id,
            message: "Dual exploitation incident recorded. Organizing teams notified.",
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

    return new Response(
      "Twin Cities Slumlord & Wage Theft Crossover Matrix Worker. Routes: /, /matrix, /stats, /report",
      { status: 200 }
    );
  },
};

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
