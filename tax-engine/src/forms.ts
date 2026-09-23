/**
 * Additional TY2025 forms: Schedule D Tax Worksheet, 8863, 5695, Schedule R,
 * 6251 (AMT), 8615 (kiddie tax), 2210 (underpayment), and Minnesota M1.
 * Pure functions; the engine wires results into `lines`.
 */

import * as T from "./tables2025.js";
import type { FilingStatus, TaxInput } from "./types.js";

const rd = (n: number): number => (n < 0 ? -Math.round(-n) : Math.round(n));
const nz = (n?: number): number => n ?? 0;
const clamp0 = (n: number): number => Math.max(0, n);

// ------------------------------------------------- Schedule D Tax Worksheet
// Preferential stack: ordinary income first, then 0/15/20% net capital gain +
// qualified dividends, then unrecaptured §1250 at 25%, then 28%-rate gain.
// Final tax is the smaller of this and all-ordinary tax (the min-comparison
// produces the "lesser of marginal rate or cap" behavior for 1250/28% gain).

export interface PrefSplit {
  ordinary: number;
  pref1520: number; // qualified dividends + 0/15/20 net capital gain
  spec1250: number; // unrecaptured §1250 (max 25%)
  spec28: number; // collectibles / §1202 50% part (max 28%)
}

export function preferentialSplit(
  base: number,
  qualifiedDividends: number,
  netLtGain: number,
  unrecap1250: number,
  collect28: number,
): PrefSplit {
  const total = Math.max(0, base);
  const ltPool = Math.min(total, qualifiedDividends + Math.max(0, netLtGain));
  const ltIn = Math.min(Math.max(0, netLtGain), Math.max(0, ltPool - qualifiedDividends));
  const spec1250 = Math.min(ltIn, Math.max(0, unrecap1250));
  const spec28 = Math.min(ltIn - spec1250, Math.max(0, collect28));
  const pref1520 = ltPool - spec1250 - spec28;
  return { ordinary: total - ltPool, pref1520, spec1250, spec28 };
}

/** Tax under the Schedule D Tax Worksheet (or QDCGT when no special rates). */
export function capitalGainTax(
  taxableIncome: number,
  qualifiedDividends: number,
  netLtGain: number,
  unrecaptured1250: number,
  collectibles: number,
  status: FilingStatus,
  figureTax: (ti: number, s: FilingStatus) => number,
): number {
  const ti = Math.max(0, taxableIncome);
  if (ti === 0) return 0;
  const { ordinary, pref1520, spec1250, spec28 } = preferentialSplit(
    ti, qualifiedDividends, netLtGain, unrecaptured1250, collectibles,
  );
  if (pref1520 + spec1250 + spec28 <= 0) return figureTax(ti, status);
  const bp0 = T.CG_ZERO_PCT_TOP[status];
  const bp15 = T.CG_FIFTEEN_PCT_TOP[status];
  const zero = Math.min(pref1520, clamp0(bp0 - ordinary));
  const fifteen = Math.min(pref1520 - zero, clamp0(bp15 - ordinary - zero));
  const twenty = pref1520 - zero - fifteen;
  const tax =
    figureTax(ordinary, status) + rd(fifteen * 0.15) + rd(twenty * 0.2) +
    rd(spec1250 * 0.25) + rd(spec28 * 0.28);
  return Math.min(tax, figureTax(ti, status));
}

// ------------------------------------------------------------ Form 8863

export interface EducationResult {
  nonrefundable: number;
  refundable: number;
}

