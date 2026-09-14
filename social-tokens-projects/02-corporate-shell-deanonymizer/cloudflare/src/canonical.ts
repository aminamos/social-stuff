/**
 * Frozen canonical contract for multi-jurisdiction housing ingestion.
 *
 * Three identifiers, deliberately separate:
 *   feed_id         - the ingest feed that wrote the row (cursor identity, one per adapter)
 *   jurisdiction_id - the property's municipality (e.g. minneapolis-mn, brooklyn-park-mn)
 *   parcel_id       - globally unique property key: "{STATE}:{COUNTY}:{local_id}"
 *
 * Every city is described by a declarative CityAdapter. Platform clients
 * (arcgis, socrata, ckan) know how to page a source; adapters only declare how
 * to map that source onto the canonical record. Adding a city must never
 * require editing a platform client.
 */

export type SeverityClass = "A" | "B" | "C";
export type PlatformId = "arcgis" | "socrata" | "ckan";

/** An ingest feed. One feed may cover more than one municipality. */
export interface Feed {
  /** Stable slug, unique. Cursor rows are keyed on this. e.g. "mn-hennepin-rental-licenses". */
  id: string;
  /** Human label for operators. */
  label: string;
}

/** Defaults applied when the source does not publish the field. */
export interface FeedDefaults {
  jurisdictionId: string;
  city: string;
  county: string;
  state: string;
}

/** Canonical fields a source row may be mapped onto. */
export type CanonicalField =
  | "apn"
  | "address"
  | "city"
  | "county"
  | "state"
  | "jurisdiction"
  | "units"
  | "owner_name"
  | "owner_address"
  | "owner_city"
  | "owner_state"
  | "owner_zip"
  | "owner_phone"
  | "owner_email"
  | "applicant_name"
  | "applicant_phone"
  | "applicant_email"
  | "severity_raw"
  | "status";

export interface PlatformSource {
  platform: PlatformId;
  /** Full query endpoint: ArcGIS layer URL or Socrata resource URL. */
  endpoint: string;
  /** Source dataset name/id recorded for provenance. */
  dataset: string;
  pageSize: number;
  /** Platform-native filter clause (ArcGIS `where`, Socrata `$where`). */
  where?: string;
  /** Stable sort key so pagination cannot skip or duplicate rows. */
  orderBy?: string;
  /** ArcGIS: explicit outFields list. Defaults to `*`. */
  outFields?: string;
}

/**
 * How sister properties are linked for a jurisdiction.
 *
 * - email_or_owner_address: management email, else owner mailing address.
 * - registration_contacts: owner/agent names from a separate contacts dataset.
 * - bbl: borough-block-lot joins (NYC ACRIS/PLUTO).
 */
export type LinkerStrategy =
  | "email_or_owner_address"
  | "name"
  | "registration_contacts"
  | "bbl";

export interface CityAdapter {
  feed: Feed;
  defaults: FeedDefaults;
  source: PlatformSource;
  /** canonical field -> source field name. Unmapped fields fall back to defaults / "". */
  fieldMap: Partial<Record<CanonicalField, string>>;
  /** source severity label -> canonical class. Unmapped labels become null. */
  severityMap: Record<string, SeverityClass>;
  /** Prefix applied when storing the display label, e.g. "Grade " -> "Grade C". */
  severityLabelPrefix?: string;
  linker: LinkerStrategy;
  /** Free-text note for operators (license, cadence, known gaps). */
  note?: string;
}

export interface CanonicalRecord {
  parcel_id: string;
  apn: string;
  feed_id: string;
  jurisdiction_id: string;
  city: string;
  county: string;
  state: string;
  address: string;
  units: number;
  owner_name: string;
  owner_address: string;
  owner_city: string;
  owner_state: string;
  owner_zip: string;
  owner_phone: string;
  owner_email: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string;
  severity_class: SeverityClass | null;
  tier: string;
  status: string;
  source_platform: PlatformId;
  source_dataset: string;
  link_key: string | null;
  row_hash: string;
  synced_at: string;
}

