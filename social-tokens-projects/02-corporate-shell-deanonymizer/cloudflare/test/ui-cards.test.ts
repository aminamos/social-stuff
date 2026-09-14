import { describe, expect, it } from "vitest";
import { renderUI } from "../src/ui";

const html = renderUI();

describe("property cards: no repeated generic source spam", () => {
  it("drops lying source labels", () => {
    for (const lie of [
      "County Property Tax / Parcel PDF",
      "Municipal Licensing Docket",
      "Municipal Rental Licensing Feature Docket",
      "Municipal Rental Licensing Registry",
      "Labor Docket / Consent Decree",
      "Official Source Records & PDFs",
      "Official Labor Standards Registry Docket",
      "hennepin.us/residents/property",
    ]) {
      expect(html, `lying label still present: ${lie}`).not.toContain(lie);
    }
  });

  it("uses honest, working source labels", () => {
    expect(html).toContain("parcel search");
    expect(html).toContain("ArcGIS service");
    expect(html).toContain("https://www.hennepincounty.gov/services/property/property-information-search");
  });

  it("scopes the parcel link to Hennepin rows only", () => {
    expect(html).toContain("/hennepin/i.test(item.county");
  });
});

describe("property cards: compact single-line labor citation", () => {
  it("links the docket by matched case id, never owner name", () => {
    expect(html).toContain("encodeURIComponent(parts[0])");
    expect(html).toContain("encodeURIComponent(wageCaseId)");
    expect(html).not.toContain("encodeURIComponent(item.owner_name)");
  });

  it("keeps the fixture disclaimer while dropping the wall of text", () => {
    expect(html).toContain("Pending FOIA Sync");
    expect(html).not.toContain("LABOR VIOLATION CITATION ON RECORD");
    expect(html).not.toContain("affected caretakers/workers.");
  });
});

describe("markdown exporters: same honesty rules", () => {
  it("no parcel-PDF or registry-docket claims, case-id labor links", () => {
    expect(html).not.toContain("County Parcel & Property Tax Assessment");
    expect(html).not.toContain("County Property Tax / Parcel PDF:");
    expect(html).toContain("no verified deep link on file");
    expect(html).toContain("Labor citation: none on record");
  });
});