export function form8863(input: TaxInput, magi: number): EducationResult {
  const ed = input.education;
  if (!ed) return { nonrefundable: 0, refundable: 0 };
  const E = T.EDUCATION;

  let aoc = 0;
  for (const s of ed.aocStudents ?? []) {
    if (s.eligible === false) continue;
    const exp = nz(s.qualifiedExpenses);
    aoc += Math.min(exp, E.aocFirstTier) + 0.25 * Math.min(clamp0(exp - E.aocFirstTier), E.aocSecondTier);
  }
  const llc = E.llcRate * Math.min(nz(ed.llcExpenses), E.llcExpenseCap);

  const [lo, hi] = input.filingStatus === "mfj" ? E.phaseoutJoint : E.phaseout;
  const factor = magi <= lo ? 1 : magi >= hi ? 0 : (hi - magi) / (hi - lo);
  const aocPhased = aoc * factor;
  const llcPhased = llc * factor;

  const refundable = rd(E.aocRefundableRate * aocPhased);
  const nonrefundable = rd(aocPhased - refundable + llcPhased);
  return { nonrefundable: clamp0(nonrefundable), refundable: clamp0(refundable) };
}

// ------------------------------------------------------------ Form 5695

export function form5695(input: TaxInput): { credit: number; carryforwardTo2026: number } {
  const en = input.energy;
  if (!en) return { credit: 0, carryforwardTo2026: 0 };
  const C = T.ENERGY.c;
  const capped30 = (cost: number | undefined, cap: number) => rd(Math.min(C.rate * nz(cost), cap));
  const part25C =
    Math.min(
      capped30(en.exteriorDoors, C.doorCapTotal) +
        capped30(en.windowsSkylights, C.windowCap) +
        rd(C.rate * nz(en.insulationAirSealing)) +
        rd(C.rate * nz(en.otherQualifiedProperty)) +
        capped30(en.homeEnergyAudit, C.auditCap),
      C.annualCap,
    ) + capped30(en.heatPumpOrBiomass, C.heatPumpCap);

  const dCost =
    nz(en.solarElectric) + nz(en.solarWaterHeating) + nz(en.windEnergy) +
    nz(en.geothermalHeatPump) + nz(en.batteryStorage);
  const part25D = rd(T.ENERGY.d.rate * dCost) + nz(en.fuelCellCredit) + nz(en.carryforwardFrom2024);

  return { credit: part25C + part25D, carryforwardTo2026: 0 };
}

// ------------------------------------------------------------ Schedule R

export function scheduleR(input: TaxInput, agi: number, taxLimit: number, diagnostics: string[]): number {
  const sr = input.scheduleR;
  const status = input.filingStatus;
  const tpElderly = !!input.taxpayer.senior65Plus;
  const spElderly = !!input.spouse?.senior65Plus;
  const tpDisabled = !!sr?.under65OnDisability;
  const qualified = tpElderly || spElderly || tpDisabled;
  if (!qualified || !sr) return 0;

  if (status === "mfs" && !sr.mfsLivedApartAllYear) {
    diagnostics.push("Schedule R requires MFS filers to have lived apart from spouse all year");
    return 0;
  }

  const I = T.SCHEDULE_R.initial;
  let initial: number;
  if (status === "mfj") {
    const both = (tpElderly || tpDisabled) && (spElderly || tpDisabled);
    initial = both ? I.mfjBothElderly : I.mfjOneElderly;
  } else if (status === "mfs") {
    initial = I.mfsApart;
  } else {
    initial = I.singleOrHoh;
  }

  // Under 65 on disability: the base can't exceed taxable disability income.
  if (!tpElderly && tpDisabled && status !== "mfj") {
    initial = Math.min(initial, nz(sr.disabilityIncome));
  } else if (status === "mfj" && !tpElderly && tpDisabled && !spElderly) {
    initial = Math.min(initial, nz(sr.disabilityIncome));
  }

  const base = clamp0(
    initial - nz(sr.nontaxableBenefits) - 0.5 * clamp0(agi - T.SCHEDULE_R.agiThreshold[status]),
  );
  const credit = rd(T.SCHEDULE_R.rate * base);
  return Math.min(credit, Math.max(0, taxLimit));
}

// --------------------------------------------------------------- Form 6251

export interface AmtResult {
  amti: number;
  exemption: number;
  taxableExcess: number;
  tentativeMinimumTax: number;
  amt: number;
}

const amtFlatTax = (base: number, status: FilingStatus): number => {
  const bp = T.AMT.rate28Breakpoint[status];
  if (base <= 0) return 0;
  return base <= bp ? rd(base * 0.26) : rd(base * 0.28) - (status === "mfs" ? 2391 : 4782);
};

