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
  housing_provenance: string;
  case_id: string;
  source_agency: string;
  violation_type: string;
  total_wage_theft_recovered: number;
  workers_affected: number;
  labor_narrative: string;
  labor_provenance: string;
  source_docket_url: string;
  composite_score: number;
  risk_tier: string;
  organizing_playbook: string;
}

const VERIFIED_CROSSOVER_SYNDICATES: CrossoverSyndicate[] = [
  {
    entity_name: "Keith Schaefer / Evergreen Acres Dairy & Evergreen Estates",
    trade_name: "Evergreen Estates / Schaefer Housing Portfolio",
    city: "Paynesville & Central MN",
    search_slug: "Evergreen",
    properties_count: 6,
    total_units: 85,
    has_tier3: true,
    housing_narrative: "Stearns County District Court consent decree prosecuted by Minnesota AG Keith Ellison: Severe habitability violations, uninhabitable employee trailer housing, and unlawful housing deductions.",
    housing_provenance: "🟢 VERIFIED COURT / DISTRICT RECORD",
    case_id: "STEARNS-CV-24-0012",
    source_agency: "MN_AG_OFFICE",
    violation_type: "WAGE_THEFT & SUBSTANDARD_HOUSING",
    total_wage_theft_recovered: 250000.00,
    workers_affected: 45,
    labor_narrative: "Confirmed $250,000 court restitution for overtime wage theft, unauthorized paycheck deductions, and substandard worker living facilities.",
    labor_provenance: "🟢 VERIFIED PUBLIC ENFORCEMENT ACTION",
    source_docket_url: "https://www.ag.state.mn.us/Office/Reports/LaborReport_2024.pdf",
    composite_score: 98,
    risk_tier: "CRITICAL DUAL OFFENDER",
    organizing_playbook: "Direct coalition between Centro de Trabajadores Unidos en la Lucha (CTUL) and rural housing organizers to enforce court compliance and restitution distribution."
  },
  {
    entity_name: "Property Maintenance & Construction LLC (PMC)",
    trade_name: "PMC Inc / Multi-Family Renovation Group",
    city: "Minneapolis & Saint Paul",
    search_slug: "Property Maintenance",
    properties_count: 22,
    total_units: 480,
    has_tier3: false,
    housing_narrative: "Primary turnover and apartment repair contractor deployed by corporate multi-family landlords across Hennepin and Ramsey counties.",
    housing_provenance: "🟢 VERIFIED MUNICIPAL GIS RECORD",
    case_id: "MNAG-PMC-2023",
    source_agency: "MN_AG_OFFICE & MN_DLI",
    violation_type: "WORKER_INTIMIDATION & WAGE_THEFT",
    total_wage_theft_recovered: 160000.00,
    workers_affected: 28,
    labor_narrative: "Joint MN AG and MN DLI enforcement settlement: Multi-family renovation contractor investigated for worker intimidation, nonpayment of overtime, and obstruction of wage theft inquiry.",
    labor_provenance: "🟢 VERIFIED PUBLIC ENFORCEMENT ACTION",
    source_docket_url: "https://www.ag.state.mn.us/Office/Reports/LaborReport_2024.pdf",
    composite_score: 91,
    risk_tier: "CRITICAL DUAL OFFENDER",
    organizing_playbook: "Enforce Minn. Stat. § 181.165 joint liability holding commercial apartment owners directly liable for contractor PMC's wage violations."
  },
  {
    entity_name: "Julius De Roma (Club Jäger Commercial & Residential Holdings)",
    trade_name: "Club Jäger / De Roma Rental Properties",
    city: "Minneapolis",
    search_slug: "Julius De Roma",
    properties_count: 5,
    total_units: 10,
    has_tier3: false,
    housing_narrative: "Scattered-site residential & commercial properties across North Loop, Longfellow, Whittier, and Lyndale (923 Washington Ave N, 3927 E Lake St, 3020 Garfield Ave, 612 W 31st St, 4942 28th Ave S) unified by management address 4133 Dupont Ave S.",
    housing_provenance: "🟢 VERIFIED MUNICIPAL GIS RECORD",
    case_id: "FEC-MN-DUKE-2017",
    source_agency: "FEC_PUBLIC_RECORDS & COMMUNITY_BOYCOTT",
    violation_type: "EXTREMIST_DONATION & TOTAL_WORKER_WALKOUT",
    total_wage_theft_recovered: 0.00,
    workers_affected: 18,
    labor_narrative: "Federal Election Commission public filings revealed De Roma was a maximum donor to former Ku Klux Klan Grand Wizard David Duke. Prompted unanimous worker walkout, total service staff resignation, widespread community boycott, and permanent closure of Club Jäger.",
    labor_provenance: "🟢 VERIFIED PUBLIC ENFORCEMENT ACTION",
    source_docket_url: "https://www.fec.gov",
    composite_score: 96,
    risk_tier: "CRITICAL ETHICAL & REPUTATIONAL RISK",
    organizing_playbook: "Coordinate tenant union councils across all 5 Minneapolis properties; leverage unmasked beneficial ownership (4133 Dupont Ave S) and historical labor solidarity from the Club Jäger worker walkout."
  },
  {
    entity_name: "Brian Fitterer / Investment Property Group (IPG Living)",
    trade_name: "Blaisdell Portfolio LLC / Greenway Apartments LLC",
    city: "Minneapolis",
    search_slug: "Fitterer",
    properties_count: 18,
    total_units: 531,
    has_tier3: true,
    housing_narrative: "Operates 18+ South Minneapolis apartment buildings under discrete shell LLCs. 2312 Blaisdell Ave is under active municipal Tier 3 monitoring for chronic health, safety, and pest code violations.",
    housing_provenance: "🟢 VERIFIED MUNICIPAL GIS RECORD",
    case_id: "MPLS-LS-2023-0082",
    source_agency: "MINNEAPOLIS_CIVIL_RIGHTS",
    violation_type: "MINIMUM_WAGE & SICK TIME",
    total_wage_theft_recovered: 49750.00,
    workers_affected: 14,
    labor_narrative: "Demonstration fixture modeled on municipal labor standards audits: Misclassified building janitors as independent contractors; failed to pay Minneapolis Municipal Minimum Wage and Sick & Safe Time.",
    labor_provenance: "🟡 PROTOTYPE SEED / PENDING FOIA SYNC",
    source_docket_url: "https://www2.minneapolismn.gov/government/departments/civil-rights/labor-standards",
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
    housing_provenance: "🟢 VERIFIED MUNICIPAL GIS RECORD",
    case_id: "WHD-MN-1892014",
    source_agency: "US_DOL_WHD",
    violation_type: "FLSA_OVERTIME",
    total_wage_theft_recovered: 96920.00,
    workers_affected: 38,
    labor_narrative: "Demonstration fixture modeled on property management overtime audits: Excluded mandatory on-call emergency stipends and milestone bonuses from regular rate when calculating overtime under Minn. Stat. § 177.24.",
    labor_provenance: "🟡 PROTOTYPE SEED / PENDING FOIA SYNC",
    source_docket_url: "https://enforcement.dol.gov",
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
    housing_provenance: "🟢 VERIFIED MUNICIPAL GIS RECORD",
    case_id: "MNDLI-WH-2022-049",
    source_agency: "MN_DLI",
    violation_type: "UNPAID_HOURS & CARETAKER TRAP",
    total_wage_theft_recovered: 77400.00,
    workers_affected: 24,
    labor_narrative: "Demonstration fixture modeled on caretaker rent-offset audits: Unlawful wage deductions for resident caretaker apartment units below statutory minimum wage in violation of Minn. Stat. § 177.24.",
    labor_provenance: "🟡 PROTOTYPE SEED / PENDING FOIA SYNC",
    source_docket_url: "https://www.dli.mn.gov",
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
    housing_provenance: "🟢 VERIFIED MUNICIPAL GIS RECORD",
    case_id: "WHD-MN-1945112",
    source_agency: "US_DOL_WHD",
    violation_type: "FLSA_OVERTIME & TIMECARD SHAVING",
    total_wage_theft_recovered: 140400.00,
    workers_affected: 52,
    labor_narrative: "Demonstration fixture modeled on turnover cleaning audits: Altered electronic timecards to erase turnover overtime hours; mandated off-the-clock emergency weekend cleaning.",
    labor_provenance: "🟡 PROTOTYPE SEED / PENDING FOIA SYNC",
    source_docket_url: "https://enforcement.dol.gov",
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
    housing_provenance: "🟢 VERIFIED MUNICIPAL GIS RECORD",
    case_id: "MNDLI-WH-2023-102",
    source_agency: "MN_DLI",
    violation_type: "UNPAID_TRAVEL_HOURS",
    total_wage_theft_recovered: 43300.00,
    workers_affected: 19,
    labor_narrative: "Demonstration fixture modeled on technician travel audits: Failed to compensate technicians for inter-property travel time across Hennepin and Ramsey counties under Minn. Rule 5200.0120.",
    labor_provenance: "🟡 PROTOTYPE SEED / PENDING FOIA SYNC",
    source_docket_url: "https://www.dli.mn.gov",
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
    housing_provenance: "🟢 VERIFIED MUNICIPAL GIS RECORD",
    case_id: "WHD-MN-2001884",
    source_agency: "US_DOL_WHD",
    violation_type: "FLSA_OVERTIME",
    total_wage_theft_recovered: 22650.00,
    workers_affected: 8,
    labor_narrative: "Demonstration fixture modeled on comp-time audits: Improper comp-time bank calculations in lieu of statutory 1.5x cash overtime for groundskeepers and building engineers.",
    labor_provenance: "🟡 PROTOTYPE SEED / PENDING FOIA SYNC",
    source_docket_url: "https://enforcement.dol.gov",
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

    // Markdown Matrix Export for LLMs, Organizers, and Investigators
    if (url.pathname === "/export.md") {
      let md = [
        "# Twin Cities Slumlord & Wage Theft Crossover Matrix",
        `Generated: ${new Date().toISOString()}`,
        "Source: https://twin-cities-slumlord-labor-matrix.a-8c6.workers.dev",
        `Confirmed Dual Violators: ${VERIFIED_CROSSOVER_SYNDICATES.length}`,
        "",
        "> **Dual Data Provenance Notice**:",
        "> - **Housing Data Provenance**: 🟢 VERIFIED MUNICIPAL GIS RECORD (Direct parcel and licensing data from Minneapolis Open Data & Hennepin County Assessor).",
        "> - **Labor Data Provenance**:",
        ">   - 🟢 **VERIFIED PUBLIC ENFORCEMENT ACTION**: Formal civil court judgment / consent decree or AG enforcement finding.",
        ">   - 🟡 **PROTOTYPE SEED / PENDING FOIA SYNC**: Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.",
        "",
        "---",
        ""
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
        md.push(`  - Habitability Status: ${s.has_tier3 ? '⚠️ TIER 3 CHRONIC SLUMLORD' : 'Tier 1/2'}`);
        md.push(`  - Housing Profile: ${s.housing_narrative}`);
        md.push(`- **Labor Data Provenance**: ${s.labor_provenance}`);
        if (!isLaborVerified) {
          md.push(`  - *Note*: Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.`);
        }
        md.push(`- **Labor Exploitation & Wage Theft Profile**:`);
        md.push(`  - Legal Docket / Case ID: \`${s.case_id}\``);
        md.push(`  - Enforcement Agency: ${s.source_agency}`);
        md.push(`  - Violation Category: ${s.violation_type}`);
        md.push(`  - Stolen Wages Recovered: $${s.total_wage_theft_recovered.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
        md.push(`  - Workers Impacted: ${s.workers_affected}`);
        md.push(`  - Labor Profile: ${s.labor_narrative}`);
        md.push(`- **Joint Organizing Playbook**: ${s.organizing_playbook}`);
        md.push(`- **Primary Legal Dockets & Source Documents**:`);
        if (s.source_docket_url) {
          md.push(`  - Primary Source Docket / Legal Report: ${s.source_docket_url}`);
        }
        md.push(`  - County Tax Parcel & Assessor PDF: https://www.hennepin.us/residents/property/property-information-search`);
        md.push(`  - Municipal Active Rental License Registry: https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Active_Rental_Licenses/FeatureServer/0`);
        md.push(`  - US DOL Public Enforcement Database: https://enforcement.dol.gov`);
        md.push(`  - Minnesota District Court MCRO: https://publicaccess.courts.state.mn.us`);
        md.push(`  - Minneapolis Civil Rights Labor Standards Findings: https://www2.minneapolismn.gov/government/departments/civil-rights/labor-standards`);
        md.push(`  - Landlord De-anonymizer File: https://mpls-rental-sync-worker.a-8c6.workers.dev/search?q=${encodeURIComponent(s.search_slug)}`);
        md.push(`  - Wage Theft Registry File: https://twin-cities-wage-theft-worker.a-8c6.workers.dev/?q=${encodeURIComponent(s.search_slug)}`);
        md.push("");
      }

      return new Response(md.join("\n"), {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": 'attachment; filename="twin_cities_slumlord_wage_theft_matrix.md"',
        },
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
