/**
 * Shared types for tax-watch: a cron-driven monitor that polls authoritative
 * tax-law sources (IRS, state DORs, local jurisdictions) and runs discovery
 * queries through a pluggable web-search provider. Sales tax is intentionally
 * out of scope — see `topics` on each source.
 */

export type JurisdictionLevel = "federal" | "state" | "county" | "city";

/** Topics watched. Sales/use tax is deliberately excluded. */
export type TaxTopic =
  | "income"
  | "corporate"
  | "capital-gains"
  | "withholding"
  | "pass-through"
  | "credits"
  | "estate"
  | "payroll";

export interface WatchSource {
  /** Stable slug, e.g. "us-irs-newsroom". */
  id: string;
  /** "US", "MN", "NYC", "MD-counties"... */
  jurisdiction: string;
  level: JurisdictionLevel;
  agency: string;
  /** Pages polled by hash-diff. Fetch failures are recorded, not fatal. */
  urls: string[];
  /** Extra search queries beyond the per-jurisdiction templates. */
  searchQueries?: string[];
  topics: TaxTopic[];
  notes?: string;
}

export interface SearchHit {
  url: string;
  title?: string;
  snippet?: string;
}

export interface SearchProvider {
  name: string;
  search(query: string, limit: number, env: Record<string, string | undefined>): Promise<SearchHit[]>;
}

/** Per-URL snapshot persisted in R2 under watch/state/<sourceId>/<urlHash>.json */
export interface SourceState {
  sourceId: string;
  url: string;
  sha256: string;
  status: number;
  fetchedAt: string;
  /** Sorted unique normalized words — basis of the similarity diff. */
  words: string[];
}

export interface ChangeRecord {
  at: string;
  sourceId: string;
  jurisdiction: string;
  level: JurisdictionLevel;
  kind: "content-change" | "fetch-error" | "new-search-result";
  url: string;
  detail?: string;
  oldHash?: string;
  newHash?: string;
  /** True when the hit URL looks like an official government domain. */
  official?: boolean;
}

export interface WatchRunSummary {
  ranAt: string;
  provider: string;
  sourcesPolled: number;
  urlsPolled: number;
  fetchErrors: number;
  contentChanges: number;
  newSearchResults: number;
  changesKey: string;
}