export function form6251(
  input: TaxInput,
  ctx: {
    taxableIncome: number;
    seniorDeduction: number;
    usedItemized: boolean;
    saltDeducted: number;
    standardDeduction: number;
    taxableStateRefunds: number;
    qualifiedDividends: number;
    netLtGain: number;
    unrecaptured1250: number;
    collectibles: number;
    regularTaxForAmt: number;
  },
  figureTax: (ti: number, s: FilingStatus) => number,
): AmtResult {
  const status = input.filingStatus;
  const a = input.amt ?? {};

  // Line 1: TI refigured without the senior deduction (not allowed for AMT).
  const line1 = ctx.taxableIncome + ctx.seniorDeduction;
  // Line 2a: SALT deducted if itemized; the standard deduction if not.
  const line2a = ctx.usedItemized ? ctx.saltDeducted : ctx.standardDeduction;
  // Line 2b enters as a negative amount.
  const adjustments =
    line2a - ctx.taxableStateRefunds +
    nz(a.investmentInterestDifference) + nz(a.depreciationAdjustment) +
    nz(a.dispositionAdjustment) + nz(a.passiveAdjustment) +
    nz(a.privateActivityBondInterest) + nz(a.isoAdjustment) +
    nz(a.qsbsExclusionAddback) + nz(a.otherAdjustments);
  const amti = line1 + adjustments;

  const exemption = clamp0(
    T.AMT.exemption[status] - T.AMT.phaseoutRate * clamp0(amti - T.AMT.phaseoutStart[status]),
  );
  const taxableExcess = clamp0(amti - exemption);

  // Part III: preferential-rate split applies when the return used the
  // QDCGT or Sch D Tax Worksheet for regular tax.
  const prefTotal = nz(ctx.qualifiedDividends) + Math.max(0, nz(ctx.netLtGain));
  let tmt: number;
  if (prefTotal > 0 && taxableExcess > 0) {
    const { ordinary, pref1520, spec1250, spec28 } = preferentialSplit(
      taxableExcess, ctx.qualifiedDividends, ctx.netLtGain, ctx.unrecaptured1250, ctx.collectibles,
    );
    const bp0 = T.CG_ZERO_PCT_TOP[status];
    const bp15 = T.CG_FIFTEEN_PCT_TOP[status];
    const zero = Math.min(pref1520, clamp0(bp0 - ordinary));
    const fifteen = Math.min(pref1520 - zero, clamp0(bp15 - ordinary - zero));
    const twenty = pref1520 - zero - fifteen;
    const part3 = amtFlatTax(ordinary, status) + rd(fifteen * 0.15) + rd(twenty * 0.2) +
      rd(spec1250 * 0.25) + rd(spec28 * 0.28);
    tmt = Math.min(part3, amtFlatTax(taxableExcess, status));
  } else {
    tmt = amtFlatTax(taxableExcess, status);
  }

  const tentative = clamp0(tmt - nz(a.amtForeignTaxCredit));
  const amt = clamp0(rd(tentative) - ctx.regularTaxForAmt);
  return { amti: rd(amti), exemption: rd(exemption), taxableExcess: rd(taxableExcess), tentativeMinimumTax: rd(tentative), amt: rd(amt) };
}

// --------------------------------------------------------------- Form 8615

