import {
  CANONICAL_COLUMNS,
  CanonicalColumn,
  CanonicalRecord,
  CityAdapter,
} from "./canonical";
import { ADAPTERS, getAdapter } from "./adapters";
import { fetchPage } from "./platforms";
import { toCanonicalRecord } from "./normalize";

/**
 * D1 allows 50 queries per Worker invocation on the free plan. One `batch()`
 * call counts as one query, so the crawl is sized to fit: each invocation
 * applies whole pages, persists its offset, and returns. The next tick resumes.
 */
export const D1_QUERY_BUDGET = 45;

/** Statements per single batch() call. One batch call = one D1 query. */
export const STATEMENTS_PER_BATCH = 250;

export interface SyncState {
  feed_id: string;
  offset: number;
  rows_total: number;
  updated_at: string | null;
  completed_at: string | null;
  last_error: string | null;
}

export interface SyncResult {
  feed_id: string;
  processed: number;
  offset: number;
  done: boolean;
  queriesUsed: number;
  /** D1 rows written as billed (table row + one per index touched). */
  rowsWritten: number;
  error?: string;
}

export interface SyncEnv {
  DB: D1Database;
  /**
   * Optional Socrata app token. Not authentication — it only raises the
   * throttling ceiling. Either a bare token (applied to every Socrata feed) or
   * a JSON object keyed by host, since tokens are registered per portal:
   *   {"data.cityofnewyork.us": "...", "data.seattle.gov": "...", "*": "..."}
   */
  SOCRATA_APP_TOKEN?: string;
}

/** Resolve the Socrata token for a feed's endpoint host. */
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
 * Columns a `registration_contacts` feed cannot source: owner identity lives
 * in a separate contacts dataset (NYC feu5-w2e2) backfilled by
 * scripts/nyc-owner-enrich.py, and link_key derives from that name. These
 * stay in the INSERT (new rows write nulls until the enricher runs) but are
 * excluded from ON CONFLICT updates so every resync does not erase the
 * backfill. Applicant columns are left alone: they are written by source
 * fieldMaps, not offline enrichment.
 */
const ENRICHED_COLUMNS: readonly CanonicalColumn[] = [
  "owner_name",
  "owner_address",
  "owner_city",
  "owner_state",
  "owner_zip",
  "owner_phone",
  "owner_email",
  "link_key",
];

/**
 * Upsert SQL for one adapter. `registration_contacts` adapters exclude the
 * enriched columns from the update list (see ENRICHED_COLUMNS); every other
 * adapter overwrites all non-key columns.
 */
export function upsertSql(adapter: CityAdapter): string {
  const cols = CANONICAL_COLUMNS.join(", ");
  const placeholders = CANONICAL_COLUMNS.map(() => "?").join(", ");
  const preserve = adapter.linker === "registration_contacts";
  const updates = CANONICAL_COLUMNS.filter(
    (c) => c !== "parcel_id" && !(preserve && ENRICHED_COLUMNS.includes(c)),
  )
    .map((c) => `${c}=excluded.${c}`)
    .join(", ");
  // Skip the write entirely when nothing changed. With ~10 indexes a no-op
  // update still bills ~12 written rows, so this is the difference between a
  // free re-sync and a metered one. `IS NOT` is null-safe, so rows predating
  // row_hash write once and then stabilise.
  return `INSERT INTO rental_licenses (${cols}) VALUES (${placeholders})
          ON CONFLICT(parcel_id) DO UPDATE SET ${updates}
          WHERE rental_licenses.row_hash IS NOT excluded.row_hash`;
}

export function bindingsFor(rec: CanonicalRecord): (string | number | null)[] {
  return CANONICAL_COLUMNS.map(
    (c) => rec[c as keyof CanonicalRecord] as string | number | null,
  );
}

export async function loadStates(env: SyncEnv): Promise<Map<string, SyncState>> {
  const res = await env.DB.prepare("SELECT * FROM sync_state").all();
  const map = new Map<string, SyncState>();
  for (const row of (res.results || []) as any[]) {
    map.set(row.feed_id, row as SyncState);
  }
  return map;
}

