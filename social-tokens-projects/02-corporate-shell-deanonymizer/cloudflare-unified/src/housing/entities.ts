import {
  normalizeEntityName,
  isNonEntityName,
} from "./canonical";
import { SyncEnv, SyncState, STATEMENTS_PER_BATCH } from "./sync";

/**
 * Entity resolution: collapse rental_licenses rows into canonical owner
 * entities with per-link provenance, plus a human review queue for
 * merges that need judgment (cross-jurisdiction matches).
 *
 * Production schema (already deployed + populated):
 *   owner_entities       one row per signal key:
 *                          email:<email>                exact contact
 *                          domain:<domain>              shared email domain
 *                          name:<jurisdiction>:<name>   normalized owner name
 *   owner_entity_links   (parcel_id, entity_id, match_type, confidence)
 *                        match_type: email_exact | email_domain | name | manual
 *   owner_entity_review  (entity_id_a, entity_id_b, reason, evidence, status)
 *                        reasons: cross_jurisdiction_name_domain |
 *                                 multi_jurisdiction_name | large_auto_group
 *
 * The Weidner case — MN via email, WA via contact name — resolves when the
 * shared domain/name surfaces a review item; a reviewer approves the merge
 * via POST /api/entity-review.
 *
 * Rebuild is chunked over rental_licenses with progress in sync_state
 * (feed_id = 'entity_resolution'), same resume pattern as dual_matches.
 */

export const ENTITY_FEED = "entity_resolution";

/** Match confidence by signal strength (matches production values). */
const CONFIDENCE = { email_exact: 1.0, email_domain: 0.9, name: 0.85 } as const;

/** Entities at or above this many parcels get a large_auto_group review row. */
const LARGE_GROUP_PARCELS = 50;

/**
 * Consumer mail providers: a shared gmail/yahoo domain is not an entity
 * signal (it fused 8k unrelated parcels into one fake syndicate). Exact
 * emails still link; only the domain rollup is skipped.
 */
const FREEMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "rocketmail.com",
  "hotmail.com", "outlook.com", "live.com", "msn.com", "me.com", "mac.com",
  "icloud.com", "aol.com", "comcast.net", "verizon.net", "att.net",
  "sbcglobal.net", "earthlink.net", "charter.net", "mail.com",
  "protonmail.com", "proton.me", "gmx.com", "gmx.de", "web.de", "mail.ru",
  "yandex.com", "live.fr", "orange.fr", "free.fr", "sfr.fr", "wanadoo.fr",
  "laposte.net",
]);

function normEmail(v: unknown): string {
  // Cells sometimes carry extra text after the address ("a@b.com; notes").
  const s = String(v ?? "")
    .trim()
    .toLowerCase()
    .split(/[;,\s]/)[0];
  return s.includes("@") && s.includes(".") && s.length >= 5 ? s : "";
}

const COMPANY_RE =
  /\b(llc|inc|corp|corporation|l\.?p\.?|ltd|llp|holdings|properties|ventures|partners|trust|management|mgmt|investments|realty|enterprises|company|group|homes|apartments)\b/i;