export function form8615(
  input: TaxInput,
  childTaxableIncome: number,
  figureTax: (ti: number, s: FilingStatus) => number,
): { tax: number; netUnearned: number } | null {
  const k = input.kiddieTax;
  if (!k || k.applies === false) return null;
  if (nz(k.unearnedIncome) <= T.KIDDIE.trigger) return null;

  const deductionBase = k.itemizedDeductionBase ?? T.KIDDIE.nonItemizerDeduction;
  const netUnearned = Math.min(clamp0(nz(k.unearnedIncome) - deductionBase), Math.max(0, childTaxableIncome));
  if (netUnearned <= 0) return null;

  const otherNet = nz(k.otherChildrenNetUnearned);
  const allNet = netUnearned + otherNet;
  const parentDiff =
    figureTax(nz(k.parentTaxableIncome) + allNet, k.parentFilingStatus) -
    figureTax(Math.max(0, nz(k.parentTaxableIncome)), k.parentFilingStatus);
  const childShare = allNet > 0 ? (netUnearned / allNet) * parentDiff : 0;

  const tentative = figureTax(clamp0(childTaxableIncome - netUnearned), "single") + rd(childShare);
  const childRateOnly = figureTax(Math.max(0, childTaxableIncome), "single");
  return { tax: Math.max(tentative, childRateOnly), netUnearned: rd(netUnearned) };
}

// --------------------------------------------------------------- Form 2210

export function form2210(
  input: TaxInput,
  totalTax: number,
  amountOwed: number,
  diagnostics: string[],
  aiInstallments?: number[] | null,
): number {
  const u = input.underpayment;
  if (!u || u.waive) return 0;
  if (amountOwed < T.F2210.safeHarborBalanceDue) return 0;

  const status = input.filingStatus;
  const highAgi = nz(u.priorYearAgi) > (status === "mfs" ? T.F2210.highAgiThresholdMfs : T.F2210.highAgiThreshold);
  const priorFactor = highAgi ? T.F2210.priorTaxPctHighAgi : T.F2210.priorTaxPct;
  const requiredAnnual = Math.min(
    T.F2210.currentTaxPct * totalTax,
    priorFactor * nz(u.priorYearTax),
  );

  const wh = input.underpayment?.withholdingByQuarter;
  const whTotal = nz(input.federalWithholding);
  const whQ = wh && wh.length === 4 ? wh : [whTotal / 4, whTotal / 4, whTotal / 4, whTotal / 4];
  const estQ = u.estimatesByQuarter && u.estimatesByQuarter.length === 4
    ? u.estimatesByQuarter
    : [nz(input.estimatedTaxPayments) / 4, nz(input.estimatedTaxPayments) / 4, nz(input.estimatedTaxPayments) / 4, nz(input.estimatedTaxPayments) / 4];

  const quarterly = requiredAnnual / 4;
  let balance = 0; // positive = overpayment carried forward
  let penalty = 0;
  for (let q = 0; q < 4; q++) {
    const required = aiInstallments ? Math.min(quarterly, aiInstallments[q]) : quarterly;
    const paid = nz(whQ[q]) + nz(estQ[q]) + Math.max(0, balance);
    const under = Math.max(0, required - paid);
    balance = paid - required;
    penalty += (under * T.F2210.annualRate * T.F2210.accrualDays[q]) / 365;
  }
  const p = rd(penalty);
  if (p > 0 && !aiInstallments) diagnostics.push("Form 2210 penalty uses the standard quarterly method; Schedule AI (annualized income) may reduce it");
  return p;
}

// --------------------------------------------------------------- Form 2555

/**
 * §911 foreign earned income exclusion: min(foreign earned income,
 * $130,000 × qualifyingDays/365). Housing exclusion/deduction is not modeled.
 */
export function form2555(input: TaxInput): number {
  const f = input.feie;
  if (!f) return 0;
  const days = Math.min(f.qualifyingDays ?? T.FEIE.daysInYear, T.FEIE.daysInYear);
  const cap = (T.FEIE.maxExclusion * days) / T.FEIE.daysInYear;
  return rd(clamp0(Math.min(nz(f.foreignEarnedIncome), cap)));
}

// --------------------------------------------------------------- Form 8839

/**
 * Adoption credit: per-child min(expenses − employer benefits, $17,280),
 * MAGI phaseout $259,190–$299,190, refundable up to $5,000/child (OBBBA).
 */
