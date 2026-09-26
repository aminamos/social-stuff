import { describe, expect, it } from "vitest";
import { normalizeEntityName, isNonEntityName, linkKey } from "../src/housing/canonical";
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

  it("takes the first email of a ';'-joined cell (no fused entity)", () => {
    const links = entityLinksFor({
      jurisdiction_id: "minneapolis-mn",
      applicant_email: "Minnesota@RentPure.com; mmohanlall@rentpure.com",
    });
    const ids = links.map((l) => l.entity_id);
    expect(ids).toContain("email:minnesota@rentpure.com");
    expect(ids.some((id) => id.includes(";"))).toBe(false);
    expect(ids).not.toContain("email:mmohanlall@rentpure.com");
  });

  it("keeps LAST, FIRST instead of collapsing to a surname bucket", () => {
    const links = entityLinksFor({
      jurisdiction_id: "nashville-tn",
      owner_name: "SMITH, GLENN C. ET UX",
    });
    const ids = links.map((l) => l.entity_id);
    expect(ids).toContain("name:nashville-tn:smith glenn c");
    expect(ids).not.toContain("name:nashville-tn:smith");
  });

  it("does not link 'unknown <city> landlord' placeholders", () => {
    const links = entityLinksFor({
      jurisdiction_id: "saint-paul-mn",
      owner_name: "Unknown St. Paul Landlord",
    });
    expect(links.filter((l) => l.match_type === "name")).toHaveLength(0);
  });

  it("produces no links for a row with no signals", () => {
    expect(
      entityLinksFor({ jurisdiction_id: "x", owner_name: "" }),
    ).toHaveLength(0);
  });
});

describe("normalizeEntityName", () => {
  it("expands LAST, FIRST names and drops ET UX/ET VIR/ET AL markers", () => {
    expect(normalizeEntityName("SMITH, GLENN C. ET UX")).toBe("smith glenn c");
    expect(normalizeEntityName("JONES, PAULA F. & JOHN T.")).toBe(
      "jones paula f john t",
    );
    expect(normalizeEntityName("DOE, JOHN ET VIR")).toBe("doe john");
    expect(normalizeEntityName("ROE, JANE ET AL")).toBe("roe jane");
  });

  it("still takes the first segment for multi-token and repeated names", () => {
    expect(normalizeEntityName("ACME PROPERTIES LLC; ACME PROPERTIES LLC")).toBe(
      "acme properties llc",
    );
    expect(normalizeEntityName("SMITH, SMITH")).toBe("smith");
    expect(normalizeEntityName("JOHN SMITH")).toBe("john smith");
  });
});

describe("isNonEntityName", () => {
  it("flags 'unknown ... landlord/owner' placeholders", () => {
    for (const n of [
      "unknown st paul landlord",
      "unknown landlord",
      "unknown owner",
      "landlord unknown",
      "unknown minneapolis property owner",
    ]) {
      expect(isNonEntityName(n)).toBe(true);
    }
  });

  it("keeps real names that merely contain 'unknown'", () => {
    expect(isNonEntityName("five unknown holdings llc")).toBe(false);
    expect(isNonEntityName("the unknowns")).toBe(false);
  });
});

describe("linkKey", () => {
  it("keeps only the first address of a ';'-joined email cell", () => {
    expect(
      linkKey("email_or_owner_address", "minneapolis-mn", {
        applicantEmail: "minnesota@rentpure.com; mmohanlall@rentpure.com",
      }),
    ).toBe("email:minnesota@rentpure.com");
  });

  it("keeps only the first segment of a ';'-joined owner address", () => {
    expect(
      linkKey("email_or_owner_address", "philadelphia-pa", {
        ownerAddress: "201 Old York Road Suite; 1-458 Jenkintown, PA 19046 USA",
      }),
    ).toBe("addr:philadelphia-pa:201 old york road suite");
  });
});
