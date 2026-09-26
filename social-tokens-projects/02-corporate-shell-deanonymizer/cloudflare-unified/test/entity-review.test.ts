import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { applyEntityReview } from "../src/housing/entities";

/**
 * applyEntityReview() decides what a human approve/reject does to
 * owner_entities. The bug this covers: approving a single-entity flag
 * (entity_id_b IS NULL) used to close the review row but leave the entity at
 * status 'auto', so /api/entities still showed it unconfirmed.
 */

function makeEnv() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE owner_entities (
      entity_id TEXT PRIMARY KEY,
      display_name TEXT, status TEXT DEFAULT 'auto',
      parcel_count INTEGER DEFAULT 0, jurisdiction_count INTEGER DEFAULT 0,
      updated_at TEXT
    );
    CREATE TABLE owner_entity_links (
      parcel_id TEXT, entity_id TEXT, match_type TEXT, confidence REAL,
      created_at TEXT, PRIMARY KEY (parcel_id, entity_id)
    );
    CREATE TABLE owner_entity_review (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id_a TEXT NOT NULL, entity_id_b TEXT, reason TEXT,
      evidence TEXT, status TEXT DEFAULT 'pending',
      created_at TEXT, reviewed_at TEXT
    );
    CREATE TABLE rental_licenses (parcel_id TEXT PRIMARY KEY, jurisdiction_id TEXT);
  `);
  const prepare = (sql: string) => ({
    bind: (...args: unknown[]) => ({
      first: () => db.prepare(sql).get(...(args as never[])) ?? null,
      all: () => ({ results: db.prepare(sql).all(...(args as never[])) }),
      run: () => db.prepare(sql).run(...(args as never[])),
      _sql: sql,
      _args: args,
    }),
  });
  const env = {
    DB: {
      prepare,
      batch: async (stmts: { _sql: string; _args: unknown[] }[]) =>
        stmts.map((s) => db.prepare(s._sql).run(...(s._args as never[]))),
    },
  };
  return { db, env };
}

describe("applyEntityReview", () => {
  it("approve on a single-entity flag marks the entity confirmed", async () => {
    const { db, env } = makeEnv();
    db.exec(`INSERT INTO owner_entities (entity_id, display_name, status)
             VALUES ('name:x:joe landlord', 'Joe Landlord', 'auto')`);
    db.exec(`INSERT INTO owner_entity_review (entity_id_a, entity_id_b, reason)
             VALUES ('name:x:joe landlord', NULL, 'large_auto_group')`);

    const res = await applyEntityReview(env as never, 1, "approve");
    expect(res.ok).toBe(true);

    const entity = db
      .prepare(`SELECT status FROM owner_entities WHERE entity_id = ?`)
      .get("name:x:joe landlord") as { status: string };
    expect(entity.status).toBe("confirmed");
    const review = db
      .prepare(`SELECT status FROM owner_entity_review WHERE id = 1`)
      .get() as { status: string };
    expect(review.status).toBe("approved");
  });

  it("reject on a single-entity flag leaves the entity untouched", async () => {
    const { db, env } = makeEnv();
    db.exec(`INSERT INTO owner_entities (entity_id, display_name, status)
             VALUES ('name:x:joe landlord', 'Joe Landlord', 'auto')`);
    db.exec(`INSERT INTO owner_entity_review (entity_id_a, entity_id_b, reason)
             VALUES ('name:x:joe landlord', NULL, 'large_auto_group')`);

    const res = await applyEntityReview(env as never, 1, "reject");
    expect(res.ok).toBe(true);

    const entity = db
      .prepare(`SELECT status FROM owner_entities WHERE entity_id = ?`)
      .get("name:x:joe landlord") as { status: string };
    expect(entity.status).toBe("auto");
  });

  it("approve on a pair still merges b into a and confirms a", async () => {
    const { db, env } = makeEnv();
    db.exec(`INSERT INTO owner_entities (entity_id, status) VALUES
             ('name:a:acme', 'auto'), ('name:b:acme corp', 'auto')`);
    db.exec(`INSERT INTO rental_licenses (parcel_id, jurisdiction_id)
             VALUES ('p1', 'a'), ('p2', 'b')`);
    db.exec(`INSERT INTO owner_entity_links (parcel_id, entity_id, match_type)
             VALUES ('p1', 'name:a:acme', 'name'), ('p2', 'name:b:acme corp', 'name')`);
    db.exec(`INSERT INTO owner_entity_review (entity_id_a, entity_id_b, reason)
             VALUES ('name:a:acme', 'name:b:acme corp', 'multi_jurisdiction_name')`);

    const res = await applyEntityReview(env as never, 1, "approve");
    expect(res.ok).toBe(true);

    const rows = db
      .prepare(`SELECT entity_id, status FROM owner_entities ORDER BY entity_id`)
      .all() as { entity_id: string; status: string }[];
    expect(rows).toEqual([
      { entity_id: "name:a:acme", status: "confirmed" },
      { entity_id: "name:b:acme corp", status: "merged" },
    ]);
    const link = db
      .prepare(`SELECT entity_id FROM owner_entity_links WHERE parcel_id = 'p2'`)
      .get() as { entity_id: string };
    expect(link.entity_id).toBe("name:a:acme");
  });

  it("refuses to re-review a closed row", async () => {
    const { db, env } = makeEnv();
    db.exec(`INSERT INTO owner_entity_review
             (entity_id_a, entity_id_b, reason, status)
             VALUES ('name:x:y', NULL, 'large_auto_group', 'rejected')`);
    const res = await applyEntityReview(env as never, 1, "approve");
    expect(res.ok).toBe(false);
  });
});