export function form8839(input: TaxInput, magi: number): { credit: number; refundable: number } {
  const a = input.adoption;
  if (!a) return { credit: 0, refundable: 0 };
  let credit = 0;
  let refundableCap = 0;
  for (let i = 0; i < a.expensesPerChild.length; i++) {
    const net = clamp0(nz(a.expensesPerChild[i]) - nz(a.employerBenefitsPerChild?.[i]));
    if (net <= 0) continue;
    credit += Math.min(net, T.ADOPTION.maxPerChild);
    refundableCap += T.ADOPTION.refundableCapPerChild;
  }
  const { magiPhaseStart: lo, magiPhaseEnd: hi } = T.ADOPTION;
  if (magi >= hi) credit = 0;
  else if (magi > lo) credit = rd(credit * (1 - (magi - lo) / (hi - lo)));
  credit = rd(credit);
  return { credit, refundable: Math.min(credit, refundableCap) };
}

// --------------------------------------------------------------- Form 8962

export interface PtcResult {
  householdIncome: number;
  fplPct: number; // percent, e.g. 250 = 250%
  applicableFigure: number;
  contribution: number;
  ptc: number;
  /** PTC exceeding APTC — refundable (Sch 3 line 9). */
  netPtc: number;
  /** Excess APTC repayment after Table 5 cap (Sch 2 line 1a). */
  excessAptcRepayment: number;
}

export function form8962(input: TaxInput, householdIncome: number, diagnostics: string[]): PtcResult {
  const m = input.marketplace!;
  const region = m.fplRegion ?? "contiguous";
  const size = Math.max(1, Math.floor(m.familySize));
  const table = T.FPL_2024[region];
  const fpl = size <= table.length ? table[size - 1] : table[7] + (size - 8) * T.FPL_2024.perExtra[region];
  const fplFrac = fpl > 0 ? householdIncome / fpl : Infinity;
  const fplPct = fplFrac * 100;

  // Applicable figure: linear interpolation inside each band.
  let fig = 0;
  const bands = T.APPLICABLE_FIGURE;
  for (let i = 1; i < bands.length; i++) {
    const [lo, loFig] = bands[i - 1];
    const [hi, hiFig] = bands[i];
    if (fplFrac <= hi || i === bands.length - 1) {
      fig = loFig + (hiFig - loFig) * clamp0((Math.min(fplFrac, hi) - lo) / (hi - lo));
      break;
    }
  }
  const contribution = rd(fig * householdIncome);
  const months = Math.min(m.monthsCovered ?? 12, 12);
  const benchmark = nz(m.slcspBenchmarkAnnual) * (months / 12);
  const premiums = nz(m.premiumsPaidAnnual) * (months / 12);
  const ptc = rd(clamp0(Math.min(benchmark - contribution, premiums)));

  const aptc = nz(m.aptcReceived);
  let netPtc = 0;
  let excessAptcRepayment = 0;
  if (ptc >= aptc) {
    netPtc = ptc - aptc;
  } else {
    const excess = aptc - ptc;
    if (fplPct >= 400) {
      excessAptcRepayment = excess;
      diagnostics.push("excess APTC fully repayable: household income >= 400% FPL (no Table 5 cap)");
    } else {
      const idx = fplPct < 200 ? 0 : fplPct < 300 ? 1 : 2;
      const caps = input.filingStatus === "single" ? T.APTC_REPAY_LIMIT.single : T.APTC_REPAY_LIMIT.other;
      excessAptcRepayment = Math.min(excess, caps[idx]);
    }
  }
  if (input.filingStatus === "mfs") diagnostics.push("MFS filers are generally not applicable taxpayers for PTC unless an exception applies");
  return {
    householdIncome: rd(householdIncome), fplPct: rd(fplPct), applicableFigure: fig,
    contribution, ptc, netPtc, excessAptcRepayment: rd(excessAptcRepayment),
  };
}

// --------------------------------------------------------------- Form 4952

/** Investment interest expense deduction: limited to net investment income; excess carries forward. */
export function form4952(input: TaxInput, netInvestmentIncome: number, diagnostics: string[]): number {
  const expense = nz(input.itemized?.investmentInterest);
  if (expense <= 0) return 0;
  const allowed = Math.min(expense, Math.max(0, rd(netInvestmentIncome)));
  if (expense > allowed) {
    diagnostics.push(`Form 4952: investment interest limited to net investment income; ${expense - allowed} carries forward to 2026`);
  }
  return allowed;
}

