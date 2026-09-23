/**
 * Seed registry of authoritative tax-law sources.
 *
 * Scope: income, corporate, capital-gains, withholding, pass-through,
 * credits, estate, payroll. Sales/use tax is intentionally excluded.
 *
 * `urls` are polled by hash-diff every cron run — a change only means
 * "something on this page moved" and lands in watch/changes/ for review.
 * States whose DOR news URL we could not verify poll their homepage as a
 * coarse signal; tighten these over time (fetch errors are recorded, so
 * dead URLs surface instead of failing silently). Per-state search
 * queries are generated at runtime from SEARCH_TEMPLATES below.
 */

import type { WatchSource } from "./types.js";

/** Runtime query templates: {name} state name, {domain} first URL host, {year}. */
export const SEARCH_TEMPLATES = [
  "{name} income tax law changes {year}",
  "{name} department of revenue administrative rules income tax {year}",
];

const INCOME: WatchSource["topics"] = ["income", "corporate", "withholding", "pass-through", "credits"];
const CG: WatchSource["topics"] = [...INCOME, "capital-gains"];

export const WATCH_SOURCES: WatchSource[] = [
  // ------------------------------------------------------------- federal
  {
    id: "us-irs-newsroom",
    jurisdiction: "US",
    level: "federal",
    agency: "IRS",
    urls: ["https://www.irs.gov/newsroom", "https://www.irs.gov/forms-instructions"],
    topics: CG,
    notes: "News releases + forms index; hash-diff is coarse on the index page.",
  },
  {
    id: "us-federal-register-irs",
    jurisdiction: "US",
    level: "federal",
    agency: "Federal Register (IRS rules/notices)",
    urls: [
      "https://www.federalregister.gov/api/v1/documents.json?per_page=20&order=newest&conditions%5Bterm%5D=internal+revenue",
    ],
    topics: CG,
    notes: "JSON API — new IRS rules/proposed regs/notices appear here first.",
  },

  // --------------------------------------------------------------- CA/MN/NY (priority states)
  {
    id: "ca-ftb-newsroom",
    jurisdiction: "CA",
    level: "state",
    agency: "Franchise Tax Board",
    urls: ["https://www.ftb.ca.gov/about-ftb/newsroom/", "https://www.ftb.ca.gov/forms/"],
    topics: CG,
    notes: "ftb.ca.gov bot-walls bare curl; watch for persistent fetch-error records.",
  },
  {
    id: "mn-dor-updates",
    jurisdiction: "MN",
    level: "state",
    agency: "Department of Revenue",
    urls: [
      "https://www.revenue.state.mn.us/tax-law-changes",
      "https://www.revenue.state.mn.us/newsroom",
      "https://www.revenue.state.mn.us/individuals",
    ],
    topics: INCOME,
    notes: "tax-law-changes is a dedicated page listing enacted changes by year.",
  },
  {
    id: "ny-tax-press",
    jurisdiction: "NY",
    level: "state",
    agency: "Department of Taxation and Finance",
    urls: ["https://www.tax.ny.gov/press/", "https://www.tax.ny.gov/forms/"],
    topics: CG,
    notes: "Also covers NYC/Yonkers resident tax (administered on IT-201).",
  },

  // ---------------------------------------------------- all other states + DC + PR
  // URLs are DOR homepages / best-known landing pages unless noted.
  { id: "al-dor", jurisdiction: "AL", level: "state", agency: "Dept. of Revenue", urls: ["https://www.revenue.alabama.gov/"], topics: INCOME },
  { id: "ak-dor", jurisdiction: "AK", level: "state", agency: "Dept. of Revenue Tax Div.", urls: ["https://tax.alaska.gov/"], topics: ["corporate", "pass-through"], notes: "No personal income tax; corporate only." },
  { id: "az-dor", jurisdiction: "AZ", level: "state", agency: "Dept. of Revenue", urls: ["https://azdor.gov/"], topics: INCOME },
  { id: "ar-dfa", jurisdiction: "AR", level: "state", agency: "Dept. of Finance & Admin.", urls: ["https://www.dfa.arkansas.gov/"], topics: INCOME },
  { id: "co-tax", jurisdiction: "CO", level: "state", agency: "Dept. of Revenue", urls: ["https://tax.colorado.gov/"], topics: INCOME },
  { id: "ct-drs", jurisdiction: "CT", level: "state", agency: "Dept. of Revenue Services", urls: ["https://portal.ct.gov/drs"], topics: CG },
  { id: "dc-otr", jurisdiction: "DC", level: "state", agency: "Office of Tax & Revenue", urls: ["https://otr.cfo.dc.gov/"], topics: INCOME },
  { id: "de-dor", jurisdiction: "DE", level: "state", agency: "Div. of Revenue", urls: ["https://revenue.delaware.gov/"], topics: INCOME },
  { id: "fl-dor", jurisdiction: "FL", level: "state", agency: "Dept. of Revenue", urls: ["https://floridarevenue.com/"], topics: ["corporate"], notes: "No personal income tax; corporate only." },
  { id: "ga-dor", jurisdiction: "GA", level: "state", agency: "Dept. of Revenue", urls: ["https://dor.georgia.gov/"], topics: INCOME },
  { id: "hi-tax", jurisdiction: "HI", level: "state", agency: "Dept. of Taxation", urls: ["https://tax.hawaii.gov/"], topics: CG },
  { id: "id-tax", jurisdiction: "ID", level: "state", agency: "State Tax Commission", urls: ["https://tax.idaho.gov/"], topics: INCOME },
  { id: "il-tax", jurisdiction: "IL", level: "state", agency: "Dept. of Revenue", urls: ["https://tax.illinois.gov/"], topics: INCOME },
  { id: "in-dor", jurisdiction: "IN", level: "state", agency: "Dept. of Revenue", urls: ["https://www.in.gov/dor/"], topics: INCOME, notes: "County income tax (LIT) rates published annually — county level folded into state watch." },
  { id: "ia-dor", jurisdiction: "IA", level: "state", agency: "Dept. of Revenue", urls: ["https://revenue.iowa.gov/"], topics: INCOME },
  { id: "ks-dor", jurisdiction: "KS", level: "state", agency: "Dept. of Revenue", urls: ["https://www.ksrevenue.gov/"], topics: INCOME },
  { id: "ky-dor", jurisdiction: "KY", level: "state", agency: "Dept. of Revenue", urls: ["https://revenue.ky.gov/"], topics: INCOME, notes: "Local occupational license taxes exist; not covered — city-level seed needed." },
  { id: "la-dor", jurisdiction: "LA", level: "state", agency: "Dept. of Revenue", urls: ["https://revenue.louisiana.gov/"], topics: INCOME },
  { id: "me-rev", jurisdiction: "ME", level: "state", agency: "Maine Revenue Services", urls: ["https://www.maine.gov/revenue/"], topics: INCOME },
  { id: "md-tax", jurisdiction: "MD", level: "state", agency: "Comptroller", urls: ["https://www.marylandtaxes.gov/"], topics: INCOME, notes: "County piggyback income tax — annual local-rate notices posted here." },
  { id: "ma-dor", jurisdiction: "MA", level: "state", agency: "Dept. of Revenue", urls: ["https://www.mass.gov/orgs/massachusetts-department-of-revenue"], topics: CG },
  { id: "mi-treasury", jurisdiction: "MI", level: "state", agency: "Treasury", urls: ["https://www.michigan.gov/taxes/"], topics: INCOME, notes: "City income taxes (Detroit etc.) administered under this dept." },
  { id: "ms-dor", jurisdiction: "MS", level: "state", agency: "Dept. of Revenue", urls: ["https://www.dor.ms.gov/"], topics: INCOME },
  { id: "mo-dor", jurisdiction: "MO", level: "state", agency: "Dept. of Revenue", urls: ["https://dor.mo.gov/"], topics: INCOME, notes: "STL + KC 1% earnings tax administered locally — see city entries." },
  { id: "mt-dor", jurisdiction: "MT", level: "state", agency: "Dept. of Revenue", urls: ["https://mtrevenue.gov/"], topics: CG },
  { id: "ne-dor", jurisdiction: "NE", level: "state", agency: "Dept. of Revenue", urls: ["https://revenue.nebraska.gov/"], topics: INCOME },
  { id: "nv-tax", jurisdiction: "NV", level: "state", agency: "Dept. of Taxation", urls: ["https://tax.nv.gov/"], topics: ["corporate", "payroll"], notes: "No income tax; commerce tax + MBT payroll only." },
  { id: "nh-dra", jurisdiction: "NH", level: "state", agency: "Dept. of Revenue Admin.", urls: ["https://www.revenue.nh.gov/"], topics: ["corporate", "pass-through"], notes: "I&D tax repealed for TY2025+; watch business taxes." },
  { id: "nj-tax", jurisdiction: "NJ", level: "state", agency: "Div. of Taxation", urls: ["https://www.nj.gov/treasury/taxation/"], topics: CG },
  { id: "nm-tax", jurisdiction: "NM", level: "state", agency: "Taxation & Revenue Dept.", urls: ["https://www.tax.newmexico.gov/"], topics: INCOME },
  { id: "nc-dor", jurisdiction: "NC", level: "state", agency: "Dept. of Revenue", urls: ["https://www.ncdor.gov/"], topics: INCOME },
  { id: "nd-tax", jurisdiction: "ND", level: "state", agency: "Tax Commissioner", urls: ["https://www.tax.nd.gov/"], topics: INCOME },
  { id: "oh-tax", jurisdiction: "OH", level: "state", agency: "Dept. of Taxation", urls: ["https://tax.ohio.gov/"], topics: INCOME, notes: "Municipal income taxes — see city entries (RITA/CCA)." },
  { id: "ok-otc", jurisdiction: "OK", level: "state", agency: "Tax Commission", urls: ["https://oklahoma.gov/tax.html"], topics: INCOME },
  { id: "or-dor", jurisdiction: "OR", level: "state", agency: "Dept. of Revenue", urls: ["https://www.oregon.gov/dor/"], topics: CG, notes: "Also administers statewide transit tax + Portland metro taxes." },
  { id: "pa-dor", jurisdiction: "PA", level: "state", agency: "Dept. of Revenue", urls: ["https://www.pa.gov/agencies/revenue.html"], topics: INCOME, notes: "Local EIT (Act 32) administered by county collectors — see munstats entry." },
  { id: "pr-hacienda", jurisdiction: "PR", level: "state", agency: "Hacienda", urls: ["https://hacienda.pr.gov/"], topics: INCOME, notes: "Spanish-language releases." },
  { id: "ri-tax", jurisdiction: "RI", level: "state", agency: "Div. of Taxation", urls: ["https://tax.ri.gov/"], topics: INCOME },
  { id: "sc-dor", jurisdiction: "SC", level: "state", agency: "Dept. of Revenue", urls: ["https://dor.sc.gov/"], topics: INCOME },
  { id: "sd-dor", jurisdiction: "SD", level: "state", agency: "Dept. of Revenue", urls: ["https://dor.sd.gov/"], topics: ["corporate"], notes: "No income tax; financial-institution excise only." },
  { id: "tn-dor", jurisdiction: "TN", level: "state", agency: "Dept. of Revenue", urls: ["https://www.tn.gov/revenue.html"], topics: ["corporate"], notes: "Hall tax fully repealed; franchise & excise only." },
  { id: "tx-comptroller", jurisdiction: "TX", level: "state", agency: "Comptroller", urls: ["https://comptroller.texas.gov/"], topics: ["corporate"], notes: "No income tax; franchise (margin) tax only." },
  { id: "ut-tax", jurisdiction: "UT", level: "state", agency: "State Tax Commission", urls: ["https://tax.utah.gov/"], topics: INCOME },
  { id: "vt-tax", jurisdiction: "VT", level: "state", agency: "Dept. of Taxes", urls: ["https://tax.vermont.gov/"], topics: INCOME },
  { id: "va-tax", jurisdiction: "VA", level: "state", agency: "Virginia Tax", urls: ["https://www.tax.virginia.gov/"], topics: INCOME },
  { id: "wa-dor", jurisdiction: "WA", level: "state", agency: "Dept. of Revenue", urls: ["https://dor.wa.gov/"], topics: ["corporate", "capital-gains"], notes: "Capital-gains excise tax since 2022; B&O gross-receipts tax." },
  { id: "wv-tax", jurisdiction: "WV", level: "state", agency: "Tax Division", urls: ["https://tax.wv.gov/"], topics: INCOME },
  { id: "wi-dor", jurisdiction: "WI", level: "state", agency: "Dept. of Revenue", urls: ["https://www.revenue.wi.gov/"], topics: INCOME },
  { id: "wy-rev", jurisdiction: "WY", level: "state", agency: "Dept. of Revenue", urls: ["https://revenue.wyo.gov/"], topics: ["corporate"], notes: "No income or corporate tax; monitored anyway." },

  // ------------------------------------------------- local income-tax jurisdictions
  {
    id: "md-county-lit",
    jurisdiction: "MD-counties",
    level: "county",
    agency: "Comptroller of Maryland",
    urls: ["https://www.marylandtaxes.gov/"],
    topics: ["income", "withholding"],
    notes: "23 counties + Baltimore City set piggyback rates annually. County-rate page URL needs verifying — homepage polled meanwhile.",
  },
  {
    id: "nyc-dof",
    jurisdiction: "NYC",
    level: "city",
    agency: "NYC Dept. of Finance",
    urls: ["https://www.nyc.gov/site/finance/index.page"],
    topics: ["income", "corporate"],
    notes: "NYC PIT piggybacks on NYS IT-201; business taxes are NYC-administered.",
  },
  {
    id: "detroit-income-tax",
    jurisdiction: "MI-Detroit",
    level: "city",
    agency: "City of Detroit / MI Treasury",
    urls: ["https://detroitmi.gov/departments/office-chief-financial-officer"],
    topics: ["income", "withholding"],
    notes: "Largest of the MI city income taxes; site bot-walls datacenter IPs.",
  },
  {
    id: "oh-rita",
    jurisdiction: "OH-RITA",
    level: "city",
    agency: "Regional Income Tax Agency",
    urls: ["https://www.ritaohio.com/"],
    topics: ["income", "withholding"],
    notes: "Administers municipal income tax for ~300 OH municipalities.",
  },
  {
    id: "pa-munstats-eit",
    jurisdiction: "PA-local",
    level: "county",
    agency: "PA DCED / Act 32 collectors",
    urls: ["https://www.pa.gov/agencies/dced.html", "https://munstats.pa.gov/"],
    topics: ["income", "withholding"],
    notes: "EIT rates by municipality/school district (Act 32); munstats.pa.gov may block datacenter IPs.",
  },
  {
    id: "portland-revenue",
    jurisdiction: "OR-Portland",
    level: "city",
    agency: "Portland Revenue Division",
    urls: ["https://www.portland.gov/revenue"],
    topics: ["income", "corporate"],
    notes: "Metro SHS + Multnomah PFA + city business tax.",
  },
  {
    id: "stl-earnings-tax",
    jurisdiction: "MO-StLouis",
    level: "city",
    agency: "City of St. Louis Collector",
    urls: ["https://www.stlouis-mo.gov/government/departments/collector/earnings-tax/"],
    topics: ["income", "payroll"],
    notes: "1% earnings tax.",
  },
  {
    id: "kc-earnings-tax",
    jurisdiction: "MO-KansasCity",
    level: "city",
    agency: "KCMO Revenue Division",
    urls: ["https://www.kcmo.gov/city-hall/departments/finance/earnings-tax"],
    topics: ["income", "payroll"],
    notes: "1% earnings tax; verify URL.",
  },
];