export async function resetState(env: SyncEnv, feedId: string): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO sync_state (feed_id, offset, rows_total, updated_at, completed_at, last_error)
     VALUES (?, 0, 0, ?, NULL, NULL)
     ON CONFLICT(feed_id) DO UPDATE SET
       offset=0, rows_total=0, completed_at=NULL, last_error=NULL, updated_at=excluded.updated_at`,
  )
    .bind(feedId, now)
    .run();
}

/**
 * Mark every feed stale so the next tick performs a full refresh.
 *
 * Violation feeds (any feed_id that has written to the violations table)
 * and the dual_matches rebuild cursor are exempt: their passes span many
 * days, so resetting them to 0 would freeze the fill frontier at a
 * permanently-rescanned prefix. Completed violation feeds are reset
 * separately by the unified tick so they still get a fresh daily pass.
 */
export async function beginNewCycle(env: SyncEnv): Promise<void> {
  await env.DB.prepare(
    `UPDATE sync_state SET offset=0, completed_at=NULL, last_error=NULL, updated_at=?
     WHERE feed_id <> 'dual_matches'
       AND feed_id NOT IN (SELECT DISTINCT feed_id FROM violations)`,
  )
    .bind(new Date().toISOString())
    .run();
}

/**
 * Drain one feed within a D1 query budget. Applies whole pages only, so the
 * persisted offset can never point mid-page.
 */
export async function syncAdapter(
  env: SyncEnv,
  adapter: CityAdapter,
  opts: { budget?: number; state?: SyncState; reset?: boolean } = {},
): Promise<SyncResult> {
  const budget = opts.budget ?? D1_QUERY_BUDGET;
  const feedId = adapter.feed.id;
  const syncedAt = new Date().toISOString();

  let queriesUsed = 0;
  let rowsWritten = 0;
  let offset = opts.state?.offset ?? 0;
  let rowsTotal = opts.state?.rows_total ?? 0;

  if (opts.reset) {
    await resetState(env, feedId);
    queriesUsed += 1;
    offset = 0;
    rowsTotal = 0;
  }

  const queriesPerPage = Math.ceil(adapter.source.pageSize / STATEMENTS_PER_BATCH);
  const costPerPage = queriesPerPage + 1; // batch calls + state checkpoint
  const upsert = upsertSql(adapter);

  try {
    while (queriesUsed + costPerPage <= budget) {
      const { rows, hasMore } = await fetchPage(
        adapter.source.platform,
        adapter,
        offset,
        { socrataAppToken: socrataTokenFor(env, adapter.source.endpoint) },
      );

      if (rows.length === 0) {
        await markComplete(env, adapter, rowsTotal, syncedAt);
        queriesUsed += 1;
        return { feed_id: feedId, processed: 0, offset, done: true, queriesUsed, rowsWritten };
      }

      // A feed can emit several rows for one parcel (St Paul's C of O has
      // multiple records per PIN). Keying by parcel_id keeps the last
      // occurrence, so the stored row stops flip-flopping between them and the
      // hash guard can actually skip.
      const byParcel = new Map<string, D1PreparedStatement>();
      for (const row of rows) {
        const rec = toCanonicalRecord(adapter, row, syncedAt);
        if (rec) byParcel.set(rec.parcel_id, env.DB.prepare(upsert).bind(...bindingsFor(rec)));
      }
      const statements = Array.from(byParcel.values());

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
        await markComplete(env, adapter, rowsTotal, syncedAt);
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

async function markComplete(
  env: SyncEnv,
  adapter: CityAdapter,
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
    .bind(adapter.feed.id, rowsTotal, syncedAt, syncedAt)
    .run();
}


/**
 * One scheduled tick. Drains every feed that is not yet complete for this
 * cycle, sharing a single D1 query budget so a tick always stays under the
 * platform limit.
 */
export async function runSyncTick(
  env: SyncEnv,
  opts: { budget?: number; reset?: boolean } = {},
): Promise<SyncResult[]> {
  const budget = opts.budget ?? D1_QUERY_BUDGET;
  const states = await loadStates(env);
  let remaining = budget - 1; // account for the loadStates query

  if (opts.reset) {
    await beginNewCycle(env);
    for (const s of states.values()) {
      s.offset = 0;
      s.rows_total = 0;
      s.completed_at = null;
    }
    remaining -= 1;
  }

  const results: SyncResult[] = [];
  for (const adapter of ADAPTERS) {
    const state = states.get(adapter.feed.id);
    if (!opts.reset && state?.completed_at) continue;
    if (remaining <= 2) break;

    const r = await syncAdapter(env, adapter, { budget: remaining, state });
    remaining -= r.queriesUsed;
    results.push(r);
    if (r.error) break;
  }
  return results;
}

export async function syncOne(
  env: SyncEnv,
  feedId: string,
  opts: { budget?: number; reset?: boolean } = {},
): Promise<SyncResult | null> {
  const adapter = getAdapter(feedId);
  if (!adapter) return null;
  const states = await loadStates(env);
  return syncAdapter(env, adapter, {
    budget: opts.budget ?? D1_QUERY_BUDGET,
    state: states.get(feedId),
    reset: opts.reset,
  });
}