// ------------------------------------------------------------- Schedule AI

/**
 * Form 2210 Schedule AI: per-period required installments from annualized
 * income. Periods end 3/31, 5/31, 8/31, 11/30 with factors 4 / 2.4 / 1.5 /
 * 1.0909 and cumulative applicable percentages 22.5 / 45 / 67.5 / 90%.
 * Each installment = required_i − required_(i−1); returns the four installments.
 */
export function scheduleAI(
  input: TaxInput,
  stdDeduction: number,
  seTaxTotal: number,
  figureTax: (ti: number, s: FilingStatus) => number,
  diagnostics: string[],
): number[] | null {
  const ai = input.underpayment?.scheduleAI;
  if (!ai || ai.agiByPeriod.length !== 4) {
    if (ai) diagnostics.push("Schedule AI needs cumulative AGI for all four periods (3/31, 5/31, 8/31, 11/30)");
    return null;
  }
  const status = input.filingStatus;
  const required: number[] = [];
  for (let i = 0; i < 4; i++) {
    const factor = T.SCHEDULE_AI.annualizationFactors[i];
    const annualizedAgi = rd(nz(ai.agiByPeriod[i]) * factor);
    const deduction = ai.itemizedByPeriod
      ? Math.max(rd(nz(ai.itemizedByPeriod[i]) * factor), stdDeduction)
      : stdDeduction;
    const annualizedTi = clamp0(annualizedAgi - deduction);
    const annualizedSeTax = ai.seTaxByPeriod ? rd(nz(ai.seTaxByPeriod[i]) * factor) : rd(seTaxTotal * factor * (i + 1) / 4);
    const annualizedTax = rd(figureTax(annualizedTi, status)) + annualizedSeTax;
    required.push(rd(annualizedTax * T.SCHEDULE_AI.applicablePct[i]));
  }
  // Installment_i = required_i − sum of prior required installments (line 25 col math).
  const installments = required.map((r, i) => clamp0(r - required.slice(0, i).reduce((a, b) => a + b, 0)));
  diagnostics.push("Form 2210 Schedule AI applied: annualized-income installments used where smaller than the regular method");
  return installments;
}

// -------------------------------------------------------------- Minnesota

function stateBracketTax(ti: number, bk: Array<[number, number]>): number {
  if (ti <= 0) return 0;
  let tax = 0;
  for (let i = 0; i < bk.length; i++) {
    const [floor, rate] = bk[i];
    if (ti <= floor) break;
    const next = i + 1 < bk.length ? bk[i + 1][0] : Infinity;
    tax += (Math.min(ti, next) - floor) * rate;
  }
  return tax;
}

/** MN Social Security subtraction — greater of alternative vs simplified method. */
export function mnSsSubtraction(input: TaxInput, agi: number, taxableSs: number): number {
  if (taxableSs <= 0) return 0;
  const status = input.filingStatus;
  const S = T.MN_SS;
  const divisor = S.stepDivisor(status);
  const full = S.fullThreshold[status];
  if (agi <= full) return taxableSs;
  // Alternative method: taxable SS reduced 10% per step over the full threshold.
  const altSteps = Math.min(10, Math.ceil(clamp0(agi - full) / divisor));
  const alternative = clamp0(taxableSs - altSteps * 0.1 * taxableSs);
  // Simplified method: statutory max reduced 10% per step over its own threshold.
  const maxSub = Math.min(taxableSs, S.simplifiedMax[status]);
  const simpSteps = Math.min(10, Math.ceil(clamp0(agi - S.simplifiedPhaseStart[status]) / divisor));
  const simplified = clamp0(maxSub - simpSteps * 0.1 * S.simplifiedMax[status]);
  return rd(Math.max(alternative, simplified));
}

