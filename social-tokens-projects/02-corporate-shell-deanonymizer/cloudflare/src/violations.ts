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
  violationIdField: "recordnum",
  classField: "recordtype",
  statusField: "statuscurrent",
  openField: "statuscurrent",
  openValues: ["Awaiting Information", "Citation Issued", "EO Repair Restore Issued", "EO Vacate Close Issued", "Hazard Correction Order Issued", "Initiated", "Issued", "NOV Issued", "Open Duplicate", "Referred to Law", "Reviews In Process", "Stop Work Issued", "Under Investigation"],
  enabled: false,
  note: "Schema verified 2026-09-18 against live data.seattle.gov (recordnum/recordtype/statuscurrent; recordtype in {Complaint, Citation, Notice of Violation, Tenant Relocation, Unfit Building}). Open values are the non-terminal statuscurrent values; terminal: Completed/Closed/Compliance Achieved/Reviews Completed/Application Completed/Withdrawn/Warning. Ready to flip enabled.",
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
  violationIdField: "id",
  classField: "violation_code",
  statusField: "violation_status",
  openField: "violation_status",
  openValues: ["OPEN"],
  addressField: "address",
  descriptionField: "violation_description",
  enabled: false,
  note: "Schema verified 2026-09-18 against live data.cityofchicago.org (id/violation_code/violation_status; status in {OPEN, COMPLIED, NO ENTRY}). No severity-class letter published; violation_code (e.g. CN194039) stored as class. Ready to flip enabled.",
};

export const VIOLATION_ADAPTERS: ViolationAdapter[] = [
  nycViolations,
  seattleViolations,
  chicagoViolations,
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
