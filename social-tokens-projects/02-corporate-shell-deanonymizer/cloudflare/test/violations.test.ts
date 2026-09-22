import { describe, expect, it } from "vitest";
import {
  VIOLATION_ADAPTERS,
  computeViolationHash,
  getViolationAdapter,
  nycViolations,
  toViolationRecord,
} from "../src/violations";

const SYNCED_AT = "2026-09-14T00:00:00.000Z";

function nycRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    violationid: "12345678",
    bbl: "2028100045",
    boroid: "2",
    block: "2810",
    lot: "45",
    class: "C",
    currentstatus: "Open",
    violationstatus: "Open",
    boro: "BRONX",
    novdescription: "No hot water",
    ...overrides,
  };
}

describe("toViolationRecord (NYC HPD)", () => {
  it("maps a full row with the verbatim bbl join key", () => {
    const rec = toViolationRecord(nycViolations, nycRow(), SYNCED_AT)!;
    expect(rec.feed_id).toBe("ny-hpd-violations-open-c");
    expect(rec.violation_id).toBe("12345678");
    expect(rec.join_key).toBe("2028100045");
    expect(rec.violation_class).toBe("C");
    expect(rec.is_open).toBe(1);
    expect(rec.boro).toBe("BRONX");
    expect(rec.source_platform).toBe("socrata");
  });

  it("derives the join key from boroid/block/lot when bbl is null", () => {
    const rec = toViolationRecord(nycViolations, nycRow({ bbl: null }), SYNCED_AT)!;
    expect(rec.join_key).toBe("2028100045");
  });

  it("marks non-open statuses closed", () => {
    const rec = toViolationRecord(nycViolations, nycRow({ violationstatus: "Close" }), SYNCED_AT)!;
    expect(rec.is_open).toBe(0);
  });

  it("returns null only when there is no violation id", () => {
    expect(toViolationRecord(nycViolations, nycRow({ violationid: "" }), SYNCED_AT)).toBe(null);
  });
});

describe("computeViolationHash", () => {
  it("is stable and ignores synced_at", () => {
    const a = toViolationRecord(nycViolations, nycRow(), "2026-01-01T00:00:00Z")!;
    const b = toViolationRecord(nycViolations, nycRow(), "2026-09-14T00:00:00Z")!;
    expect(a.row_hash).toBe(b.row_hash);
    const { row_hash: _h, ...rest } = a;
    expect(computeViolationHash(rest)).toBe(a.row_hash);
  });
});

describe("violation adapter registry", () => {
  it("resolves the NYC adapter by feed id", () => {
    expect(getViolationAdapter("ny-hpd-violations-open-c")).toBe(nycViolations);
    expect(getViolationAdapter("nope")).toBe(undefined);
  });

  it("resolves every enabled adapter by feed id", () => {
    for (const a of VIOLATION_ADAPTERS) {
      expect(getViolationAdapter(a.feed.id)).toBe(a);
      expect(a.violationIdField).toBeTruthy();
    }
  });
});

describe("toViolationRecord (verified Socrata feeds)", () => {
  const seattle = getViolationAdapter("wa-seattle-violations")!;
  const chicago = getViolationAdapter("il-chicago-violations")!;

  it("maps Seattle recordnum/recordtype/statuscurrent", () => {
    const rec = toViolationRecord(seattle, {
      recordnum: "001001-03CP",
      recordtype: "Complaint",
      statuscurrent: "Under Investigation",
      originaladdress1: "1100 2ND AVE",
      description: "Elevator broken",
    }, SYNCED_AT)!;
    expect(rec.violation_id).toBe("001001-03CP");
    expect(rec.violation_class).toBe("Complaint");
    expect(rec.status).toBe("Under Investigation");
    expect(rec.is_open).toBe(1);
    expect(rec.join_key).toBe(null);
    expect(rec.address).toBe("1100 2ND AVE");
  });

  it("treats Seattle terminal and Warning statuses as not open", () => {
    for (const s of ["Completed", "Closed", "Withdrawn", "Reviews Completed", "Warning"]) {
      const rec = toViolationRecord(seattle, {
        recordnum: "x", recordtype: "Complaint", statuscurrent: s,
      }, SYNCED_AT)!;
      expect(rec.is_open, s).toBe(0);
    }
  });

  it("maps Chicago id/violation_code/violation_status", () => {
    const rec = toViolationRecord(chicago, {
      id: "7546762",
      violation_code: "CN138106",
      violation_status: "OPEN",
      violation_description: "STOP/REMOVE NUISANCE",
      address: "7836 S CARPENTER ST",
    }, SYNCED_AT)!;
    expect(rec.violation_id).toBe("7546762");
    expect(rec.violation_class).toBe("CN138106");
    expect(rec.is_open).toBe(1);
    expect(rec.join_key).toBe(null);
    expect(rec.description).toBe("STOP/REMOVE NUISANCE");
  });

  it("treats Chicago COMPLIED and NO ENTRY as not open", () => {
    for (const s of ["COMPLIED", "NO ENTRY"]) {
      const rec = toViolationRecord(chicago, {
        id: "x", violation_status: s,
      }, SYNCED_AT)!;
      expect(rec.is_open, s).toBe(0);
    }
  });
});