export interface MnResult {
  agi: number;
  ssSubtraction: number;
  deduction: number;
  exemptions: number;
  taxableIncome: number;
  taxBeforeRatio: number;
  nrRatio: number;
  tax: number;
  wfcCredit: number;
  ctcCredit: number;
  withholding: number;
  refund: number;
  owed: number;
}

export function mnReturn(
  input: TaxInput,
  federalAgi: number,
  federalItemized: number,
  taxableSs: number,
  wagesAndSeEarned: number,
  diagnostics: string[],
): MnResult {
  const mn = input.mn ?? {};
  const status = input.filingStatus;
  const P = T.MN.deductionPhaseout;
  const threshold = status === "mfs" ? P.thresholdMfs : P.threshold;

  // Schedule M1M line 12 — computed SS subtraction.
  const ssSub = mnSsSubtraction(input, federalAgi, taxableSs);
  const mnAgi = federalAgi + nz(mn.additions) - nz(mn.subtractions) - ssSub;
  const rawDed = Math.max(T.MN.standardDeduction[status], nz(mn.itemizedTotal) || federalItemized);
  const reduction = Math.min(
    P.maxReduction * rawDed,
    P.rate * clamp0(mnAgi - threshold),
  );
  const deduction = rd(rawDed - reduction);
  const exemptions = T.MN.dependentExemption * (input.dependents?.length ?? 0);
  const mnTi = clamp0(mnAgi - deduction - exemptions);
  const taxBeforeRatio = rd(stateBracketTax(mnTi, T.MN.brackets[status]));

  // Schedule M1NR: nonresident/part-year tax = resident tax × MN-source ratio.
  let nrRatio = 1;
  let tax = taxBeforeRatio;
  if (mn.resident === false) {
    nrRatio = mnAgi > 0 ? clamp0(nz(mn.mnSourceIncome) / mnAgi) : 0;
    tax = rd(taxBeforeRatio * nrRatio);
    diagnostics.push(`Schedule M1NR applied: MN-source ratio ${(nrRatio * 100).toFixed(1)}%`);
  }

  // Schedule M1CWFC — Working Family Credit + MN Child Tax Credit (refundable).
  const W = T.MN_WFC;
  const earned = nz(mn.wfcEarnedIncome) || wagesAndSeEarned;
  const olderKids = Math.min(3, nz(mn.wfcOlderChildren));
  const youngKids = nz(mn.ctcQualifyingChildren) || (input.dependents?.filter((dd) => dd.qualifyingChildForCtc && dd.under17).length ?? 0);
  const wfcBase = W.rate * Math.min(earned, W.earnedIncomeCap) + W.olderChildAdd[olderKids];
  const ctcBase = youngKids * W.ctcPerChild;
  const phaseStart = status === "mfj" || status === "qss" ? W.phaseStartMfj : W.phaseStartOther;
  const phaseRate = youngKids === 0 && olderKids > 0 ? W.phaseRateOlderOnly : W.phaseRate;
  const phaseIncome = Math.max(mnAgi, earned);
  const phasedTotal = clamp0(wfcBase + ctcBase - phaseRate * clamp0(phaseIncome - phaseStart));
  const totalCredits = rd(phasedTotal * nrRatio);
  const wfcCredit = Math.min(totalCredits, rd(wfcBase));
  const ctcCredit = clamp0(totalCredits - wfcCredit);
  if ((wfcBase + ctcBase) > 0 && phasedTotal === 0) diagnostics.push("MN WFC/CTC fully phased out at this income");

  const paid = nz(mn.withholding) + nz(mn.estimatedPayments);
  const refund = clamp0(paid + totalCredits - tax);
  const owed = clamp0(tax - paid - totalCredits);

  if (status === "mfs") diagnostics.push("M1 v1: verify MFS-specific MN credit/eligibility rules");
  return {
    agi: rd(mnAgi), ssSubtraction: ssSub, deduction, exemptions, taxableIncome: rd(mnTi),
    taxBeforeRatio, nrRatio, tax, wfcCredit, ctcCredit, withholding: paid,
    refund: rd(refund), owed: rd(owed),
  };
}

// -------------------------------------------------------------- California

