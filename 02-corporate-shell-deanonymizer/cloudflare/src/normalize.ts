import {
  CANONICAL_COLUMNS,
  CanonicalRecord,
  CityAdapter,
  SeverityClass,
  canonicalParcelId,
  linkKey,
  slugifyCity,
} from "./canonical";

/** FNV-1a. Cheap, deterministic content fingerprint (not security). */
function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * Fingerprint of everything except the volatile columns, so the upsert can skip
 * a write when the source row is unchanged. synced_at always differs and
 * row_hash is the value being derived, so both are excluded.
 */
export function computeRowHash(rec: Omit<CanonicalRecord, "row_hash">): string {
  const parts = CANONICAL_COLUMNS.filter(
    (c) => c !== "synced_at" && c !== "row_hash",
  ).map((c) => String(rec[c as keyof typeof rec] ?? ""));
  return fnv1a(parts.join("|"));
}

function str(row: Record<string, unknown>, field?: string): string {
  if (!field) return "";
  const v = row[field];
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function int(row: Record<string, unknown>, field?: string): number {
  if (!field) return 1;
  const n = parseInt(String(row[field] ?? "").replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Map one raw source row onto the canonical record.
 *
 * Location fields fall back to the feed defaults when the source does not
 * publish them, so a feed that spans municipalities (or that omits city
 * entirely) stays correct. Returns null only when there is no parcel id.
 */
export function toCanonicalRecord(
  adapter: CityAdapter,
  row: Record<string, unknown>,
  syncedAt: string,
): CanonicalRecord | null {
  const f = adapter.fieldMap;
  const d = adapter.defaults;

  const apn = str(row, f.apn);
  if (!apn) return null;

  const county = str(row, f.county) || d.county;
  const state = str(row, f.state) || d.state;
  const city = str(row, f.city) || d.city;
  const jurisdictionId = str(row, f.jurisdiction) || d.jurisdictionId || slugifyCity(city, state);

  const rawSeverity = str(row, f.severity_raw);
  const severity: SeverityClass | null =
    rawSeverity && adapter.severityMap[rawSeverity]
      ? adapter.severityMap[rawSeverity]
      : null;

  const applicantEmail = str(row, f.applicant_email);
  const ownerAddress = str(row, f.owner_address);
  const ownerName = str(row, f.owner_name);
  const applicantName = str(row, f.applicant_name);

  const record: Omit<CanonicalRecord, "row_hash"> = {
    parcel_id: canonicalParcelId(state, county, apn),
    apn,
    feed_id: adapter.feed.id,
    jurisdiction_id: jurisdictionId,
    city,
    county,
    state,
    address: str(row, f.address),
    units: int(row, f.units),
    owner_name: ownerName,
    owner_address: ownerAddress,
    owner_city: str(row, f.owner_city),
    owner_state: str(row, f.owner_state),
    owner_zip: str(row, f.owner_zip),
    owner_phone: str(row, f.owner_phone),
    owner_email: str(row, f.owner_email),
    applicant_name: applicantName,
    applicant_phone: str(row, f.applicant_phone),
    applicant_email: applicantEmail,
    severity_class: severity,
    tier: rawSeverity ? `${adapter.severityLabelPrefix ?? ""}${rawSeverity}` : "",
    status: str(row, f.status) || "Active",
    source_platform: adapter.source.platform,
    source_dataset: adapter.source.dataset,
    link_key: linkKey(adapter.linker, jurisdictionId, {
      applicantEmail,
      ownerAddress,
      ownerName,
      applicantName,
    }),
    synced_at: syncedAt,
  };

  return { ...record, row_hash: computeRowHash(record) };
}
