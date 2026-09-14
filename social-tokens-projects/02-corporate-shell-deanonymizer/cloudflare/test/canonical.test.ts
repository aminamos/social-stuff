import { describe, expect, it } from "vitest";
import {
  canonicalParcelId,
  isNonEntityName,
  linkKey,
  normalizeEntityName,
  slugifyCity,
  toBBL,
} from "../src/canonical";

describe("toBBL", () => {
  it("pads block to 5 and lot to 4 (HPD example: 2/2810/45)", () => {
    expect(toBBL("2", "2810", "45")).toBe("2028100045");
  });

  it("passes through an already-padded BBL unchanged", () => {
    expect(toBBL(3, "01234", "0123")).toBe("3012340123");
  });

  it("rejects boroids outside 1-5", () => {
    expect(toBBL("0", "2810", "45")).toBe("");
    expect(toBBL("6", "2810", "45")).toBe("");
    expect(toBBL("", "2810", "45")).toBe("");
  });

  it("rejects missing or non-numeric block/lot", () => {
    expect(toBBL("2", "", "45")).toBe("");
    expect(toBBL("2", "2810", "")).toBe("");
    expect(toBBL("2", "AB12", "45")).toBe("");
    expect(toBBL("2", null, undefined)).toBe("");
  });
});

describe("canonicalParcelId", () => {
  it("formats STATE:COUNTY:APN with county uppercased and dashed", () => {
    expect(canonicalParcelId("mn", "Hennepin", "12345")).toBe("MN:HENNEPIN:12345");
    expect(canonicalParcelId("MN", "St. Louis", " 678 ")).toBe("MN:ST-LOUIS:678");
  });
});

describe("slugifyCity", () => {
  it("lowercase-dashes the city and appends state", () => {
    expect(slugifyCity("Minneapolis", "MN")).toBe("minneapolis-mn");
    expect(slugifyCity("  Saint Paul  ", "MN")).toBe("saint-paul-mn");
  });
});

describe("normalizeEntityName", () => {
  it("keeps the first segment and reduces to alphanumerics", () => {
    expect(normalizeEntityName("Vance Holdings, LLC")).toBe("vance holdings");
    expect(normalizeEntityName("Acme LLC | Acme Inc")).toBe("acme llc");
    expect(normalizeEntityName("  MARCUS  VANCE  ")).toBe("marcus vance");
  });

  it("handles empty input", () => {
    expect(normalizeEntityName("")).toBe("");
  });
});

describe("isNonEntityName", () => {
  it("flags placeholders and role-only names", () => {
    expect(isNonEntityName("")).toBe(true);
    expect(isNonEntityName("n a")).toBe(true);
    expect(isNonEntityName("same as owner")).toBe(true);
    expect(isNonEntityName("community manager")).toBe(true);
    expect(isNonEntityName("the management office")).toBe(true);
  });

  it("passes real entity names", () => {
    expect(isNonEntityName("vance holdings")).toBe(false);
    expect(isNonEntityName("marcus vance")).toBe(false);
  });
});

describe("linkKey", () => {
  it("links email globally across jurisdictions", () => {
    expect(
      linkKey("email_or_owner_address", "minneapolis-mn", {
        applicantEmail: " MGMT@Example.COM ",
      }),
    ).toBe("email:mgmt@example.com");
  });

  it("scopes owner-address links to the jurisdiction", () => {
    expect(
      linkKey("email_or_owner_address", "minneapolis-mn", {
        ownerAddress: "123 Main St",
      }),
    ).toBe("addr:minneapolis-mn:123 main st");
  });

  it("prefers email over address and never falls back to names", () => {
    expect(
      linkKey("email_or_owner_address", "minneapolis-mn", {
        applicantEmail: "a@b.co",
        ownerAddress: "123 Main St",
        ownerName: "Vance Holdings",
      }),
    ).toBe("email:a@b.co");
    // Name-only input must not link: building/placeholder names would
    // collapse unrelated parcels into one false syndicate.
    expect(
      linkKey("email_or_owner_address", "minneapolis-mn", {
        ownerName: "Vance Holdings",
      }),
    ).toBe(null);
  });

  it("returns null when bbl/registration_contacts strategies apply", () => {
    const parts = { applicantEmail: "a@b.co", ownerName: "Vance" };
    expect(linkKey("bbl", "new-york-ny", parts)).toBe(null);
    expect(linkKey("registration_contacts", "new-york-ny", parts)).toBe(null);
  });

  it("name strategy requires a usable name of length >= 3", () => {
    expect(linkKey("name", "chicago-il", { ownerName: "Vance Holdings" })).toBe(
      "name:chicago-il:vance holdings",
    );
    expect(linkKey("name", "chicago-il", { ownerName: "AB" })).toBe(null);
    expect(linkKey("name", "chicago-il", { ownerName: "Same As Owner" })).toBe(null);
    expect(linkKey("name", "chicago-il", {})).toBe(null);
  });
});