export interface StateResult {
  agi: number;
  deduction: number;
  exemptionCredits: number;
  taxableIncome: number;
  tax: number;
  withholding: number;
  refund: number;
  owed: number;
}

export function caReturn(
  input: TaxInput,
  federalAgi: number,
  diagnostics: string[],
): StateResult {
  const ca = input.ca ?? {};
  const status = input.filingStatus;

  // CA does not tax Social Security benefits or conform to federal Sch 1-A
  // deductions/QBI — modeled via ca.subtractions/additions on Schedule CA.
  const caAgi = federalAgi + nz(ca.additions) - nz(ca.subtractions);
  const deduction = Math.max(T.CA.standardDeduction[status], nz(ca.itemizedTotal));
  const caTi = clamp0(caAgi - deduction);

  let tax = stateBracketTax(caTi, T.CA.brackets[status]);
  const mentalHealth = rd(T.CA.mentalHealthRate * clamp0(caTi - T.CA.mentalHealthThreshold));
  tax = rd(tax) + mentalHealth;

  const depCount = nz(ca.dependents) || (input.dependents?.length ?? 0);
  const seniorCount = nz(ca.seniors65) ||
    (input.taxpayer.senior65Plus ? 1 : 0) + (input.spouse?.senior65Plus ? 1 : 0);
  const exemptionCredits =
    T.CA.personalExemptionCredit[status] +
    T.CA.seniorExemptionCredit * seniorCount +
    T.CA.dependentExemptionCredit * depCount;
  const taxAfter = clamp0(tax - exemptionCredits);

  if (nz(input.socialSecurityBenefits) > 0 && !nz(ca.subtractions)) {
    diagnostics.push("540 v1: pass CA subtractions for SS benefits (CA doesn't tax SS — subtract 1040.6b via ca.subtractions)");
  }
  diagnostics.push("540 v1: CA nonconformity (no Sch 1-A tips/overtime/senior deductions, no QBI, HSA taxable) handled via ca.additions/subtractions");
  if (caAgi > 250000) diagnostics.push("540 v1: CA exemption-credit phaseout for high AGI not modeled");

  const paid = nz(ca.withholding) + nz(ca.estimatedPayments);
  return {
    agi: rd(caAgi), deduction: rd(deduction), exemptionCredits: rd(exemptionCredits),
    taxableIncome: rd(caTi), tax: rd(taxAfter), withholding: paid,
    refund: rd(clamp0(paid - taxAfter)), owed: rd(clamp0(taxAfter - paid)),
  };
}

// ---------------------------------------------------------------- New York

export function nyReturn(
  input: TaxInput,
  federalAgi: number,
  diagnostics: string[],
): StateResult {
  const ny = input.ny ?? {};
  const status = input.filingStatus;

  const nyAgi = federalAgi + nz(ny.additions) - nz(ny.subtractions);
  let stdDed = T.NY.standardDeduction[status];
  if (input.claimedAsDependent && status === "single") stdDed = T.NY.singleDependentStdDed;
  const deduction = Math.max(stdDed, nz(ny.itemizedTotal));
  const depExemptions = T.NY.dependentExemption * (nz(ny.dependents) || (input.dependents?.length ?? 0));
  const nyTi = clamp0(nyAgi - deduction - depExemptions);
  const tax = rd(stateBracketTax(nyTi, T.NY.brackets[status]));

  if (nyAgi > T.NY.supplementalAgiThreshold) {
    diagnostics.push("IT-201: NY AGI > $107,650 — supplemental benefit-recapture tax not modeled; computed tax may be understated");
  }
  if (ny.nycResident) diagnostics.push("IT-201 v1: NYC resident tax (IT-201 lines 47+) not computed");

  const paid = nz(ny.withholding) + nz(ny.estimatedPayments);
  return {
    agi: rd(nyAgi), deduction: rd(deduction), exemptionCredits: depExemptions,
    taxableIncome: rd(nyTi), tax, withholding: paid,
    refund: rd(clamp0(paid - tax)), owed: rd(clamp0(tax - paid)),
  };
}
