// Counterfactual engine: what if every Michigan parcel were taxed on SEV
// instead of capped taxable value? All math deterministic + sourced.

export interface CountyRow {
  county: string;
  tv: number;
  sev: number;
  sev_res: number;
  gap: number;
  total_tax: number;
  avg_rate: number;
  uncap_uplift: number;
}

export interface ClassRow {
  year: number;
  cls: string;
  sev: number;
  tv: number;
  gap: number;
}

export interface ModelParams {
  /** Fraction of the SEV-TV gap actually taxed (1 = full uncap to SEV). */
  uncapShare: number;
  /** 1 = uncap only the residential class. */
  residentialOnly: number;
  /** Net MI individual income tax baseline to replace (dollars). */
  incomeTaxRevenue: number;
  /** Baseline annual existing-home sales (units). */
  baseAnnualSales: number;
  /** Share of owner households with long tenure (locked-in cohort). */
  longTenureShare: number;
  /** Mobility uplift range applied to the locked-in cohort (Ferreira 2010 anchor: ~0.25). */
  turnoverLiftLow: number;
  turnoverLiftHigh: number;
  /** Share of extra tax that capitalizes into home prices (0-1). */
  capShare: number;
  /** Real discount rate for PV of the tax stream. */
  discountRate: number;
  /** Median sale price for context. */
  medianPrice: number;
  incomeTaxNote?: string;
  baseSalesNote?: string;
}

export function defaultParams(): ModelParams {
  return {
    uncapShare: 1.0,
    residentialOnly: 0,
    incomeTaxRevenue: 11_400_000_000,
    baseAnnualSales: 105_862,
    longTenureShare: 0.45,
    turnoverLiftLow: 0.10,
    turnoverLiftHigh: 0.25,
    capShare: 0.25,
    discountRate: 0.05,
    medianPrice: 265_000,
  };
}

export interface CountyResult extends CountyRow {
  uncapped_levy: number;
  uplift_applied: number;
}

export interface ModelResult {
  state: {
    tv: number;
    sev: number;
    gap: number;
    gapPctOfSev: number;
    levy: number;
    avgRate: number;
    uplift: number;
    uncappedLevy: number;
    incomeTaxCoveragePct: number;
    incomeTaxShortfall: number;
    millsNeededForFullReplacement: number;
    residentialUplift: number;
  };
  turnover: {
    baseSales: number;
    lockedInOwners: number;
    extraSalesLow: number;
    extraSalesHigh: number;
    pctOfBaselineLow: number;
    pctOfBaselineHigh: number;
  };
  prices: {
    residentialMarketValue: number;
    residentialUplift: number;
    pvOfUplift: number;
    priceDeclinePctLow: number;
    priceDeclinePctHigh: number;
    note: string;
  };
  counties: CountyResult[];
  params: ModelParams;
}

export function runModel(
  counties: CountyRow[],
  classes: ClassRow[],
  params: ModelParams,
): ModelResult {
  const residentialGap = classes
    .filter((c) => c.year === 2024 && c.cls === "residential")
    .reduce((a, c) => a + c.gap, 0);
  const residentialSev = classes
    .filter((c) => c.year === 2024 && c.cls === "residential")
    .reduce((a, c) => a + c.sev, 0);

  const res = counties.map((c) => {
    // residential-only mode approximates the county gap by its residential
    // share of SEV (county class splits for TV are not published)
    const gap = params.residentialOnly
      ? c.gap * Math.min(1, c.sev_res / c.sev)
      : c.gap;
    const uplift = (gap * c.avg_rate * params.uncapShare) / 1000;
    return { ...c, uncapped_levy: c.total_tax + uplift, uplift_applied: uplift };
  });

  const tv = counties.reduce((a, c) => a + c.tv, 0);
  const sev = counties.reduce((a, c) => a + c.sev, 0);
  const gap = sev - tv;
  const levy = counties.reduce((a, c) => a + c.total_tax, 0);
  const uplift = res.reduce((a, c) => a + c.uplift_applied, 0);
  const avgRate = (levy / tv) * 1000;
  const residentialUplift = (residentialGap * avgRate * params.uncapShare) / 1000;

  const coverage = params.incomeTaxRevenue > 0 ? uplift / params.incomeTaxRevenue : 0;

  // Turnover: Prop-13 portability natural experiment (Ferreira 2010) found
  // ~25% higher mobility when the lock-in subsidy became portable. Apply the
  // lift range to the locked-in cohort's share of annual sales.
  const lockedInSales = params.baseAnnualSales * params.longTenureShare;
  const extraLow = lockedInSales * params.turnoverLiftLow;
  const extraHigh = lockedInSales * params.turnoverLiftHigh;

  // Prices: only the residential share of uplift bears on homes. PV of the
  // new annual tax at the discount rate, partially capitalized (capShare),
  // spread over residential market value (~2x residential SEV).
  const resMarket = residentialSev * 2;
  const pv = (residentialUplift / params.discountRate) * params.capShare;
  const declineLow = (pv / resMarket) * 0.5;
  const declineHigh = pv / resMarket;

  return {
    state: {
      tv, sev, gap,
      gapPctOfSev: gap / sev,
      levy, avgRate,
      uplift,
      uncappedLevy: levy + uplift,
      incomeTaxCoveragePct: coverage,
      incomeTaxShortfall: Math.max(0, params.incomeTaxRevenue - uplift),
      millsNeededForFullReplacement: ((levy + params.incomeTaxRevenue) / sev) * 1000,
      residentialUplift,
    },
    turnover: {
      baseSales: params.baseAnnualSales,
      lockedInOwners: lockedInSales,
      extraSalesLow: Math.round(extraLow),
      extraSalesHigh: Math.round(extraHigh),
      pctOfBaselineLow: extraLow / params.baseAnnualSales,
      pctOfBaselineHigh: extraHigh / params.baseAnnualSales,
    },
    prices: {
      residentialMarketValue: resMarket,
      residentialUplift,
      pvOfUplift: pv,
      priceDeclinePctLow: declineLow,
      priceDeclinePctHigh: declineHigh,
      note: "Buyer-side taxes are unchanged (TV already uncaps at sale), so the cap's subsidy is an incumbent wealth transfer, not embedded in purchase prices. The decline estimate reflects only higher carrying cost + added supply; an income-tax cut offsets via higher demand.",
    },
    counties: res,
    params,
  };
}
