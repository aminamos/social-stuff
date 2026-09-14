import {
  VIOLATION_COLUMNS,
  ViolationAdapter,
  ViolationRecord,
  toBBL,
} from "./canonical";
import { fetchPage } from "./platforms";
import { SyncEnv, SyncResult, SyncState, D1_QUERY_BUDGET, STATEMENTS_PER_BATCH } from "./sync";

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
 * Fingerprint of everything except the volatile columns, so the upsert can
 * skip a write when the source row is unchanged. synced_at always differs and
 * row_hash is the value being derived, so both are excluded.
 */
export function computeViolationHash(
  rec: Omit<ViolationRecord, "row_hash">,
): string {
  const parts = VIOLATION_COLUMNS.filter(
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

/**
 * Map one raw violations row onto the canonical violation record. The join
 * key is the verbatim parcel key (HPD "bbl", nullable) with a derived
 * fallback (BBL from boroid/block/lot). Returns null only when there is no
 * violation id.
 */
export function toViolationRecord(
  adapter: ViolationAdapter,
  row: Record<string, unknown>,
  syncedAt: string,
): ViolationRecord | null {
  const violationId = str(row, adapter.violationIdField);
  if (!violationId) return null;

  const verbatim = adapter.joinKeyField ? str(row, adapter.joinKeyField) : "";
  const joinKey = verbatim || (adapter.computeJoinKey ? adapter.computeJoinKey(row) : "");
  const openValue = str(row, adapter.openField);
  const isOpen = adapter.openValues.includes(openValue) ? 1 : 0;

  const record: Omit<ViolationRecord, "row_hash"> = {
    feed_id: adapter.feed.id,
    violation_id: violationId,
    join_key: joinKey || null,
    violation_class: str(row, adapter.classField) || null,
    status: str(row, adapter.statusField),
    is_open: isOpen,
    address: adapter.addressField ? str(row, adapter.addressField) : "",
    boro: adapter.boroField ? str(row, adapter.boroField) : "",
    description: adapter.descriptionField ? str(row, adapter.descriptionField) : "",
    source_platform: adapter.source.platform,
    source_dataset: adapter.source.dataset,
    synced_at: syncedAt,
  };

  return { ...record, row_hash: computeViolationHash(record) };
}

/**
 * NYC HPD Housing Maintenance Code Violations, bounded to Open + Class C.
 * https://data.cityofnewyork.us/resource/wvxf-dwi5.json
 *
 * Scope is deliberately narrow: violationstatus='Open' AND class='C'
 * (immediately hazardous). The equality-only $where keeps the read
 * index-friendly and the fill inside the per-tick query budget.
 */
export const nycViolations: ViolationAdapter = {
  feed: {
    id: "ny-hpd-violations-open-c",
    label: "NYC HPD Violations (Open, Class C)",
  },
  source: {
    platform: "socrata",
    endpoint: "https://data.cityofnewyork.us/resource/wvxf-dwi5.json",
    dataset: "wvxf-dwi5",
    pageSize: 1000,
    where: "violationstatus='Open' AND class='C'",
    orderBy: ":id",
  },
  violationIdField: "violationid",
  joinKeyField: "bbl",
  computeJoinKey: (row) => toBBL(row["boroid"], row["block"], row["lot"]),
  classField: "class",
  statusField: "currentstatus",
  openField: "violationstatus",
  openValues: ["Open"],
  boroField: "boro",
  descriptionField: "novdescription",
  enabled: true,
  note: "Bounded to Open + Class C only. join_key is verbatim bbl (nullable) with BBL fallback. Joins registry on apn equality.",
};

/**
 * Seattle violations (dataset ez4a-iug7). Declared behind enabled=false:
 * visible in /feeds and /sync/status, never filled until the schema is
 * verified and the flag is flipped. LA is parked (no adapter declared).
 */
export const seattleViolations: ViolationAdapter = {
  feed: {
    id: "wa-seattle-violations",
    label: "Seattle Violations (declared, not filled)",
  },
  source: {
    platform: "socrata",
    endpoint: "https://data.seattle.gov/resource/ez4a-iug7.json",
    dataset: "ez4a-iug7",
    pageSize: 1000,
    orderBy: ":id",
  },
  violationIdField: "violationid",
  classField: "class",
  statusField: "status",
  openField: "status",
  openValues: ["Open"],
  enabled: false,
  note: "Declared but disabled: schema unverified, no fill. Flip enabled after verifying id/class/status fields.",
};

/** Chicago violations (dataset 22u3-xenr). Declared behind enabled=false. */
export const chicagoViolations: ViolationAdapter = {
  feed: {
    id: "il-chicago-violations",
    label: "Chicago Violations (declared, not filled)",
  },
  source: {
    platform: "socrata",
    endpoint: "https://data.cityofchicago.org/resource/22u3-xenr.json",
    dataset: "22u3-xenr",
    pageSize: 1000,
    orderBy: ":id",
  },
  violationIdField: "violationid",
  classField: "class",
  statusField: "status",
  openField: "status",
  openValues: ["Open"],
  enabled: false,
  note: "Declared but disabled: schema unverified, no fill. Flip enabled after verifying id/class/status fields.",
};

/**
 * Charlotte NC Code Enforcement Cases (All), bounded to active cases.
 * https://gis.charlottenc.gov/arcgis/rest/services/HNS/CodeEnforcementCasesAll/MapServer/0
 *
 * CaseStatus values verified live: Closed (425154), Open (3502), New (457).
 * The layer renderer groups New;Open as active vs Closed, so the where
 * clause keeps both and openValues match it. join_key is ParcelId.
 */
export const charlotteViolations: ViolationAdapter = {
  feed: {
    id: "nc-charlotte-code-enforcement",
    label: "Charlotte NC Code Enforcement Cases (All)",
  },
  source: {
    platform: "arcgis",
    endpoint:
      "https://gis.charlottenc.gov/arcgis/rest/services/HNS/CodeEnforcementCasesAll/MapServer/0",
    dataset: "CodeEnforcementCasesAll",
    pageSize: 1000,
    where: "CaseStatus IN ('New', 'Open')",
    orderBy: "OBJECTID",
  },
  violationIdField: "CaseNumber",
  joinKeyField: "ParcelId",
  classField: "CaseType",
  statusField: "CaseStatus",
  openField: "CaseStatus",
  openValues: ["New", "Open"],
  addressField: "FullAddress",
  enabled: true,
  note: "Bounded to CaseStatus New + Open (verified literals). join_key is ParcelId. Joins registry on apn equality.",
};

/**
 * Miami-Dade County Code Violations (CCVIOL), bounded to non-closed cases.
 * https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/CCVIOL_gdb/FeatureServer/0
 *
 * CASE_STATUS codebook verified live against STAT_DESC: 1=Open (9191),
 * 2=Closed (148218), 4=Lien (7140), 6=Civil (337), 8=Referred to Internal
 * Compliance (15247), 9=Active LP (76). Everything but Closed (2) is an
 * outstanding enforcement state, so the where clause excludes only '2'.
 * join_key is FOLIO.
 */
export const miamiDadeViolations: ViolationAdapter = {
  feed: {
    id: "fl-miami-dade-code-violations",
    label: "Miami-Dade Code Violations (CCVIOL)",
  },
  source: {
    platform: "arcgis",
    endpoint:
      "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/CCVIOL_gdb/FeatureServer/0",
    dataset: "CCVIOL_gdb",
    pageSize: 1000,
    where: "CASE_STATUS <> '2'",
    orderBy: "OBJECTID",
  },
  violationIdField: "CASE_NUM",
  joinKeyField: "FOLIO",
  classField: "STAT_DESC",
  statusField: "CASE_STATUS",
  openField: "CASE_STATUS",
  openValues: ["1", "4", "6", "8", "9"],
  addressField: "ADDRESS",
  descriptionField: "PROBLEM_DESC",
  enabled: true,
  note: "CASE_STATUS codes: 1=Open, 4=Lien, 6=Civil, 8=Referred to Internal Compliance, 9=Active LP, 2=Closed (excluded). join_key is FOLIO. Joins registry on apn equality.",
};

/**
 * Nashville Property Standards violations, bounded to open requests.
 * https://services2.arcgis.com/HdTo6HJqh92wn4D8/arcgis/rest/services/Property_Standards_Violations_2/FeatureServer/0
 *
 * Status values verified live: DONE (39871), OPEN (3369), CLOSED (49).
 * Request_Nbr (e.g. "23-1354521") is the stable violation id and
 * Subtype_Description (e.g. "Short Term Rental Property", "Codes Housing
 * Request") is the class. join_key is Property_APN (nullable).
 */
export const nashvilleViolations: ViolationAdapter = {
  feed: {
    id: "tn-nashville-property-standards",
    label: "Nashville Property Standards",
  },
  source: {
    platform: "arcgis",
    endpoint:
      "https://services2.arcgis.com/HdTo6HJqh92wn4D8/arcgis/rest/services/Property_Standards_Violations_2/FeatureServer/0",
    dataset: "Property_Standards_Violations_2",
    pageSize: 1000,
    where: "Status='OPEN'",
    orderBy: "ObjectId",
  },
  violationIdField: "Request_Nbr",
  joinKeyField: "Property_APN",
  classField: "Subtype_Description",
  statusField: "Status",
  openField: "Status",
  openValues: ["OPEN"],
  addressField: "Property_Address",
  descriptionField: "Violations_Noted",
  enabled: true,
  note: "Bounded to Status OPEN (verified literal). Property_Owner is carried in the source but not in the canonical record. join_key is Property_APN (nullable). Joins registry on apn equality.",
};

/**
 * Las Vegas Code Enforcement, bounded to open rows.
 * https://services1.arcgis.com/F1v0ufATbBQScMtY/arcgis/rest/services/Code_Enforcement_Open_Data/FeatureServer/0
 *
 * STAT values verified live: Closed (19147), Open (9357), Void (1). The
 * layer publishes no case-number column, so the OID ObjectId is the stable
 * violation id (one row per violation line). Parcel_Number is Double; the
 * str() coercion in toViolationRecord handles it. ADDRESS usually holds a
 * street address but falls back to the parcel number on some rows.
 */
export const lasVegasViolations: ViolationAdapter = {
  feed: {
    id: "nv-las-vegas-code-enforcement",
    label: "Las Vegas Code Enforcement",
  },
  source: {
    platform: "arcgis",
    endpoint:
      "https://services1.arcgis.com/F1v0ufATbBQScMtY/arcgis/rest/services/Code_Enforcement_Open_Data/FeatureServer/0",
    dataset: "Code_Enforcement_Open_Data",
    pageSize: 1000,
    where: "STAT='Open'",
    orderBy: "ObjectId",
  },
  violationIdField: "ObjectId",
  joinKeyField: "Parcel_Number",
  classField: "DESCRIPT",
  statusField: "STAT",
  openField: "STAT",
  openValues: ["Open"],
  addressField: "ADDRESS",
  descriptionField: "DESCRIPT",
  enabled: true,
  note: "No case-number column published: ObjectId (OID, unique per row) is the violation id. join_key is Parcel_Number (Double, coerced by str()). Joins registry on apn equality.",
};

/**
 * Phoenix NSD Property Maintenance complaints, bounded to non-closed cases.
 * https://maps.phoenix.gov/pub/rest/services/Public/NSD_Property_Maintenance/MapServer/0
 *
 * CSM_STATUS values verified live (40 distinct): every closed state starts
 * with CLOSED or CASE CLOSED (30833 rows total, 1799 kept by the where
 * clause). No parcel column is published, so this feed is address-join
 * only: no joinKeyField, join_key stays null. CSM_STATUS doubles as the
 * class since no separate class column exists.
 */
export const phoenixViolations: ViolationAdapter = {
  feed: {
    id: "az-phoenix-property-maintenance",
    label: "Phoenix Property Maintenance (NSD)",
  },
  source: {
    platform: "arcgis",
    endpoint:
      "https://maps.phoenix.gov/pub/rest/services/Public/NSD_Property_Maintenance/MapServer/0",
    dataset: "NSD_Property_Maintenance",
    pageSize: 1000,
    where: "NOT (CSM_STATUS LIKE 'CLOSED%' OR CSM_STATUS LIKE 'CASE CLOSED%')",
    orderBy: "ESRI_OID",
  },
  violationIdField: "CSM_CASENO",
  classField: "CSM_STATUS",
  statusField: "CSM_STATUS",
  openField: "CSM_STATUS",
  openValues: [
    "ABATEMENT",
    "CASE HAS BEEN UNFROZEN",
    "CASE ON APPEAL",
    "CASE REFERRED",
    "EXTENSION GRANTED",
    "IN RESEARCH",
    "INITIAL INSPECTION",
    "NOTICE OF VIOLATION ISSUED",
    "REQUESTED ASSISTANCE",
    "REVIEW NEEDED",
    "TICKET ISSUED",
  ],
  addressField: "CSM_ADDRESS",
  enabled: true,
  note: "Address-join only: no parcel column published, join_key stays null. Closed states (CLOSED% / CASE CLOSED%) excluded by the where clause.",
};

/**
 * West Sacramento Code Enforcement, bounded to non-closed cases.
 * https://gis.cityofwestsacramento.org/server/rest/services/code_enforcement/MapServer/0
 *
 * Status values verified live: CLOSED (14909), ENFORCEMENT (183),
 * COMPLAINT RECEIVED (8), INSPECTIONS (7). The Type column is constant
 * ('ENFORCEMENT'), so Status doubles as the class. join_key is Parcel.
 */
export const westSacViolations: ViolationAdapter = {
  feed: {
    id: "ca-west-sac-code-enforcement",
    label: "West Sacramento Code Enforcement",
  },
  source: {
    platform: "arcgis",
    endpoint:
      "https://gis.cityofwestsacramento.org/server/rest/services/code_enforcement/MapServer/0",
    dataset: "code_enforcement",
    pageSize: 1000,
    where: "Status IN ('COMPLAINT RECEIVED', 'ENFORCEMENT', 'INSPECTIONS')",
    orderBy: "OBJECTID",
  },
  violationIdField: "CaseNumber",
  joinKeyField: "Parcel",
  classField: "Status",
  statusField: "Status",
  openField: "Status",
  openValues: ["COMPLAINT RECEIVED", "ENFORCEMENT", "INSPECTIONS"],
  addressField: "Address",
  enabled: true,
  note: "Bounded to non-CLOSED Status (verified literals). Type column is constant, so Status doubles as the class. join_key is Parcel. Joins registry on apn equality.",
};

export const VIOLATION_ADAPTERS: ViolationAdapter[] = [
  nycViolations,
  seattleViolations,
  chicagoViolations,
  charlotteViolations,
  miamiDadeViolations,
  nashvilleViolations,
  lasVegasViolations,
  phoenixViolations,
  westSacViolations,
];

export function getViolationAdapter(feedId: string): ViolationAdapter | undefined {
  return VIOLATION_ADAPTERS.find((a) => a.feed.id === feedId);
}

const VIOLATION_UPSERT_SQL = (() => {
  const cols = VIOLATION_COLUMNS.join(", ");
  const placeholders = VIOLATION_COLUMNS.map(() => "?").join(", ");
  const updates = VIOLATION_COLUMNS.filter(
    (c) => c !== "feed_id" && c !== "violation_id",
  )
    .map((c) => `${c}=excluded.${c}`)
    .join(", ");
  // Same hash-skip guard as the registry upsert: with 3 indexes a no-op
  // update still bills written rows, so skip the write when nothing changed.
  return `INSERT INTO violations (${cols}) VALUES (${placeholders})
          ON CONFLICT(feed_id, violation_id) DO UPDATE SET ${updates}
          WHERE violations.row_hash IS NOT excluded.row_hash`;
})();

function bindingsFor(rec: ViolationRecord): (string | number | null)[] {
  return VIOLATION_COLUMNS.map(
    (c) => rec[c as keyof ViolationRecord] as string | number | null,
  );
}

function socrataTokenFor(env: SyncEnv, endpoint: string): string | undefined {
  const raw = (env.SOCRATA_APP_TOKEN || "").trim();
  if (!raw) return undefined;
  if (!raw.startsWith("{")) return raw;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    const host = new URL(endpoint).host;
    return map[host] || map["*"] || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Drain one violations feed within a D1 query budget. Mirrors syncAdapter:
 * whole pages only, persisted offset cursor in the same sync_state table
 * (keyed by the violation feed id), per-(feed, violation) dedupe, row_hash
 * skip, retry via the shared platform client. Disabled adapters are a no-op.
 */
export async function syncViolationAdapter(
  env: SyncEnv,
  adapter: ViolationAdapter,
  opts: { budget?: number; state?: SyncState; reset?: boolean } = {},
): Promise<SyncResult> {
  const budget = opts.budget ?? D1_QUERY_BUDGET;
  const feedId = adapter.feed.id;
  const syncedAt = new Date().toISOString();

  let queriesUsed = 0;
  let rowsWritten = 0;
  let offset = opts.state?.offset ?? 0;
  let rowsTotal = opts.state?.rows_total ?? 0;

  if (!adapter.enabled && !opts.reset) {
    return { feed_id: feedId, processed: 0, offset, done: true, queriesUsed, rowsWritten };
  }

  if (opts.reset) {
    await env.DB.prepare(
      `INSERT INTO sync_state (feed_id, offset, rows_total, updated_at, completed_at, last_error)
       VALUES (?, 0, 0, ?, NULL, NULL)
       ON CONFLICT(feed_id) DO UPDATE SET
         offset=0, rows_total=0, completed_at=NULL, last_error=NULL, updated_at=excluded.updated_at`,
    )
      .bind(feedId, syncedAt)
      .run();
    queriesUsed += 1;
    offset = 0;
    rowsTotal = 0;
  }

  const queriesPerPage = Math.ceil(adapter.source.pageSize / STATEMENTS_PER_BATCH);
  const costPerPage = queriesPerPage + 1; // batch calls + state checkpoint

  try {
    while (queriesUsed + costPerPage <= budget) {
      const { rows, hasMore } = await fetchPage(
        adapter.source.platform,
        adapter as any,
        offset,
        { socrataAppToken: socrataTokenFor(env, adapter.source.endpoint) },
      );

      if (rows.length === 0) {
        await markViolationComplete(env, feedId, rowsTotal, syncedAt);
        queriesUsed += 1;
        return { feed_id: feedId, processed: 0, offset, done: true, queriesUsed, rowsWritten };
      }

      const byId = new Map<string, D1PreparedStatement>();
      for (const row of rows) {
        const rec = toViolationRecord(adapter, row, syncedAt);
        if (rec) {
          byId.set(
            `${rec.feed_id}::${rec.violation_id}`,
            env.DB.prepare(VIOLATION_UPSERT_SQL).bind(...bindingsFor(rec)),
          );
        }
      }
      const statements = Array.from(byId.values());

      for (let i = 0; i < statements.length; i += STATEMENTS_PER_BATCH) {
        const results = await env.DB.batch(statements.slice(i, i + STATEMENTS_PER_BATCH));
        for (const r of results as any[]) rowsWritten += r?.meta?.rows_written ?? 0;
        queriesUsed += 1;
      }

      rowsTotal += rows.length;
      offset += rows.length;

      await env.DB.prepare(
        `INSERT INTO sync_state (feed_id, offset, rows_total, updated_at, last_error)
         VALUES (?, ?, ?, ?, NULL)
         ON CONFLICT(feed_id) DO UPDATE SET
           offset=excluded.offset, rows_total=excluded.rows_total,
           updated_at=excluded.updated_at, last_error=NULL`,
      )
        .bind(feedId, offset, rowsTotal, syncedAt)
        .run();
      queriesUsed += 1;

      if (!hasMore || rows.length < adapter.source.pageSize) {
        await markViolationComplete(env, feedId, rowsTotal, syncedAt);
        queriesUsed += 1;
        return { feed_id: feedId, processed: rows.length, offset, done: true, queriesUsed, rowsWritten };
      }
    }
  } catch (err: any) {
    await env.DB.prepare(
      `INSERT INTO sync_state (feed_id, updated_at, last_error)
       VALUES (?, ?, ?)
       ON CONFLICT(feed_id) DO UPDATE SET
         last_error=excluded.last_error, updated_at=excluded.updated_at`,
    )
      .bind(feedId, syncedAt, String(err?.message || err).slice(0, 500))
      .run()
      .catch(() => {});
    return {
      feed_id: feedId,
      processed: 0,
      offset,
      done: false,
      queriesUsed,
      rowsWritten,
      error: String(err?.message || err),
    };
  }

  return { feed_id: feedId, processed: 0, offset, done: false, queriesUsed, rowsWritten };
}

async function markViolationComplete(
  env: SyncEnv,
  feedId: string,
  rowsTotal: number,
  syncedAt: string,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO sync_state (feed_id, offset, rows_total, updated_at, completed_at, last_error)
     VALUES (?, 0, ?, ?, ?, NULL)
     ON CONFLICT(feed_id) DO UPDATE SET
       completed_at=excluded.completed_at, updated_at=excluded.updated_at,
       rows_total=excluded.rows_total, last_error=NULL`,
  )
    .bind(feedId, rowsTotal, syncedAt, syncedAt)
    .run();
}
