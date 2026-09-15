/**
 * Roseville, MN rental regulatory engine.
 *
 * Encodes the deterministic parts of:
 *   - City Code Chapter 909 (Short-Term Rental licensing, as amended by
 *     Ordinance 1657, adopted 2024-02-12)
 *   - City Code Chapter 907 (Rental Registration, 1-4 units)
 *   - City Code Chapter 908 (Rental Licensing, 5+ units)
 *   - City Code Chapter 312 (3% lodging tax on rentals < 30 days)
 *   - City Code Chapter 317 (Lodging / extended-stay licenses)
 *   - Appendix A / Section 314.05 (fee schedule figures)
 *
 * Everything in this file is pure TypeScript: no I/O, no bindings.
 */

// ---------------------------------------------------------------------------
// Statutory constants (verify against current fee schedule before relying)
// ---------------------------------------------------------------------------

export const FEES = {
  /** 909.05.A + Fee Schedule §314.05: STR license, per year. */
  strLicenseAnnual: 540,
  /** Late renewal penalty for 909 license (909.04.B). */
  strLicenseLateFee: 43,
  /** 907 registration, per unit, per year (1-4 unit properties). */
  rentalRegistrationPerUnit: 45,
  /** 907 late renewal. */
  rentalRegistrationLate: 43,
  /** Ch. 312 lodging tax on rentals < 30 days, remitted monthly (909.05.B). */
  lodgingTaxRate: 0.03,
} as const;

/** Local agent must reside in one of these MN counties (909.02 "Local Agent"). */
export const LOCAL_AGENT_COUNTIES = [
  "Anoka",
  "Carver",
  "Dakota",
  "Hennepin",
  "Ramsey",
  "Scott",
  "Washington",
] as const;

/** Eligible STR unit types per 909.03.A.4. */
export const STR_ELIGIBLE_TYPES = [
  "single family",
  "twin-home",
  "townhome",
  "condo",
  "duplex",
  "triplex",
  "fourplex",
] as const;

/** Occupancy ceiling per unit (909.03.A.6 -> 906.06 / 1001.10). */
export const MAX_UNRELATED_ADULTS = 4;

/** 909.03.B: no new license within 500 ft of another licensed STR. */
export const SPACING_FEET = 500;

/** 909.07.C: notify residential 1-4 unit properties within 300 ft. */
export const NOTICE_RADIUS_FEET = 300;

/** STR seasonal frequency caps (909.02 "Short-Term Rental"). */
export interface Season {
  key: "winter" | "summer";
  label: string;
  /** Inclusive date range within the recurring annual cycle. */
  range: string;
  daysNonLeap: number;
  minStartSpacingDays: number;
}

export const SEASONS: Season[] = [
  {
    key: "winter",
    label: "Oct 1 – May 1",
    range: "Oct 1 through Apr 30",
    // Oct31+Nov30+Dec31+Jan31+Feb28+Mar31+Apr30
    daysNonLeap: 212,
    minStartSpacingDays: 7,
  },
  {
    key: "summer",
    label: "May 1 – Oct 1",
    range: "May 1 through Sep 30",
    // May31+Jun30+Jul31+Aug31+Sep30
    daysNonLeap: 153,
    minStartSpacingDays: 10,
  },
];

