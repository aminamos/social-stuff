import { describe, expect, it } from "vitest";
import {
  VIOLATION_ADAPTERS,
  getViolationAdapter,
  nycViolations,
  toViolationRecord,
} from "../src/housing/violations";
import { entityLinksFor } from "../src/housing/entities";

const SYNCED_AT = "2026-09-14T00:00:00.000Z";

describe("violation adapter registry", () => {
  it("resolves every declared adapter by feed id", () => {
    for (const a of VIOLATION_ADAPTERS) {
      expect(getViolationAdapter(a.feed.id)).toBe(a);
      expect(a.violationIdField).toBeTruthy();
    }
  });

  it("keeps NYC at full-open scope (all classes)", () => {
    expect(nycViolations.source.where).toBe("violationstatus='Open'");
    expect(nycViolations.source.where).not.toContain("class=");
    expect(nycViolations.openValues).toEqual(["Open"]);
    expect(nycViolations.enabled).toBe(true);
  });

  it("maps NYC rows with verbatim bbl join key", () => {
    const rec = toViolationRecord(
      nycViolations,
      {
        violationid: "V-1",
        bbl: "1012340056",
        class: "B",
        currentstatus: "Violation Open",
        violationstatus: "Open",
        boro: "MANHATTAN",
        novdescription: "leaking faucet",
      },
      SYNCED_AT,
    );
    expect(rec?.violation_id).toBe("V-1");
    expect(rec?.join_key).toBe("1012340056");
    expect(rec?.is_open).toBe(1);
    expect(rec?.violation_class).toBe("B");
  });

  it("maps Seattle rows via verified ez4a-iug7 fields", () => {
    const sea = getViolationAdapter("wa-seattle-violations");
    expect(sea).toBeDefined();
    expect(sea!.enabled).toBe(true);
    const open = toViolationRecord(
      sea!,
      {
        recordnum: "001001-03CP",
        recordtype: "C",
        statuscurrent: "Under Investigation",
        originaladdress1: "1234 PINE ST",
      },
      SYNCED_AT,
    );
    expect(open?.violation_id).toBe("001001-03CP");
    expect(open?.is_open).toBe(1);
    // recordnum doesn't match registry permitnum — no parcel join.
    expect(open?.join_key).toBeNull();
    const closed = toViolationRecord(
      sea!,
      {
        recordnum: "001002-03CP",
        recordtype: "C",
        statuscurrent: "Completed",
        originaladdress1: "1234 PINE ST",
      },
      SYNCED_AT,
    );
    expect(closed?.is_open).toBe(0);
  });

  it("maps Chicago rows via verified 22u3-xenr fields", () => {
    const chi = getViolationAdapter("il-chicago-violations");
    expect(chi).toBeDefined();
    expect(chi!.enabled).toBe(true);
    const open = toViolationRecord(
      chi!,
      {
        id: "12345678",
        violation_code: "NC2011",
        violation_status: "OPEN",
        violation_description: "FAILURE TO MAINTAIN EXTERIOR",
        address: "1234 S STATE ST",
      },
      SYNCED_AT,
    );
    expect(open?.violation_id).toBe("12345678");
    expect(open?.is_open).toBe(1);
    for (const status of ["COMPLIED", "NO ENTRY"]) {
      const rec = toViolationRecord(
        chi!,
        { id: `x-${status}`, violation_status: status },
        SYNCED_AT,
      );
      expect(rec?.is_open).toBe(0);
    }
  });
});

describe("entityLinksFor", () => {
  it("emits email_exact + email_domain + name links for a full row", () => {
    const links = entityLinksFor({
      jurisdiction_id: "minneapolis-mn",
      owner_name: "WEIDNER APARTMENT HOMES LLC",
      applicant_email: "Info@Weidner.com",
    });
    const ids = links.map((l) => l.entity_id);
    expect(ids).toContain("email:info@weidner.com");
    expect(ids).toContain("domain:weidner.com");
    expect(ids).toContain("name:minneapolis-mn:weidner apartment homes llc");
  });

  it("scopes name entities by jurisdiction (cross-city stays unmerged)", () => {
    const mn = entityLinksFor({
      jurisdiction_id: "minneapolis-mn",
      owner_name: "Summit Realty LLC",
    });
    const wa = entityLinksFor({
      jurisdiction_id: "seattle-wa",
      owner_name: "Summit Realty LLC",
    });
    expect(mn[0].entity_id).not.toBe(wa[0].entity_id);
    expect(mn[0].entity_id).toContain("minneapolis-mn");
    expect(wa[0].entity_id).toContain("seattle-wa");
  });

  it("skips placeholder/non-entity names", () => {
    for (const name of ["unknown", "owner", "same as owner", "see above", "management"]) {
      const links = entityLinksFor({ jurisdiction_id: "x", owner_name: name });
      expect(links.filter((l) => l.match_type === "name")).toHaveLength(0);
    }
  });

  it("produces no links for a row with no signals", () => {
    expect(
      entityLinksFor({ jurisdiction_id: "x", owner_name: "" }),
    ).toHaveLength(0);
  });
});
