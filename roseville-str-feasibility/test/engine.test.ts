/**
 * Engine unit tests — run: npm test (tsx).
 * Covers the Chapter 907/908/909 decision logic and booking math.
 */
import {
  evaluate,
  seasonBookingMath,
  optimalStay,
  classifyDwelling,
  isResidential,
  FEES,
  type ParcelFacts,
  type Scenario,
} from "../src/rules";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    passed++;
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}`, detail ?? "");
  }
}

const duplexNonOwner: ParcelFacts = {
  parcelId: "162923110015",
  siteAddress: "2080 FRY ST",
  siteCity: "ROSEVILLE",
  homestead: false,
  homesteadDescription: null,
  dwellingType: "TWO FAMILY DWELLING - SIDE/SIDE",
  structureDescription: null,
  landUseDescription: "TWO FAMILY DWELLING - SIDE/SIDE",
  useType: "1A/1B/4B1 RESIDENTIAL 1-3 UNITS",
  livingUnits: 2,
  bedrooms: 6,
  yearBuilt: 1958,
  emvTotal: 380000,
  ownerName: "INVESTOR LLC",
  ownerCityStateZIP: "SHOREVIEW MN 55126",
  lastSaleDate: null,
  salePrice: null,
  latitude: 45.01,
  longitude: -93.15,
};

const sfhHomestead: ParcelFacts = {
  ...duplexNonOwner,
  dwellingType: "SINGLE FAMILY DWELLING",
  landUseDescription: "SINGLE FAMILY DWELLING",
  livingUnits: 1,
  homestead: true,
};

const baseScenario: Scenario = {
  ownerOccupied: "auto",
  avgStayNights: 3,
  adr: 185,
  strategy: "auto",
};

console.log("== booking math ==");
{
  const w = seasonBookingMath(212, 7, 3);
  check("winter 3-night stays → 30 bookings", w.bookings === 30, w);
  check("winter 3-night stays → 90 nights", w.nights === 90, w);
  const s = seasonBookingMath(153, 10, 3);
  check("summer 3-night stays → 15 bookings", s.bookings === 15, s);
  check("summer 3-night stays → 45 nights", s.nights === 45, s);
  const long = seasonBookingMath(212, 7, 30);
  check("winter 30-night stays → 7 bookings / 210 nights", long.bookings === 7 && long.nights === 210, long);
  const opt = optimalStay(212, 7);
  check("winter optimum ≈ full window", opt.nights >= 203, opt);
  const optS = optimalStay(153, 10);
  check("summer optimum ≈ full window", optS.nights >= 150, optS);
}

console.log("== classification ==");
{
  check("duplex class", classifyDwelling(duplexNonOwner) === "duplex");
  check("sfh class", classifyDwelling(sfhHomestead) === "single family");
  check("residential check", isResidential(duplexNonOwner));
  check(
    "municipal exempt not residential",
    !isResidential({ ...duplexNonOwner, landUseDescription: "EXEMPT PROP. OWNED BY MUNICIPALS", useType: "5E MUNICIPAL-PUBLIC SERVICE-OTHER", dwellingType: null, structureDescription: "OFFICE BLDG H-R 5ST" }),
  );
}

console.log("== verdicts ==");
{
  const r = evaluate(duplexNonOwner, baseScenario);
  check("non-owner duplex → STR applies", r.strApplies === true);
  check("non-owner duplex, 3n stays → midterm path flagged", r.verdict === "MIDTERM_907_PATH", r.verdict);
  check("licensing includes 909 + 907 + 312", r.licensing.some(l => l.chapter === "909") && r.licensing.some(l => l.chapter === "907") && r.licensing.some(l => l.chapter === "312"));
  check("500-ft spacing flag present", r.flags.some(f => f.includes("500-FT")));
  check("909 license fee encoded", r.licensing.find(l => l.chapter === "909")?.annualFeeUsd === FEES.strLicenseAnnual);

  const weekly = evaluate(duplexNonOwner, { ...baseScenario, avgStayNights: 7 });
  check("7-night stays → STR viable path", weekly.verdict === "STR_LICENSED_PATH", weekly.verdict);
  check("7-night winter bookings = 30", weekly.seasons[0].maxBookings === 30, weekly.seasons[0]);

  const oo = evaluate(sfhHomestead, baseScenario);
  check("homesteaded SFH → exempt", oo.verdict === "STR_EXEMPT_OWNER_OCCUPIED", oo.verdict);

  const forcedNo = evaluate(sfhHomestead, { ...baseScenario, ownerOccupied: "no" });
  check("homestead override=no → STR applies", forcedNo.strApplies === true);

  const apt = evaluate({ ...duplexNonOwner, livingUnits: 8, landUseDescription: "APARTMENT", dwellingType: "APARTMENT" }, baseScenario);
  check("8-unit → 908 regime", apt.verdict === "MULTIFAMILY_908_ONLY", apt.verdict);

  const otherCity = evaluate({ ...duplexNonOwner, siteCity: "MAPLEWOOD" }, baseScenario);
  check("Maplewood → out of scope", otherCity.verdict === "NOT_IN_ROSEVILLE");

  const commercial = evaluate(
    { ...duplexNonOwner, landUseDescription: "EXEMPT PROP. OWNED BY MUNICIPALS", useType: "5E MUNICIPAL", dwellingType: null, structureDescription: "OFFICE BLDG" },
    baseScenario,
  );
  check("municipal parcel → non-residential", commercial.verdict === "NON_RESIDENTIAL", commercial.verdict);

  const ownerDuplex = evaluate({ ...duplexNonOwner, homestead: true }, baseScenario);
  check("owner-occupied duplex → STR applies to rented unit + househack flag",
    ownerDuplex.strApplies === true && ownerDuplex.flags.some(f => f.includes("Homesteaded multi-unit")));

  const adu = evaluate(
    { ...duplexNonOwner, dwellingType: "SINGLE FAMILY W/ACCESSORY UNIT", landUseDescription: "SINGLE FAMILY W/ACCESSORY UNIT" },
    baseScenario,
  );
  check("accessory unit → ADU exemption flag", adu.flags.some(f => f.includes("Accessory unit")));
}

console.log("== economics ==");
{
  const r = evaluate(duplexNonOwner, { ...baseScenario, avgStayNights: 2, adr: 200 });
  // winter: floor(212/7)=30 bookings × 2n = 60; summer: floor(153/10)=15 × 2n = 30 → 90 nights
  check("2-night model → 90 sellable nights", r.annual.sellableNights === 90, r.annual.sellableNights);
  check("gross = 90 × $200 = 18000", r.annual.grossRevenue === 18000);
  check("lodging tax = 3% = 540", r.annual.lodgingTax === 540);
  check("net = gross − tax − $540 license", r.annual.netRevenue === 18000 - 540 - 540);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
