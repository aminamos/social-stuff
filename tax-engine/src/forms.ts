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
    const paid = nz(whQ[q]) + nz(estQ[q]) + Math.max(0, balance);
    const under = Math.max(0, quarterly - paid);
    balance = paid - quarterly;
    penalty += (under * T.F2210.annualRate * T.F2210.accrualDays[q]) / 365;
  }
  const p = rd(penalty);
  if (p > 0) diagnostics.push("Form 2210 penalty uses the standard quarterly method; Schedule AI (annualized income) may reduce it");
  return p;
}

// -------------------------------------------------------------- Minnesota

export interface MnResult {
  agi: number;
  deduction: number;
  exemptions: number;
  taxableIncome: number;
  tax: number;
  withholding: number;
  refund: number;
  owed: number;
}

function mnBracketTax(ti: number, status: FilingStatus): number {
  if (ti <= 0) return 0;
  const bk = T.MN.brackets[status];
  let tax = 0;
  for (let i = 0; i < bk.length; i++) {
    const [floor, rate] = bk[i];
    if (ti <= floor) break;
    const next = i + 1 < bk.length ? bk[i + 1][0] : Infinity;
    tax += (Math.min(ti, next) - floor) * rate;
  }
  return tax;
}

export function mnReturn(
  input: TaxInput,
  federalAgi: number,
  federalItemized: number,
  diagnostics: string[],
): MnResult {
  const mn = input.mn ?? {};
  const status = input.filingStatus;
  const P = T.MN.deductionPhaseout;
  const threshold = status === "mfs" ? P.thresholdMfs : P.threshold;

  const mnAgi = federalAgi + nz(mn.additions) - nz(mn.subtractions);
  const rawDed = Math.max(T.MN.standardDeduction[status], nz(mn.itemizedTotal) || federalItemized);
  const reduction = Math.min(
    P.maxReduction * rawDed,
    P.rate * clamp0(mnAgi - threshold),
  );
  const deduction = rd(rawDed - reduction);
  const exemptions = T.MN.dependentExemption * (input.dependents?.length ?? 0);
  const mnTi = clamp0(mnAgi - deduction - exemptions);
  const tax = rd(mnBracketTax(mnTi, status));
  const paid = nz(mn.withholding) + nz(mn.estimatedPayments);
  const refund = clamp0(paid - tax);
  const owed = clamp0(tax - paid);

  if (mn.resident === false) diagnostics.push("M1 v1 assumes full-year MN residency; part-year/nonresident needs Schedule M1NR");
  if (nz(input.socialSecurityBenefits) > 0) diagnostics.push("M1 v1: MN Social Security subtraction not computed — pass it via mn.subtractions");
  return { agi: rd(mnAgi), deduction, exemptions, taxableIncome: rd(mnTi), tax, withholding: paid, refund: rd(refund), owed: rd(owed) };
}
