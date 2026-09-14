import { describe, expect, it } from "vitest";
import { minneapolis } from "../src/adapters/arcgis/minneapolis";
import { computeRowHash, toCanonicalRecord } from "../src/normalize";

const SYNCED_AT = "2026-09-14T00:00:00.000Z";

function mplsRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    apn: "12345",
    address: "1420 11th Ave S",
    licensedUnits: "24",
    ownerName: "Vance Holdings LLC",
    ownerAddress1: "PO Box 100",
    ownerCity: "Minneapolis",
    ownerState: "MN",
    ownerZip: "55401",
    ownerPhone: "612-555-0100",
    ownerEmail: "",
    applicantName: "Marcus Vance",
    applicantPhone: "",
    applicantEmail: "mgmt@example.com",
    tier: "Tier 3",
    status: "Active",
    ...overrides,
  };
}

describe("computeRowHash", () => {
  it("is deterministic for the same record", () => {
    const rec = toCanonicalRecord(minneapolis, mplsRow(), SYNCED_AT)!;
    const { row_hash: _a, ...rest } = rec;
    expect(computeRowHash(rest)).toBe(rec.row_hash);
    expect(computeRowHash(rest)).toBe(computeRowHash({ ...rest }));
  });

  it("ignores the volatile synced_at column", () => {
    const a = toCanonicalRecord(minneapolis, mplsRow(), "2026-01-01T00:00:00Z")!;
    const b = toCanonicalRecord(minneapolis, mplsRow(), "2026-09-14T00:00:00Z")!;
    expect(a.row_hash).toBe(b.row_hash);
  });

  it("changes when content changes", () => {
    const a = toCanonicalRecord(minneapolis, mplsRow(), SYNCED_AT)!;
    const b = toCanonicalRecord(minneapolis, mplsRow({ licensedUnits: "25" }), SYNCED_AT)!;
    expect(a.row_hash).not.toBe(b.row_hash);
  });
});

describe("toCanonicalRecord (Minneapolis ArcGIS)", () => {
  it("maps a full row onto the canonical record", () => {
    const rec = toCanonicalRecord(minneapolis, mplsRow(), SYNCED_AT)!;
    expect(rec.parcel_id).toBe("MN:HENNEPIN:12345");
    expect(rec.feed_id).toBe("mn-hennepin-rental-licenses");
    expect(rec.jurisdiction_id).toBe("minneapolis-mn");
    expect(rec.city).toBe("Minneapolis");
    expect(rec.units).toBe(24);
    expect(rec.severity_class).toBe("C");
    expect(rec.tier).toBe("Tier 3");
    expect(rec.link_key).toBe("email:mgmt@example.com");
    expect(rec.source_platform).toBe("arcgis");
    expect(rec.synced_at).toBe(SYNCED_AT);
  });

  it("falls back to feed defaults when the source omits location", () => {
    const rec = toCanonicalRecord(minneapolis, mplsRow(), SYNCED_AT)!;
    // Minneapolis layer carries no city field; defaults apply.
    expect(rec.city).toBe("Minneapolis");
    expect(rec.county).toBe("Hennepin");
    expect(rec.state).toBe("MN");
  });

  it("returns null only when there is no parcel id", () => {
    expect(toCanonicalRecord(minneapolis, mplsRow({ apn: "" }), SYNCED_AT)).toBe(null);
    expect(toCanonicalRecord(minneapolis, mplsRow({ apn: "   " }), SYNCED_AT)).toBe(null);
  });

  it("defaults units to 1 on garbage input and status to Active", () => {
    const rec = toCanonicalRecord(
      minneapolis,
      mplsRow({ licensedUnits: "n/a", status: "" }),
      SYNCED_AT,
    )!;
    expect(rec.units).toBe(1);
    expect(rec.status).toBe("Active");
  });

  it("maps unmapped severity labels to null but keeps the raw tier", () => {
    const rec = toCanonicalRecord(minneapolis, mplsRow({ tier: "Tier 9" }), SYNCED_AT)!;
    expect(rec.severity_class).toBe(null);
    expect(rec.tier).toBe("Tier 9");
  });

  it("derives the NYC parcel key from boroid/block/lot", async () => {
    const { nyc } = await import("../src/adapters/socrata/nyc");
    const rec = toCanonicalRecord(
      nyc,
      { boroid: "2", block: "2810", lot: "45", housenumber: "123", streetname: "Main St" },
      SYNCED_AT,
    )!;
    expect(rec.apn).toBe("2028100045");
    expect(rec.address).toBe("123 Main St");
    const partial = toCanonicalRecord(
      nyc,
      { boroid: "1", block: "100", lot: "1", streetname: "Broadway" },
      SYNCED_AT,
    )!;
    expect(partial.address).toBe("Broadway");
    // registration_contacts linker: link_key stays null by design.
    expect(rec.link_key).toBe(null);
  });
});
