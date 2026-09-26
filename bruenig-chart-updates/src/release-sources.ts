/* Dataset index pages the monthly cron re-checks for new vintages.
 * This is a build-time copy of data/release-urls.json (same shape:
 * dataset → {index_url, regex_hint, label}); the JSON is the pipeline's
 * file, this module is what the worker actually imports. Keep in sync.
 * regex_hint must yield the vintage in capture group 1.
 * `headers` are merged into the index fetch (OECD SDMX needs
 * Accept: text/csv or it answers 406/403).
 */

export interface ReleaseSource {
  label: string;
  index_url: string;
  regex_hint: string;
  headers?: Record<string, string>;
}

export const RELEASE_SOURCES: Record<string, ReleaseSource> = {
  "cps-asec": {
    label: "CPS ASEC public-use files (new-format CSV)",
    index_url: "https://www2.census.gov/programs-surveys/cps/datasets/",
    // max capture = newest ASEC release year (income year = capture - 1)
    regex_hint: 'href="(\\d{4})/"',
  },
  scf: {
    label: "Survey of Consumer Finances",
    index_url: "https://www.federalreserve.gov/econres/scfindex.htm",
    // max capture = latest SCF survey year (triennial)
    regex_hint: "(20\\d{2})\\s*Survey of Consumer",
  },
  "oecd-idd": {
    label: "OECD Income Distribution Database (DF_IDD)",
    index_url:
      "https://sdmx.oecd.org/public/rest/v1/data/OECD.WISE.INE,DSD_WISE_IDD@DF_IDD/USA.A.PR_INC_DISP._Z.PT_POP._T.METH2012.D_CUR.PL_50",
    // max capture = latest TIME_PERIOD year in the CSV row set
    regex_hint: ",(\\d{4}),\\d",
    headers: { Accept: "text/csv" },
  },
};

/** Fallback when a releases row names a dataset with no configured source. */
export const GENERIC_YEAR_HINT = "(20\\d{2})";