/** Columns written on upsert, in bound-parameter order. */
export const CANONICAL_COLUMNS = [
  "parcel_id",
  "apn",
  "feed_id",
  "jurisdiction_id",
  "city",
  "county",
  "state",
  "address",
  "units",
  "owner_name",
  "owner_address",
  "owner_city",
  "owner_state",
  "owner_zip",
  "owner_phone",
  "owner_email",
  "applicant_name",
  "applicant_phone",
  "applicant_email",
  "severity_class",
  "tier",
  "status",
  "source_platform",
  "source_dataset",
  "link_key",
  "row_hash",
  "synced_at",
] as const;

export type CanonicalColumn = (typeof CANONICAL_COLUMNS)[number];

export function canonicalParcelId(state: string, county: string, apn: string): string {
  const c = county.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-");
  return `${state.toUpperCase()}:${c}:${apn.trim()}`;
}

export function slugifyCity(city: string, state: string): string {
  const slug = city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug}-${state.toLowerCase()}`;
}

/**
 * Normalize an entity name for grouping. Registrations frequently repeat the
 * same contact ("X , X") and vary punctuation/case, so keep the first segment
 * and reduce to alphanumerics.
 */
export function normalizeEntityName(name: string): string {
  const first = (name || "").split(/[,;|]/)[0];
  return first
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Placeholder values that are not entities. Linking on these would collapse
 * thousands of unrelated parcels into one fake syndicate.
 */
const NON_ENTITIES = new Set([
  "",
  "n a",
  "na",
  "none",
  "unknown",
  "owner",
  "owners",
  "self",
  "dwelling units",
  "apartment",
  "apartments",
  "building",
  "property",
  "properties",
  "management",
  "same as owner",
  "see above",
]);

/**
 * Tokens that carry no identity on their own. A name made up entirely of these
 * is a role or a placeholder ("Community Manager", "Dwelling Units", "The
 * Management Office"), not an owner or agent.
 */
const GENERIC_TOKENS = new Set([
  "the",
  "and",
  "of",
  "on",
  "at",
  "community",
  "property",
  "properties",
  "site",
  "building",
  "resident",
  "apartment",
  "apartments",
  "manager",
  "management",
  "office",
  "agent",
  "admin",
  "administrator",
  "contact",
  "leasing",
  "maintenance",
  "general",
  "dwelling",
  "unit",
  "units",
  "na",
  "n",
  "none",
  "unknown",
  "self",
  "owner",
  "owners",
  "same",
  "as",
  "see",
  "above",
  "tbd",
  "null",
  "blank",
  "info",
  "information",
]);

export function isNonEntityName(normalized: string): boolean {
  if (!normalized) return true;
  if (NON_ENTITIES.has(normalized)) return true;
  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((t) => GENERIC_TOKENS.has(t));
}

/**
 * Stable key used to group sister properties.
 *
 * - email links globally, so the same management company across cities groups.
 * - owner mailing address and entity name link only within a jurisdiction, to
 *   avoid colliding on shared agent/PO-box addresses and generic names.
 */
export function linkKey(
  linker: LinkerStrategy,
  jurisdictionId: string,
  parts: {
    applicantEmail?: string;
    ownerAddress?: string;
    ownerName?: string;
    applicantName?: string;
  },
): string | null {
  const email = (parts.applicantEmail || "").trim().toLowerCase();
  const addr = (parts.ownerAddress || "").trim().toLowerCase().replace(/\s+/g, " ");
  const name = normalizeEntityName(parts.ownerName || parts.applicantName || "");
  const usableName = name && name.length >= 3 && !isNonEntityName(name) ? name : "";

  switch (linker) {
    case "name":
      return usableName ? `name:${jurisdictionId}:${usableName}` : null;
    case "email_or_owner_address":
      // Deliberately no name fallback: cities whose name field holds a building
      // or placeholder value would otherwise collapse into one false syndicate.
      if (email) return `email:${email}`;
      if (addr) return `addr:${jurisdictionId}:${addr}`;
      return null;
    default:
      return null;
  }
}