function entityKind(display: string): string {
  if (!display) return "unknown";
  if (COMPANY_RE.test(display)) return "company";
  const tokens = display.trim().split(/\s+/);
  if (tokens.length >= 2 && tokens.length <= 4 && /^[a-z',.-]+$/i.test(display))
    return "person";
  return "unknown";
}

export interface EntityLink {
  entity_id: string;
  match_type: "email_exact" | "email_domain" | "name";
}

/**
 * All entity links one license row produces. A row may emit several —
 * e.g. an exact-email entity plus its domain entity plus a name entity —
 * and every link is recorded so clusters stay complete per signal.
 */
export function entityLinksFor(row: Record<string, unknown>): EntityLink[] {
  const jur = String(row.jurisdiction_id ?? "");
  const out: EntityLink[] = [];

  const email = normEmail(row.applicant_email) || normEmail(row.owner_email);
  if (email) {
    out.push({ entity_id: `email:${email}`, match_type: "email_exact" });
    const domain = email.split("@")[1] || "";
    if (domain && !FREEMAIL_DOMAINS.has(domain)) {
      out.push({ entity_id: `domain:${domain}`, match_type: "email_domain" });
    }
  }

  const rawName = String(row.owner_name ?? "") || String(row.applicant_name ?? "");
  const name = normalizeEntityName(rawName);
  if (name && name.length >= 3 && !isNonEntityName(name))
    out.push({ entity_id: `name:${jur}:${name}`, match_type: "name" });

  return out;
}

interface EntityUpsert {
  entity_id: string;
  display_name: string;
  normalized_name: string;
  entity_kind: string;
  email_domain: string | null;
}

function upsertFor(
  link: EntityLink,
  display: string,
  name: string,
): EntityUpsert {
  const kind = entityKind(display || name);
  if (link.match_type === "email_exact") {
    const email = link.entity_id.slice("email:".length);
    return {
      entity_id: link.entity_id,
      display_name: display || email,
      normalized_name: name || email,
      entity_kind: kind,
      email_domain: email.split("@")[1] || null,
    };
  }
  if (link.match_type === "email_domain") {
    const domain = link.entity_id.slice("domain:".length);
    return {
      entity_id: link.entity_id,
      display_name: display || domain,
      normalized_name: name || domain,
      entity_kind: kind,
      email_domain: domain,
    };
  }
  return {
    entity_id: link.entity_id,
    display_name: display || name,
    normalized_name: name,
    entity_kind: kind,
    email_domain: null,
  };
}

/**
 * Rebuild entity tables one chunk of rental_licenses at a time.
 * Returns {done, processed, total, queriesUsed}; resumes via sync_state.
 * On pass completion: recomputes counts/jurisdiction spread/provenance and
 * enqueues review items (cross-jurisdiction merges, oversized auto groups).
 */
export async function rebuildEntities(
  env: SyncEnv,
  maxRows = 800,
): Promise<{ done: boolean; processed: number; total: number; queriesUsed: number }> {
  const now = new Date().toISOString();
  let queriesUsed = 0;

  const state = await env.DB.prepare(
    `SELECT * FROM sync_state WHERE feed_id = ?`,
  )
    .bind(ENTITY_FEED)
    .first<SyncState & { started_at: string | null }>();
  queriesUsed += 1;
  const offset: number = state?.offset ?? 0;
  const cycleStart: string = state?.started_at ?? now;

  const totalRes = await env.DB.prepare(
    `SELECT COUNT(*) as n FROM rental_licenses`,
  ).first<any>();
  queriesUsed += 1;
  const total: number = totalRes?.n ?? 0;

  const chunk = await env.DB.prepare(
    `SELECT parcel_id, jurisdiction_id, owner_name, owner_email,
            applicant_name, applicant_email
     FROM rental_licenses ORDER BY parcel_id LIMIT ? OFFSET ?`,
  )
    .bind(maxRows, offset)
    .all();
  queriesUsed += 1;
  const rows = (chunk.results || []) as any[];

  const linkInserts: D1PreparedStatement[] = [];
  const linkEntityIds: string[] = []; // entity_id per link insert, same order
  const entities = new Map<string, EntityUpsert>();

  for (const row of rows) {
    const links = entityLinksFor(row);
    if (!links.length) continue;
    const display = String(row.owner_name ?? "") || String(row.applicant_name ?? "");
    const name = normalizeEntityName(display);

    for (const link of links) {
      if (!entities.has(link.entity_id)) {
        entities.set(link.entity_id, upsertFor(link, display, name));
      }
      linkEntityIds.push(link.entity_id);
      linkInserts.push(
        env.DB.prepare(
          `INSERT OR IGNORE INTO owner_entity_links
           (parcel_id, entity_id, match_type, confidence, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        ).bind(
          row.parcel_id,
          link.entity_id,
          link.match_type,
          CONFIDENCE[link.match_type],
          now,
        ),
      );
    }
  }

  // Links first — batch() returns per-statement meta.changes so
  // parcel_count only increments for genuinely new links.
  const newCounts = new Map<string, number>();
  for (let i = 0; i < linkInserts.length; i += STATEMENTS_PER_BATCH) {
    const results = await env.DB.batch(
      linkInserts.slice(i, i + STATEMENTS_PER_BATCH),
    );
    queriesUsed += 1;
    (results as any[]).forEach((r, j) => {
      if ((r?.meta?.changes ?? 0) > 0) {
        const eid = linkEntityIds[i + j];
        newCounts.set(eid, (newCounts.get(eid) ?? 0) + 1);
      }
    });
  }

  const entityUpserts: D1PreparedStatement[] = [];
  for (const e of entities.values()) {
    const delta = newCounts.get(e.entity_id) ?? 0;
    entityUpserts.push(
      env.DB.prepare(
        `INSERT INTO owner_entities
         (entity_id, display_name, normalized_name, entity_kind, email_domain,
          parcel_count, provenance, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, '{}', 'auto', ?, ?)
         ON CONFLICT(entity_id) DO UPDATE SET
           parcel_count = owner_entities.parcel_count + excluded.parcel_count,
           display_name = CASE WHEN owner_entities.display_name IS NULL OR owner_entities.display_name = ''
                           THEN excluded.display_name ELSE owner_entities.display_name END,
           entity_kind = CASE WHEN owner_entities.entity_kind = 'unknown' AND excluded.entity_kind != 'unknown'
                          THEN excluded.entity_kind ELSE owner_entities.entity_kind END,
           updated_at = excluded.updated_at`,
      ).bind(
        e.entity_id,
        e.display_name,
        e.normalized_name,
        e.entity_kind,
        e.email_domain,
        delta,
        now,
        now,
      ),
    );
  }
  for (let i = 0; i < entityUpserts.length; i += STATEMENTS_PER_BATCH) {
    await env.DB.batch(entityUpserts.slice(i, i + STATEMENTS_PER_BATCH));
    queriesUsed += 1;
  }

  const processed = offset + rows.length;
  const done = rows.length === 0 || processed >= total;
  await env.DB.prepare(
    `INSERT INTO sync_state (feed_id, offset, rows_total, started_at, updated_at, completed_at, last_error)
     VALUES (?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(feed_id) DO UPDATE SET
       offset = excluded.offset,
       rows_total = excluded.rows_total,
       started_at = CASE WHEN excluded.offset = 0 THEN excluded.started_at ELSE sync_state.started_at END,
       updated_at = excluded.updated_at,
       completed_at = excluded.completed_at`,
  )
    .bind(ENTITY_FEED, done ? 0 : processed, total, offset === 0 ? now : cycleStart, now, done ? now : null)
    .run();
  queriesUsed += 1;

  if (done) await finalizeEntities(env, cycleStart, now);
  return { done, processed, total, queriesUsed };
}

/**
 * End-of-pass work: recompute per-entity stats from links, enqueue review
 * items, and drop rows the last cycle left behind.
 */
async function finalizeEntities(
  env: SyncEnv,
  cycleStart: string,
  now: string,
): Promise<void> {
  try {
    // Retire links not re-written this pass: decrement counts first, then
    // delete the stale links and any entity left empty.
    await env.DB.prepare(
      `UPDATE owner_entities SET parcel_count = parcel_count - (
         SELECT COUNT(*) FROM owner_entity_links l
         WHERE l.entity_id = owner_entities.entity_id AND l.created_at < ?1
       ) WHERE EXISTS (
         SELECT 1 FROM owner_entity_links l
         WHERE l.entity_id = owner_entities.entity_id AND l.created_at < ?1
       )`,
    ).bind(cycleStart).run();
    await env.DB.prepare(
      `DELETE FROM owner_entity_links WHERE created_at < ?`,
    ).bind(cycleStart).run();

    // Jurisdiction spread requires the join back to rental_licenses.
    await env.DB.prepare(
      `UPDATE owner_entities SET jurisdiction_count = (
         SELECT COUNT(DISTINCT r.jurisdiction_id)
         FROM owner_entity_links l
         JOIN rental_licenses r ON r.parcel_id = l.parcel_id
         WHERE l.entity_id = owner_entities.entity_id
       )`,
    ).run();

    // provenance = which signals formed the entity + source tables.
    await env.DB.prepare(
      `UPDATE owner_entities SET provenance = (
         SELECT json_object(
           'signals', json_group_array(DISTINCT l.match_type),
           'sources', json_array('rental_licenses')
         )
         FROM owner_entity_links l
         WHERE l.entity_id = owner_entities.entity_id
       ) WHERE EXISTS (
         SELECT 1 FROM owner_entity_links l
         WHERE l.entity_id = owner_entities.entity_id
       )`,
    ).run();

    // Review: same normalized name in multiple jurisdictions.
    await env.DB.prepare(
      `INSERT INTO owner_entity_review (entity_id_a, entity_id_b, reason, evidence, status, created_at)
       SELECT a.entity_id, b.entity_id, 'multi_jurisdiction_name',
              json_object('name', a.normalized_name,
                          'jurisdiction_a', ja.jur,
                          'jurisdiction_b', jb.jur,
                          'parcels_a', a.parcel_count,
                          'parcels_b', b.parcel_count),
              'pending', ?1
       FROM owner_entities a
       JOIN owner_entities b
         ON b.entity_id > a.entity_id
        AND b.normalized_name = a.normalized_name
       JOIN (SELECT entity_id, MIN(r.jurisdiction_id) AS jur
             FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id
             GROUP BY entity_id) ja ON ja.entity_id = a.entity_id
       JOIN (SELECT entity_id, MIN(r.jurisdiction_id) AS jur
             FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id
             GROUP BY entity_id) jb ON jb.entity_id = b.entity_id
       WHERE a.entity_id LIKE 'name:%' AND b.entity_id LIKE 'name:%'
         AND ja.jur != jb.jur
         AND NOT EXISTS (
           SELECT 1 FROM owner_entity_review r
           WHERE r.entity_id_a = a.entity_id AND r.entity_id_b = b.entity_id
         )
       LIMIT 500`,
    ).bind(now).run();

    // Review: an email-domain entity whose domain label appears inside a
    // name entity from a different jurisdiction (the Weidner pattern).
    await env.DB.prepare(
      `INSERT INTO owner_entity_review (entity_id_a, entity_id_b, reason, evidence, status, created_at)
       SELECT d.entity_id, n.entity_id, 'cross_jurisdiction_name_domain',
              json_object('domain', d.email_domain,
                          'domain_label', substr(d.email_domain, 1, instr(d.email_domain, '.') - 1),
                          'name', n.display_name,
                          'name_jurisdiction', substr(n.entity_id, 6, instr(substr(n.entity_id, 6), ':') - 1),
                          'domain_parcels', d.parcel_count,
                          'name_parcels', n.parcel_count),
              'pending', ?1
       FROM owner_entities d
       JOIN owner_entities n
         ON n.entity_id LIKE 'name:%'
        AND (' ' || n.normalized_name || ' ') LIKE
            '% ' || substr(d.email_domain, 1, instr(d.email_domain, '.') - 1) || ' %'
       WHERE d.entity_id LIKE 'domain:%'
         AND d.email_domain IS NOT NULL
         AND d.email_domain NOT IN (${[...FREEMAIL_DOMAINS].map((d) => `'${d}'`).join(",")})
         AND instr(d.email_domain, '.') > 1
         AND length(substr(d.email_domain, 1, instr(d.email_domain, '.') - 1)) >= 4
         AND substr(n.entity_id, 6, instr(substr(n.entity_id, 6), ':') - 1) NOT IN (
           SELECT r.jurisdiction_id FROM owner_entity_links l
           JOIN rental_licenses r ON r.parcel_id = l.parcel_id
           WHERE l.entity_id = d.entity_id
         )
         AND NOT EXISTS (
           SELECT 1 FROM owner_entity_review r
           WHERE r.entity_id_a = d.entity_id AND r.entity_id_b = n.entity_id
         )
       LIMIT 500`,
    ).bind(now).run();

    // Review: oversized auto clusters (shared freemail domains etc).
    await env.DB.prepare(
      `INSERT INTO owner_entity_review (entity_id_a, entity_id_b, reason, evidence, status, created_at)
       SELECT entity_id, NULL, 'large_auto_group',
              json_object('parcel_count', parcel_count,
                          'jurisdiction_count', jurisdiction_count,
                          'display_name', display_name),
              'pending', ?1
       FROM owner_entities
       WHERE parcel_count >= ?2 AND status = 'auto'
         AND NOT EXISTS (
           SELECT 1 FROM owner_entity_review r
           WHERE r.entity_id_a = owner_entities.entity_id
             AND r.reason = 'large_auto_group'
         )`,
    ).bind(now, LARGE_GROUP_PARCELS).run();

    await env.DB.prepare(
      `DELETE FROM owner_entities
       WHERE (updated_at IS NOT NULL AND updated_at < ?)
          OR parcel_count <= 0`,
    ).bind(cycleStart).run();
    await env.DB.prepare(
      `INSERT INTO sync_logs (source, cases_synced, status, details) VALUES ('entity-resolution', ?, 'SUCCESS', ?)`,
    ).bind(0, "entity rebuild pass complete").run();
  } catch (err) {
    console.error("entity finalize failed", err);
  }
}

/**
 * Apply a review decision. Approving a pair merges b into a: links re-point,
 * counts recombine, b is marked 'merged'. Approving a single-entity flag
 * (entity_id_b IS NULL) marks the entity 'confirmed'; rejecting only closes
 * the review row.
 */
export async function applyEntityReview(
  env: SyncEnv,
  reviewId: number,
  action: "approve" | "reject",
): Promise<{ ok: boolean; error?: string }> {
  const review = await env.DB.prepare(
    `SELECT * FROM owner_entity_review WHERE id = ?`,
  ).bind(reviewId).first<any>();
  if (!review) return { ok: false, error: "review not found" };
  if (review.status !== "pending") return { ok: false, error: "already reviewed" };

  const now = new Date().toISOString();
  const status = action === "approve" ? "approved" : "rejected";
  const stmts: D1PreparedStatement[] = [
    env.DB.prepare(
      `UPDATE owner_entity_review SET status = ?, reviewed_at = ? WHERE id = ?`,
    ).bind(status, now, reviewId),
  ];

  if (action === "approve" && review.entity_id_b) {
    // Re-point b's links to a (ignore dupes), then retire b.
    stmts.push(
      env.DB.prepare(
        `UPDATE OR IGNORE owner_entity_links SET entity_id = ?
         WHERE entity_id = ?`,
      ).bind(review.entity_id_a, review.entity_id_b),
    );
    stmts.push(
      env.DB.prepare(
        `DELETE FROM owner_entity_links WHERE entity_id = ?`,
      ).bind(review.entity_id_b),
    );
    stmts.push(
      env.DB.prepare(
        `UPDATE owner_entities SET
           parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = ?1),
           jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id)
             FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id
             WHERE l.entity_id = ?1),
           status = 'confirmed', updated_at = ?2
         WHERE entity_id = ?1`,
      ).bind(review.entity_id_a, now),
    );
    stmts.push(
      env.DB.prepare(
        `UPDATE owner_entities SET status = 'merged', updated_at = ?
         WHERE entity_id = ?`,
      ).bind(now, review.entity_id_b),
    );
  } else if (action === "approve") {
    // Single-entity flag approved by a human: the group is real.
    stmts.push(
      env.DB.prepare(
        `UPDATE owner_entities SET status = 'confirmed', updated_at = ?
         WHERE entity_id = ?`,
      ).bind(now, review.entity_id_a),
    );
  }

  await env.DB.batch(stmts);
  return { ok: true };
}