/** Stays longer than this are not STRs at all (909.02). */
export const STR_MAX_NIGHTS = 30;

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface ParcelFacts {
  parcelId: string | null;
  siteAddress: string | null;
  siteCity: string | null;
  /** HomesteadYN === 'Y' */
  homestead: boolean | null;
  homesteadDescription: string | null;
  dwellingType: string | null;
  structureDescription: string | null;
  landUseDescription: string | null;
  /** Tax class, e.g. "1A/1B/4B1 RESIDENTIAL 1-3 UNITS" */
  useType: string | null;
  livingUnits: number | null;
  bedrooms: number | null;
  yearBuilt: number | null;
  emvTotal: number | null;
  ownerName: string | null;
  ownerCityStateZIP: string | null;
  lastSaleDate: string | null;
  salePrice: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Scenario {
  /** 'auto' = infer from homestead flag. */
  ownerOccupied: "auto" | "yes" | "no";
  /** Planned average guest stay in nights. */
  avgStayNights: number;
  /** Assumed nightly rate in USD. */
  adr: number;
  /** 'str' | 'midterm' | 'auto' — auto picks best legal path. */
  strategy: "auto" | "str" | "midterm";
  /** Which unit a multi-unit owner occupies (0 = owner not on site). */
  ownerLivesOnSite?: boolean;
}

export type Verdict =
  | "NOT_IN_ROSEVILLE"
  | "NON_RESIDENTIAL"
  | "MULTIFAMILY_908_ONLY"
  | "STR_EXEMPT_OWNER_OCCUPIED"
  | "STR_LICENSED_PATH"
  | "MIDTERM_907_PATH"
  | "COMMERCIAL_LODGING_317";

export interface SeasonMath {
  season: string;
  windowDays: number;
  minStartSpacingDays: number;
  /** Max bookings if every stay is `avgStayNights`. */
  maxBookings: number;
  /** Nights actually sellable at that stay length. */
  sellableNights: number;
  /** Theoretical max nights under the cap with optimal stay length. */
  optimalStayNights: number;
  optimalNights: number;
}

export interface EngineResult {
  verdict: Verdict;
  headline: string;
  ownerOccupied: boolean;
  strApplies: boolean;
  exemption: string | null;
  eligibleUnitType: string | null;
  seasons: SeasonMath[];
  annual: {
    maxBookings: number;
    sellableNights: number;
    grossRevenue: number;
    lodgingTax: number;
    licenseAndFees: number;
    netRevenue: number;
    occupancyPct: number;
    naiveOccupancyPct: number;
    naiveRevenue: number;
    /** Best nights achievable under the frequency cap. */
    optimalNights: number;
    optimalRevenue: number;
  };
  licensing: LicenseRequirement[];
  compliance: string[];
  flags: string[];
  sources: string[];
}

export interface LicenseRequirement {
  chapter: string;
  name: string;
  annualFeeUsd: number | null;
  trigger: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const norm = (s: string | null | undefined) => (s ?? "").toUpperCase();

/** Classify a parcel into an STR-eligible unit type label, or null. */
export function classifyDwelling(p: ParcelFacts): string | null {
  const dt = norm(p.dwellingType);
  const lu = norm(p.landUseDescription);
  const st = norm(p.structureDescription);
  const hay = `${dt} ${lu} ${st}`;

  if (/THREE|TRIPLEX|3.?PLEX/.test(hay)) return "triplex";
  if (/FOUR|4.?PLEX|QUAD/.test(hay)) return "fourplex";
  if (/TWO FAMILY|DUPLEX|TWIN.?HOME|TWINHOME/.test(hay)) {
    return /TWIN/.test(hay) ? "twin-home" : "duplex";
  }
  if (/TOWN ?HOME|TOWNHOUSE/.test(hay)) return "townhome";
  if (/CONDO|COMMON INTEREST/.test(hay)) return "condo";
  if (/APARTMENT|MULTI.?FAMILY|5\+|UNITS/.test(hay) && (p.livingUnits ?? 0) >= 5)
    return "apartment (5+ units)";
  if (/ACCESSORY|ADU/.test(hay)) return "single family w/ ADU";
  if (/SINGLE FAMILY|RESIDENTIAL/.test(hay)) return "single family";
  return null;
}

export function isResidential(p: ParcelFacts): boolean {
  const useType = norm(p.useType);
  const lu = norm(p.landUseDescription);
  // Ramsey tax classes starting with 1/4B residential markers.
  if (/RESIDENTIAL|APARTMENT|DWELLING|CONDO|TOWN ?HOME/.test(lu)) return true;
  if (/^1[A-Z]?|^4B/.test(useType)) return true;
  return classifyDwelling(p) !== null;
}

/**
 * Bookable nights in a season under the start-spacing cap.
 * Each rental must commence >= `spacing` days after the prior commencement,
 * and rentals cannot overlap: effective cycle = max(stay, spacing).
 */
export function seasonBookingMath(
  days: number,
  spacing: number,
  avgStay: number,
): { bookings: number; nights: number } {
  const stay = Math.max(1, Math.min(avgStay, STR_MAX_NIGHTS));
  const cycle = Math.max(stay, spacing);
  const bookings = Math.floor(days / cycle);
  return { bookings, nights: bookings * stay };
}

/** Optimal stay length (1..30) maximizing sellable nights under the cap. */
export function optimalStay(days: number, spacing: number): { stay: number; nights: number } {
  let best = { stay: spacing, nights: 0 };
  for (let stay = 1; stay <= STR_MAX_NIGHTS; stay++) {
    const { nights } = seasonBookingMath(days, spacing, stay);
    if (nights > best.nights) best = { stay, nights };
  }
  return best;
}

// ---------------------------------------------------------------------------
// Main evaluation
// ---------------------------------------------------------------------------

export function evaluate(p: ParcelFacts | null, s: Scenario): EngineResult {
  const sources = [
    "Roseville City Code Ch. 909 (Ord. 1657, eff. 2024-02-12)",
    "Roseville City Code Ch. 907 (rental registration, 1–4 units)",
    "Roseville City Code Ch. 908 (rental license, 5+ units)",
    "Roseville City Code Ch. 312 (3% lodging tax, monthly)",
    "Roseville City Code Ch. 317 (lodging / extended-stay)",
    "Fee Schedule §314.05 / Appendix A",
  ];

  // --- Gate 1: jurisdiction -------------------------------------------------
  if (!p || norm(p.siteCity) !== "ROSEVILLE") {
    return base({
      verdict: "NOT_IN_ROSEVILLE",
      headline: "This parcel is not inside Roseville city limits",
      ownerOccupied: false,
      flags: p
        ? [`Parcel is in ${p.siteCity ?? "unknown city"} — that city's rental code applies, not Ch. 907–909.`]
        : ["No Ramsey County parcel matched this address."],
      sources,
    });
  }

  // --- Gate 2: residential --------------------------------------------------
  if (!isResidential(p)) {
    return base({
      verdict: "NON_RESIDENTIAL",
      headline: "Parcel is not classified as residential",
      ownerOccupied: false,
      flags: [
        `County land-use: "${p.landUseDescription ?? "unknown"}" (${p.useType ?? "no tax class"}).`,
        "Residential STR/registration paths (907–909) do not apply. A Ch. 317 lodging license is the only commercial-stay route.",
      ],
      sources,
    });
  }

  const units = p.livingUnits ?? 1;
  const dwelling = classifyDwelling(p);
  const ownerOccupied =
    s.ownerOccupied === "auto" ? p.homestead === true : s.ownerOccupied === "yes";

  // --- Gate 3: 5+ unit buildings leave the 907/909 regime -------------------
  if (units >= 5) {
    return base({
      verdict: "MULTIFAMILY_908_ONLY",
      headline: "5+ unit building — Chapter 908 rental license regime",
      ownerOccupied,
      strApplies: false,
      eligibleUnitType: dwelling,
      flags: [
        "Ch. 909 license categories stop at fourplexes; a >4-unit building is a multifamily rental under Ch. 908 (license via Roseville Fire Dept., 651-792-7340).",
        "Whole-building Airbnb-style operation is not a permitted path; individual condo-style units inside the building may differ — confirm with Community Development.",
        "Rentals >30 days: Ch. 908 license (not the $45/unit 907 registration).",
      ],
      sources,
    });
  }

  // --- 909.08 exemptions ----------------------------------------------------
  if (ownerOccupied && units === 1) {
    return base({
      verdict: "STR_EXEMPT_OWNER_OCCUPIED",
      headline: "Owner-occupied — likely exempt from the STR license",
      ownerOccupied,
      strApplies: false,
      exemption:
        "909.08: sleeping rooms in an owner-occupied residence, rentals where the owner is present, and non-detached ADUs are exempt from Ch. 909 licensing.",
      eligibleUnitType: dwelling,
      flags: [
        "Exemption covers rooms in YOUR unit, owner-present stays, and attached (non-detached) ADUs permitted under Title 10.",
        "Renting the entire homestead while you are away is NOT covered by the exemption — the dwelling unit is then non-owner-occupied for that rental.",
        "Homestead flag (HomesteadYN=Y) is the county's evidence; keep deed/occupancy proof for the file.",
      ],
      compliance: [
        "Occupancy ceiling still applies: max 4 unrelated adults or one family per unit (906.06/1001.10).",
        "No RV/camper rentals (909.02).",
      ],
      sources,
    });
  }

  // --- Owner-occupied multi-unit (classic duplex house-hack) ----------------
  const partialOwnerOccupied = ownerOccupied && units > 1;
  const unitType = dwelling ?? "single family";

  const seasonMath: SeasonMath[] = SEASONS.map((se) => {
    const { bookings, nights } = seasonBookingMath(
      se.daysNonLeap,
      se.minStartSpacingDays,
      s.avgStayNights,
    );
    const opt = optimalStay(se.daysNonLeap, se.minStartSpacingDays);
    return {
      season: se.label,
      windowDays: se.daysNonLeap,
      minStartSpacingDays: se.minStartSpacingDays,
      maxBookings: bookings,
      sellableNights: nights,
      optimalStayNights: opt.stay,
      optimalNights: opt.nights,
    };
  });

  const maxBookings = seasonMath.reduce((a, m) => a + m.maxBookings, 0);
  const sellableNights = seasonMath.reduce((a, m) => a + m.sellableNights, 0);
  const optimalNights = seasonMath.reduce((a, m) => a + m.optimalNights, 0);

  const gross = Math.round(sellableNights * s.adr);
  const lodgingTax = Math.round(gross * FEES.lodgingTaxRate);
  const licenseAndFees = FEES.strLicenseAnnual;
  const net = gross - lodgingTax - licenseAndFees;

  // Naive pro-forma an uninformed investor would run (75% occupancy).
  const naiveNights = Math.round(365 * 0.75);
  const naiveRevenue = Math.round(naiveNights * s.adr);

  const compliance: string[] = [
    `Max occupancy per unit: ${MAX_UNRELATED_ADULTS} unrelated adults OR one family (909.03.A.6; 906.06/1001.10).`,
    `One rental commencement per ${SEASONS[0].minStartSpacingDays} days Oct 1–May 1; per ${SEASONS[1].minStartSpacingDays} days May 1–Oct 1 (909.02).`,
    `Stay ceiling: rentals >${STR_MAX_NIGHTS} days exit the STR regime and need Ch. 907/908/317 authority (909.02).`,
    `Local agent must reside in: ${LOCAL_AGENT_COUNTIES.join(", ")} counties (909.02).`,
    `Notify all 1–4 unit residential properties within ${NOTICE_RADIUS_FEET} ft within 10 days of license approval AND every annual renewal (909.07.C).`,
    "Post the license + noise/nuisance/parking code sections (405, 407, 602) inside the unit (909.07.A).",
    "Keep a guest register (dates + duration); submit it WITH the monthly 3% lodging-tax return (909.05.B, 909.12).",
    "License runs 365 days; late renewal = fee penalty; operating 5+ days past expiry = violation (909.04).",
    "Caught renting unlicensed: license cannot take effect for 90 days after application (909.06.F).",
    "License does NOT transfer on sale — buyer must apply within 30 days and cannot host until issued (909.06.C).",
    "2+ violations in 180 days → suspension (≥180 days) or revocation; revocation lifted only on ownership change to a non-affiliated party (909.09).",
    "RVs/campers may never be rentals (909.02).",
  ];

  const flags: string[] = [
    `500-FT SPACING RULE (909.03.B): no new license if another Ch. 909-licensed property is within ${SPACING_FEET} ft. Not published as open data — search Accela "Short-Term Rental License" records near the address before offering: https://aca-prod.accela.com/ROSEVILLE_MN/Cap/CapHome.aspx?module=Licenses`,
    "Acquisition risk: if buying, the seller's license dies at closing — budget the application gap into the pro-forma (909.06.C).",
  ];
  if (partialOwnerOccupied) {
    flags.push(
      "Homesteaded multi-unit: your own unit is owner-occupied, but the RENTED unit is non-owner-occupied — full Ch. 909 licensing, frequency caps, and spacing rules apply to that unit. Rooms inside your own unit stay exempt (909.08).",
    );
  }
  if (/ACCESSORY|ADU/i.test(`${p.dwellingType ?? ""} ${p.landUseDescription ?? ""}`)) {
    flags.push(
      "Accessory unit on parcel: 909.08 exempts ADUs that are NOT detached from the principal dwelling and permitted under Title 10. County data doesn't record attached vs detached — if this ADU is attached, it may be exempt; confirm with Community Development.",
    );
  }
  if (p.salePrice && p.lastSaleDate) {
    flags.push(
      `Last recorded sale ${p.lastSaleDate} at $${p.salePrice.toLocaleString()} — if you are evaluating a purchase, remember the 909 license is not transferable.`,
    );
  }

  const licensing: LicenseRequirement[] = [
    {
      chapter: "909",
      name: "Short-Term Rental License",
      annualFeeUsd: FEES.strLicenseAnnual,
      trigger: "Any rental ≤30 consecutive days of a non-owner-occupied unit",
      notes:
        "Annual via ePermits; requires unit type, bedroom count, occupancy attestation, owner + local-agent contacts. Subject to 500-ft spacing.",
    },
    {
      chapter: "907",
      name: "Rental Registration",
      annualFeeUsd: FEES.rentalRegistrationPerUnit * units,
      trigger: "Rentals >30 days in a 1–4 unit property",
      notes: `$${FEES.rentalRegistrationPerUnit}/unit/yr. Waived while a valid 909 license exists and lease periods exceed 30 days (909.06.D).`,
    },
    {
      chapter: "312",
      name: "Lodging tax",
      annualFeeUsd: null,
      trigger: "All rentals <30 days",
      notes: `3% of gross monthly receipts, remitted monthly with the guest register.`,
    },
    {
      chapter: "317",
      name: "Lodging license + extended-stay permit",
      annualFeeUsd: null,
      trigger: "Alternative authority for >30-day stays (hotel-style operation)",
      notes: "Optional alternative to 907/908 for extended-stay models.",
    },
  ];

  const midtermBetter =
    s.strategy === "midterm" ||
    (s.avgStayNights <= 4 && sellableNights < 160);

  const verdict: Verdict = midtermBetter ? "MIDTERM_907_PATH" : "STR_LICENSED_PATH";
  const headline = midtermBetter
    ? `Legal STR path exists, but a ${s.avgStayNights}-night model only sells ~${sellableNights} nights/yr — mid-term (>30 day) rentals avoid the frequency cap entirely`
    : `Eligible for a Ch. 909 STR license — capped at ~${maxBookings} bookings/yr, ~${sellableNights} sellable nights at ${s.avgStayNights}-night stays`;

  return {
    verdict,
    headline,
    ownerOccupied,
    strApplies: true,
    exemption: null,
    eligibleUnitType: unitType,
    seasons: seasonMath,
    annual: {
      maxBookings,
      sellableNights,
      grossRevenue: gross,
      lodgingTax,
      licenseAndFees,
      netRevenue: net,
      occupancyPct: Math.round((sellableNights / 365) * 100),
      naiveOccupancyPct: 75,
      naiveRevenue,
      optimalNights,
      optimalRevenue: Math.round(optimalNights * s.adr),
    },
    licensing,
    compliance,
    flags,
    sources,
  };
}

function base(partial: Partial<EngineResult> & Pick<EngineResult, "verdict" | "headline" | "sources">): EngineResult {
  return {
    ownerOccupied: false,
    strApplies: false,
    exemption: null,
    eligibleUnitType: null,
    seasons: [],
    annual: {
      maxBookings: 0,
      sellableNights: 0,
      grossRevenue: 0,
      lodgingTax: 0,
      licenseAndFees: 0,
      netRevenue: 0,
      occupancyPct: 0,
      naiveOccupancyPct: 0,
      naiveRevenue: 0,
      optimalNights: 0,
      optimalRevenue: 0,
    },
    licensing: [],
    compliance: [],
    flags: [],
    ...partial,
  };
}
