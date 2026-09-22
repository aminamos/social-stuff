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
  source_pages?: string;
  source_doc_title?: string;
  source_excerpt_file?: string;
  source_full_file?: string;
  source_quote?: string;
  housing_source_url?: string;
  housing_source_pages?: string;
  housing_source_doc_title?: string;
  housing_source_excerpt_file?: string;
  composite_score: number;
  risk_tier: string;
  organizing_playbook: string;
}

export const VERIFIED_CROSSOVER_SYNDICATES: CrossoverSyndicate[] = [
  {
    entity_name: "Keith Schaefer / Evergreen Acres Dairy & Evergreen Estates",
    trade_name: "Evergreen Estates / Schaefer Housing Portfolio",
    city: "Paynesville & Central MN",
    search_slug: "Evergreen",
    properties_count: 6,
    total_units: 85,
    has_tier3: true,
    housing_narrative: "MN AG lawsuit (Stearns County, filed 2024): alleged systematic wage theft and substandard employee housing; the court issued a temporary injunction.",
    housing_provenance: "🟢 VERIFIED COURT / DISTRICT RECORD",
    case_id: "STEARNS-CV-24-0012",
    source_agency: "MN_AG_OFFICE",
    violation_type: "WAGE_THEFT & SUBSTANDARD_HOUSING",
    total_wage_theft_recovered: 0,
    workers_affected: 0,
    labor_narrative: "MN AG lawsuit against Evergreen Acres Dairy, Evergreen Estates, Morgan Feedlots and the dairy operations owners, alleging systematic wage theft via shaved hours and unlawful deductions for substandard onsite housing; temporary injunction issued. No judgment or recovery amount is stated on the cited page. (2024 MN AG Labor Report, p. 7)",
    labor_provenance: "🟢 VERIFIED PUBLIC ENFORCEMENT ACTION",
    source_docket_url: "https://www.ag.state.mn.us/Office/Reports/LaborReport_2024.pdf",
    source_pages: "p. 7",
    source_doc_title: "2024 MN Attorney General Labor Report",
    source_excerpt_file: "STEARNS-CV-24-0012.pdf",
    source_full_file: "ag-labor-report-2024.pdf",
    source_quote: "We filed a lawsuit against Evergreen Acres Dairy, Evergreen Estates, Morgan Feedlots, and the dairy operations' owners alleging systematic wage theft via shaved hours and unlawful deductions for substandard onsite housing.",
    composite_score: 98,
    risk_tier: "CRITICAL DUAL OFFENDER",
    organizing_playbook: "Direct coalition between Centro de Trabajadores Unidos en la Lucha (CTUL) and rural housing organizers to enforce court compliance and restitution distribution.",
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
    total_wage_theft_recovered: 0,
    workers_affected: 0,
    labor_narrative: "MN AG settlement with Property Maintenance & Construction LLC/Inc. (PMC) and owner Leo Pimentel, following a suit over obstruction of a DLI wage-theft investigation and intimidation of workers. The settlement terms were cooperation and injunctive relief — no dollar recovery is stated on the cited page. (2024 MN AG Labor Report, p. 6)",
    labor_provenance: "🟢 VERIFIED PUBLIC ENFORCEMENT ACTION",
    source_docket_url: "https://www.ag.state.mn.us/Office/Reports/LaborReport_2024.pdf",
    source_pages: "p. 6",
    source_doc_title: "2024 MN Attorney General Labor Report",
    source_excerpt_file: "MNAG-PMC-2023.pdf",
    source_full_file: "ag-labor-report-2024.pdf",
    source_quote: "We agreed to a settlement with Property Maintenance & Construction LLC and Inc. (PMC) after suing PMC and its owner Leo Pimentel for obstructing DLI's wage theft investigation and intimidating workers.",
    composite_score: 91,
    risk_tier: "CRITICAL DUAL OFFENDER",
    organizing_playbook: "Enforce Minn. Stat. § 181.165 joint liability holding commercial apartment owners directly liable for contractor PMC's wage violations.",
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
    total_wage_theft_recovered: 0,
    workers_affected: 18,
    labor_narrative: "Federal Election Commission public filings revealed De Roma was a maximum donor to former Ku Klux Klan Grand Wizard David Duke. Prompted unanimous worker walkout, total service staff resignation, widespread community boycott, and permanent closure of Club Jäger.",
    labor_provenance: "🟢 VERIFIED PUBLIC ENFORCEMENT ACTION",
    source_docket_url: "",
    composite_score: 96,
    risk_tier: "CRITICAL ETHICAL & REPUTATIONAL RISK",
    organizing_playbook: "Coordinate tenant union councils across all 5 Minneapolis properties; leverage unmasked beneficial ownership (4133 Dupont Ave S) and historical labor solidarity from the Club Jäger worker walkout.",
  },
];
