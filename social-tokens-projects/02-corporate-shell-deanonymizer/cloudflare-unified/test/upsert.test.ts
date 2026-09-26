import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { bindingsFor, upsertSql } from "../src/housing/sync";
import { toCanonicalRecord } from "../src/housing/normalize";
import { nyc } from "../src/housing/adapters/socrata/nyc";
import { buffalo } from "../src/housing/adapters/socrata/buffalo";
import type { CityAdapter } from "../src/housing/canonical";

/**
 * Durability proof for the NYC owner backfill. nyc-owner-enrich.py writes
 * owner columns and link_key onto ny-hpd-registration rows; before the
 * exclusion in upsertSql(), any source row whose row_hash legitimately
 * changed (status flip, units change) was rewritten with the adapter's null
 * owner fields and link_key. These tests run the exact generated upsert SQL
 * against real SQLite to prove enriched columns survive a resync for
 * registration_contacts feeds — and still update for feeds that publish
 * owner data themselves (name/email linkers).
 */

function makeDb(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE rental_licenses (
      parcel_id TEXT PRIMARY KEY,
      apn TEXT NOT NULL,
      feed_id TEXT NOT NULL,
      jurisdiction_id TEXT NOT NULL,
      city TEXT, county TEXT, state TEXT, address TEXT,
      units INTEGER DEFAULT 1,
      owner_name TEXT, owner_address TEXT, owner_city TEXT,
      owner_state TEXT, owner_zip TEXT, owner_phone TEXT, owner_email TEXT,
      applicant_name TEXT, applicant_phone TEXT, applicant_email TEXT,
      severity_class TEXT, tier TEXT, status TEXT,
      source_platform TEXT, source_dataset TEXT,
      link_key TEXT, synced_at TEXT, row_hash TEXT
    );
  `);
  return db;
}

type Row = Record<string, string | number | bigint | null>;

const T0 = "2026-09-20T00:00:00.000Z";
const T1 = "2026-09-26T00:00:00.000Z";

const NYC_ROW = {
  registrationid: "124732",
  boroid: "1",
  block: "1234",
  lot: "56",
  housenumber: "10",
  streetname: "MAIN ST",
  boro: "MANHATTAN",
};

function upsertRow(
  db: DatabaseSync,
  adapter: CityAdapter,
  row: Record<string, unknown>,
  at: string,
): void {
  const rec = toCanonicalRecord(adapter, row, at);
  if (!rec) throw new Error("row did not map to a canonical record");
  db.prepare(upsertSql(adapter)).run(...bindingsFor(rec));
}

function getRow(db: DatabaseSync): Row {
  const row = db.prepare("SELECT * FROM rental_licenses").get() as
    | Row
    | undefined;
  if (!row) throw new Error("no rental_licenses row");
  return row;
}

function enrich(db: DatabaseSync, parcelId: string): void {
  // Mirrors the nyc_owner_map UPDATE in scripts/nyc-owner-enrich.py.
  db.prepare(
    `UPDATE rental_licenses SET
       owner_name='ACME HOLDINGS LLC', owner_address='346 3 59TH ST',
       owner_city='NEW YORK', owner_state='NY', owner_zip='10022',
       link_key='name:new-york-ny:acme holdings llc'
     WHERE parcel_id = ?`,
  ).run(parcelId);
}

describe("rental_licenses upsert durability", () => {
  it("inserts a blank NYC row with null link_key (enrich fills it later)", () => {
    const db = makeDb();
    upsertRow(db, nyc, NYC_ROW, T0);
    const row = getRow(db);
    expect(row.apn).toBe("1012340056");
    expect(row.owner_name).toBe("");
    expect(row.link_key).toBeNull();
  });

  it("keeps enriched owner_* and link_key when the source row changes", () => {
    const db = makeDb();
    upsertRow(db, nyc, NYC_ROW, T0);
    const pid = String(getRow(db).parcel_id);
    enrich(db, pid);

    // Resync: registration now reports an end date -> status flips,
    // row_hash changes, the UPDATE fires. Pre-fix this nulled owner/link_key.
    upsertRow(db, nyc, { ...NYC_ROW, registrationenddate: "2030-01-01" }, T1);

    const row = getRow(db);
    expect(row.status).toBe("2030-01-01"); // source field still updates
    expect(row.synced_at).toBe(T1); // volatile cols still update
    expect(row.owner_name).toBe("ACME HOLDINGS LLC"); // enrichment survives
    expect(row.owner_address).toBe("346 3 59TH ST");
    expect(row.link_key).toBe("name:new-york-ny:acme holdings llc");
  });

  it("skips the write entirely when the source row is unchanged", () => {
    const db = makeDb();
    upsertRow(db, nyc, NYC_ROW, T0);
    upsertRow(db, nyc, NYC_ROW, T1); // same content, new synced_at
    const row = getRow(db);
    expect(row.synced_at).toBe(T0); // row_hash guard: no rewrite
  });

  it("still overwrites owner columns for feeds that publish them (buffalo)", () => {
    const db = makeDb();
    const row0 = {
      prclid: "P-1",
      address: "1 EXAMPLE ST",
      city: "Buffalo",
      state: "NY",
      businessname: "ACME CORP",
      licstatus: "Active",
    };
    upsertRow(db, buffalo, row0, T0);
    const pid = String(getRow(db).parcel_id);
    enrich(db, pid);

    upsertRow(db, buffalo, { ...row0, licstatus: "Expired" }, T1);

    const row = getRow(db);
    expect(row.status).toBe("Expired");
    // name-linker feeds own these columns: the source's blank owner_name wins.
    expect(row.owner_name).toBe("");
    expect(row.link_key).toBe("name:buffalo-ny:acme corp");
  });
});
