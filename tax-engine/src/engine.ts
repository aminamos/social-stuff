/**
 * TY2025 federal individual income tax engine (Form 1040 + Schedules).
 *
 * Deterministic, whole-dollar math following IRS line ordering. See README.md
 * for scope, simplifications, and sources. Everything exported here is pure.
 */

import * as T from "./tables2025.js";
import type { FilingStatus, TaxInput, TaxResult } from "./types.js";

/** IRS whole-dollar convention: .50 rounds up. */
const rd = (n: number): number => (n < 0 ? -Math.round(-n) : Math.round(n));
const nz = (n?: number): number => n ?? 0;
const clamp0 = (n: number): number => Math.max(0, n);

// ---------------------------------------------------------------- brackets

export function bracketTax(ti: number, status: FilingStatus): number {
  if (ti <= 0) return 0;
  const bk = T.BRACKETS[status];
  let tax = 0;
  for (let i = 0; i < bk.length; i++) {
    const [floor, rate] = bk[i];
    if (ti <= floor) break;
    const next = i + 1 < bk.length ? bk[i + 1][0] : Infinity;
    tax += (Math.min(ti, next) - floor) * rate;
  }
  return tax;
}

/** 2025 Tax Table (Pub. 1040): tax at the midpoint of each $25/$50 cell. */
export function taxTable(ti: number, status: FilingStatus): number {
  if (ti <= 0) return 0;
  if (ti >= T.TAX_TABLE_MAX) return rd(bracketTax(ti, status));
  let mid: number;
  if (ti < 5) return 0;
  else if (ti < 15) mid = 10;
  else if (ti < 25) mid = 20;
  else if (ti < 3000) mid = 25 + Math.floor((ti - 25) / 25) * 25 + 12.5;
  else mid = 3000 + Math.floor((ti - 3000) / 50) * 50 + 25;
  return rd(bracketTax(mid, status));
}

/** Tax on line 16: Tax Table under $100k, Tax Computation Worksheet at/over. */
export function figureTax(ti: number, status: FilingStatus): number {
  return ti < T.TAX_TABLE_MAX ? taxTable(ti, status) : rd(bracketTax(ti, status));
}

// ----------------------------------------------------- Social Security (§86)

function ssTaxable(ssTotal: number, provisional: number, status: FilingStatus, mfsLivedWithSpouse: boolean): number {
  if (ssTotal <= 0) return 0;
  if (status === "mfs" && mfsLivedWithSpouse) return rd(0.85 * ssTotal);
  const joint = status === "mfj";
  const b1 = joint ? T.SS_BASE_LOW.joint : T.SS_BASE_LOW.other;
  const b2 = joint ? T.SS_BASE_HIGH.joint : T.SS_BASE_HIGH.other;
  const tier1 = Math.min(0.5 * ssTotal, 0.5 * clamp0(provisional - b1));
  const taxable = Math.min(0.85 * ssTotal, tier1 + 0.85 * clamp0(provisional - b2));
  return rd(clamp0(taxable));
}

// -------------------------------------------------------------------- IRA

interface IraCtx {
  status: FilingStatus;
  covered: boolean;
  spouseCovered: boolean;
  contributions: number;
  earnedIncome: number;
  age50Plus: boolean;
  mfsLivedWithSpouse: boolean;
}

function iraDeduction(ctx: IraCtx, magi: number): number {
  const c = Math.min(ctx.contributions, ctx.earnedIncome);
  if (c <= 0) return 0;
  const limit = ctx.age50Plus ? T.IRA.limit + T.IRA.catchUp : T.IRA.limit;
  let tentative = Math.min(c, limit);
  let band: readonly [number, number] | undefined;
  if (ctx.status === "mfs" && ctx.mfsLivedWithSpouse) {
    if (ctx.covered || ctx.spouseCovered) band = T.IRA.phaseoutMfs;
  } else if (ctx.status === "mfj" || ctx.status === "qss") {
    if (ctx.covered) band = T.IRA.phaseoutCoveredJoint;
    else if (ctx.spouseCovered) band = T.IRA.phaseoutSpouseCoveredJoint;
  } else {
    if (ctx.covered) band = T.IRA.phaseoutCoveredOther;
  }
  if (!band) return rd(tentative);
  const [lo, hi] = band;
  if (magi >= hi) return 0;
  if (magi <= lo) return rd(tentative);
  // Pub 590-A worksheet: reduced limit rounded up to nearest $10, floor $200.
  const reduced = tentative * (1 - (magi - lo) / (hi - lo));
  const rounded = Math.ceil(reduced / 10) * 10;
  return rd(Math.min(tentative, Math.max(200, rounded)));
}

// --------------------------------------------------------------- student loan

function sliDeduction(paid: number, magi: number, status: FilingStatus): number {
  if (paid <= 0) return 0;
  if (status === "mfs") return 0;
  const [lo, hi] = status === "mfj" || status === "qss" ? T.SLI.phaseoutJoint : T.SLI.phaseoutOther;
  const base = Math.min(paid, T.SLI.max);
  if (magi <= lo) return base;
  if (magi >= hi) return 0;
  // SLI worksheet: allowed amount phased ratably, rounded up to nearest $10.
  const allowed = base * (1 - (magi - lo) / (hi - lo));
  return Math.ceil(allowed / 10) * 10;
}

// -------------------------------------------------------------- Schedule 1-A

interface Sched1A {
  tips: number;
  overtime: number;
  carLoan: number;
  senior: number;
  total: number;
}

function sched1A(input: TaxInput, magi: number): Sched1A {
  const isMfs = input.filingStatus === "mfs";
  const isMfj = input.filingStatus === "mfj";
  const res: Sched1A = { tips: 0, overtime: 0, carLoan: 0, senior: 0, total: 0 };
  if (isMfs) return res;
  const P = T.SCHED_1A;

  const phase = (amount: number, cap: number, capJoint: number, threshold: number, thresholdJoint: number, rounding: "floor100" | "ceil200"): number => {
    const capAmt = Math.min(amount, isMfj ? capJoint : cap);
    const excess = magi - (isMfj ? thresholdJoint : threshold);
    if (excess <= 0) return capAmt;
    const reduction = rounding === "floor100"
      ? Math.floor(excess / 1000) * 100
      : Math.ceil(excess / 1000) * 200;
    return clamp0(capAmt - reduction);
  };

  res.tips = phase(nz(input.qualifiedTips), P.tips.cap, P.tips.capJoint, P.tips.threshold, P.tips.thresholdJoint, "floor100");
  res.overtime = phase(nz(input.qualifiedOvertime), P.overtime.cap, P.overtime.capJoint, P.overtime.threshold, P.overtime.thresholdJoint, "floor100");
  res.carLoan = phase(nz(input.carLoanInterest), P.carLoan.cap, P.carLoan.capJoint, P.carLoan.threshold, P.carLoan.thresholdJoint, "ceil200");

  const seniorBase = clamp0(P.senior.perPerson - 0.06 * clamp0(magi - (isMfj ? P.senior.thresholdJoint : P.senior.threshold)));
  const seniorCount = (input.taxpayer.senior65Plus ? 1 : 0) + (isMfj && input.spouse?.senior65Plus ? 1 : 0);
  res.senior = rd(seniorBase) * seniorCount;
  res.total = res.tips + res.overtime + res.carLoan + res.senior;
  return res;
}

// --------------------------------------------------------------------- QBI

function qbiDeduction(input: TaxInput, tiBeforeQbi: number, netCapGainQbi: number, diagnostics: string[]): number {
  const q = input.qbi;
  if (!q) return 0;
  const isMfj = input.filingStatus === "mfj";
  const threshold = isMfj ? T.QBI.thresholdJoint : T.QBI.thresholdOther;
  const range = isMfj ? T.QBI.phaseRangeJoint : T.QBI.phaseRangeOther;
  const qbiNet = nz(q.qualifiedBusinessIncome);
  const reitPtp = nz(q.qualifiedReitDividends) + nz(q.ptpIncome);

  if (qbiNet < 0) {
    diagnostics.push("negative QBI carries forward to 2026 (not netted against other income)");
  }

  let businessDed = 0;
  if (qbiNet > 0) {
    const w2 = nz(q.w2WagesFromBusiness);
    const ubia = nz(q.ubia);
    if (tiBeforeQbi <= threshold) {
      businessDed = T.QBI.rate * qbiNet;
    } else if (tiBeforeQbi < threshold + range) {
      const excessRatio = (tiBeforeQbi - threshold) / range;
      if (q.sstb) {
        const app = 1 - excessRatio;
        const adjQbi = qbiNet * app;
        const adjW2 = w2 * app;
        const adjUbia = ubia * app;
        const limit = Math.max(0.5 * adjW2, 0.25 * adjW2 + 0.025 * adjUbia);
        businessDed = Math.min(T.QBI.rate * adjQbi, limit);
      } else {
        const tentative = T.QBI.rate * qbiNet;
        const limit = Math.max(0.5 * w2, 0.25 * w2 + 0.025 * ubia);
        businessDed = tentative - (tentative - Math.min(tentative, limit)) * excessRatio;
      }
    } else {
      if (q.sstb) {
        businessDed = 0;
      } else {
        const limit = Math.max(0.5 * w2, 0.25 * w2 + 0.025 * ubia);
        businessDed = Math.min(T.QBI.rate * qbiNet, limit);
      }
    }
  }

  const combined = businessDed + T.QBI.rate * reitPtp;
  const overall = T.QBI.rate * clamp0(tiBeforeQbi - netCapGainQbi);
  return rd(Math.min(combined, overall));
}

// --------------------------------------------------------------------- CTC

interface CtcResult {
  nonrefundable: number;
  actc: number;
}

function ctc(input: TaxInput, agi: number, creditLimitBase: number, earnedIncome: number): CtcResult {
  const deps = input.dependents ?? [];
  const qc = deps.filter((d) => d.qualifyingChildForCtc && d.under17).length;
  const od = deps.length - qc;
  if (qc + od === 0 || input.claimedAsDependent) return { nonrefundable: 0, actc: 0 };

  const tentative = qc * T.CTC.perChild + od * T.CTC.perOtherDependent;
  const magi = agi + nz(input.excludedForeignIncome);
  const threshold = input.filingStatus === "mfj" ? T.CTC.phaseoutJoint : T.CTC.phaseoutOther;
  const excess = magi - threshold;
  const phased = excess <= 0 ? tentative : clamp0(tentative - Math.ceil(excess / 1000) * T.CTC.reductionPer1000);

  const nonrefundable = Math.min(phased, creditLimitBase);
  const remaining = phased - nonrefundable;
  const earnedCap = qc * T.CTC.actcMaxPerChild;
  const actc = Math.min(remaining, earnedCap, clamp0(0.15 * (earnedIncome - T.CTC.actcEarnedThreshold)));
  return { nonrefundable: rd(nonrefundable), actc: rd(clamp0(actc)) };
}

// -------------------------------------------------------------------- EITC

function eitcCellMid(v: number): number {
  if (v < 1) return 0;
  if (v < 50) return 25.5;
  return Math.floor(v / 50) * 50 + 25;
}

function eitcAtAmount(v: number, params: T.EitcParams, phaseoutStart: number): number {
  if (v <= 0) return 0;
  const plateau = params.creditRate * Math.min(v, params.earnedIncomeAmount);
  const reduction = params.phaseoutRate * clamp0(v - phaseoutStart);
  return rd(clamp0(plateau - reduction));
}

// ------------------------------------------------------------------ engine

export function compute(input: TaxInput): TaxResult {
  const L: Record<string, number> = {};
  const d: string[] = [];
  const status = input.filingStatus;
  const isMfj = status === "mfj";
  const isMfs = status === "mfs";

  d.push("AMT (Form 6251) not computed; verify separately for high-income returns");

  // ---- income ----
  const wages = nz(input.wages);
  const hhWages = nz(input.householdEmployeeWages);
  const line1 = wages + hhWages;
  L["1040.1a"] = wages;
  if (hhWages) L["1040.1b"] = hhWages;

  // capital summary (simplified Schedule D netting)
  const cap = input.capital ?? {};
  const stNet = nz(cap.shortTermNet) - nz(cap.shortTermCarryover);
  const ltNet = nz(cap.longTermNet) - nz(cap.longTermCarryover);
  const capTotal = stNet + ltNet;
  const capLossLimit = isMfs ? T.CAPITAL_LOSS_LIMIT.mfs : T.CAPITAL_LOSS_LIMIT.default;
  let preferentialGain = 0;
  let line7 = capTotal;
  if (cap.unrecaptured1250Gain || cap.collectiblesGain) {
    d.push("unrecaptured §1250 / 28% collectibles gain present: Schedule D Tax Worksheet not implemented; taxed via QDCGT worksheet (approximation)");
  }
  if (capTotal > 0) {
    preferentialGain = Math.max(0, Math.min(ltNet, capTotal));
  } else {
    line7 = Math.max(capTotal, -capLossLimit);
    if (capTotal < -capLossLimit) {
      const used = Math.min(-capTotal, capLossLimit);
      let stCarry = Math.min(0, stNet + Math.max(0, ltNet));
      let ltCarry = Math.min(0, ltNet + Math.min(0, stNet));
      const stAbsorb = Math.min(used, -stCarry);
      stCarry += stAbsorb;
      ltCarry = Math.min(0, ltCarry + (used - stAbsorb));
      d.push(`capital loss carryover to 2026: short-term ${-stCarry}, long-term ${-ltCarry}`);
    }
  }
  L["1040.7"] = line7;

  // Schedule 1 part I
  const sch1Income =
    nz(input.taxableStateRefunds) + nz(input.alimonyReceived) + nz(input.businessIncome) +
    nz(input.otherGains) + nz(input.rentalRoyaltyPartnership) + nz(input.farmIncome) +
    nz(input.unemploymentCompensation) + nz(input.otherIncome);
  L["sch1.10"] = sch1Income;
  L["1040.8"] = sch1Income;

  const incomeExclSS =
    line1 + nz(input.taxableInterest) + nz(input.ordinaryDividends) +
    nz(input.iraDistributions) + nz(input.pensions) + line7 + sch1Income;

  // ---- self-employment tax (needed for adjustments) ----
  const seIncome = input.selfEmploymentIncome ?? nz(input.businessIncome);
  const seNet = rd(clamp0(seIncome) * T.SE_NET_FACTOR);
  let seTax = 0;
  if (seNet >= T.SE_MIN_EARNINGS) {
    const ssWages = Math.min(nz(input.socialSecurityWages) || wages, T.SS_WAGE_BASE);
    const ssBase = Math.min(seNet, clamp0(T.SS_WAGE_BASE - ssWages));
    seTax = rd(ssBase * T.SE_SS_RATE + seNet * T.SE_MEDICARE_RATE);
  }
  const seDeduction = rd(seTax / 2);
  L["sch2.4"] = seTax;

  // ---- fixed adjustments (excludes IRA & SLI, which phase on MAGI) ----
  const adj = input.adjustments ?? {};
  const educatorCap = isMfj ? 600 : 300;
  const adjustmentsFixed =
    Math.min(nz(adj.educatorExpenses), educatorCap) + nz(adj.reservistExpenses) +
    nz(adj.hsaDeduction) + nz(adj.movingExpensesArmedForces) + nz(adj.sepSimpleQualifiedPlans) +
    nz(adj.selfEmployedHealthInsurance) + nz(adj.earlyWithdrawalPenalty) + nz(adj.alimonyPaid) +
    nz(adj.archerMsa) + nz(adj.juryDutyPay) + nz(adj.other) + seDeduction;

  // ---- taxable Social Security: provisional income via two-pass IRA deduction ----
  // §86 modified AGI = AGI + tax-exempt interest + §§911/931/933 exclusions.
  // The SS benefits worksheet subtracts all Sch 1 adjustments except the student
  // loan interest deduction. The IRA deduction does reduce provisional income,
  // so it is resolved in two passes (differences only inside phaseout bands).
  const foreign = nz(input.excludedForeignIncome);
  const ssTotal = nz(input.socialSecurityBenefits);

  // Provisional income (§86(b)(2)): AGI determined without regard to §§86, 135,
  // 137, 199, 221 (student loan interest), 223 (HSA deduction), 911/931/933 —
  // i.e. all income except benefits, minus Sch 1 adjustments except the SLI and
  // HSA add-backs — plus tax-exempt interest and foreign/adoption exclusions,
  // plus 50% of benefits. The IRA deduction does reduce it.
  const provisional = (iraDed: number) =>
    incomeExclSS - (adjustmentsFixed - nz(adj.hsaDeduction) + iraDed) + nz(input.taxExemptInterest) + foreign + 0.5 * ssTotal;

  const tpEarned = wages + hhWages + seNet;
  // Spousal IRA rule: on a joint return either spouse's contribution is
  // limited by combined taxable compensation. For MFS the spouse's own
  // earned income isn't an input; tpEarned is used as the documented proxy.
  const iraFor = (person: "tp" | "sp", magi: number) => {
    const p = person === "tp" ? input.taxpayer : input.spouse;
    const other = person === "tp" ? input.spouse : input.taxpayer;
    return iraDeduction(
      {
        status,
        covered: !!p?.coveredByEmployerPlan,
        spouseCovered: !!other?.coveredByEmployerPlan,
        contributions: nz(p?.iraContributions),
        earnedIncome: tpEarned,
        age50Plus: !!p?.senior65Plus || (p?.ageAtEndOfYear ?? 0) >= 50,
        mfsLivedWithSpouse: !!input.mfsLivedWithSpouse,
      },
      magi,
    );
  };
  const iraBoth = (magi: number) => iraFor("tp", magi) + (isMfj || isMfs ? iraFor("sp", magi) : 0);

  // Pass 1: IRA deduction with provisional income before it.
  const ssTax1 = ssTaxable(ssTotal, provisional(0), status, !!input.mfsLivedWithSpouse);
  const agiBeforeIraSli = incomeExclSS + ssTax1 - adjustmentsFixed;
  const iraDed0 = iraBoth(agiBeforeIraSli + foreign);

  // SLI MAGI = AGI before the SLI deduction (which includes the IRA deduction),
  // plus foreign exclusions.
  const ssTaxIra = ssTaxable(ssTotal, provisional(iraDed0), status, !!input.mfsLivedWithSpouse);
  const agiBeforeSli = incomeExclSS + ssTaxIra - adjustmentsFixed - iraDed0;
  const sliDed = sliDeduction(nz(input.studentLoanInterestPaid), agiBeforeSli + foreign, status);
  if (input.studentLoanInterestPaid && isMfs) d.push("student loan interest deduction not allowed for MFS");

  // Pass 2: IRA modified AGI = AGI before the IRA deduction + SLI + foreign.
  // AGI-before-IRA = agiBeforeSli + iraDed0; the SLI add-back cancels, so the
  // refined MAGI is agiBeforeSli + iraDed0 + foreign. Then final taxable SS.
  const iraDed = iraBoth(agiBeforeSli + iraDed0 + foreign);
  const taxableSS = ssTaxable(ssTotal, provisional(iraDed), status, !!input.mfsLivedWithSpouse);
  L["1040.6b"] = taxableSS;

  const adjustmentsTotal = adjustmentsFixed + iraDed + sliDed;
  L["sch1.20"] = sliDed;
  L["sch1.19"] = iraDed;
  L["sch1.26"] = adjustmentsTotal;
  L["1040.10"] = adjustmentsTotal;

  const totalIncome = incomeExclSS + taxableSS;
  L["1040.9"] = totalIncome;
  const agi = totalIncome - adjustmentsTotal;
  L["1040.11"] = agi;

  // ---- Schedule 1-A ----
  const magi1a = agi + foreign;
  const s1a = sched1A(input, magi1a);
  if (isMfs && (nz(input.qualifiedTips) || nz(input.qualifiedOvertime) || nz(input.carLoanInterest) || input.taxpayer.senior65Plus)) {
    d.push("Schedule 1-A deductions (tips/overtime/car loan/senior) require joint filing; MFS ineligible");
  }
  L["sched1A.13"] = s1a.tips;
  L["sched1A.21"] = s1a.overtime;
  L["sched1A.30"] = s1a.carLoan;
  L["sched1A.37"] = s1a.senior;
  L["sched1A.38"] = s1a.total;
  L["1040.13b"] = s1a.total;

  // ---- deduction: standard vs itemized ----
  const it = input.itemized ?? {};
  const medicalAllowed = clamp0(nz(it.medicalExpenses) - 0.075 * agi);
  const saltPaid = nz(it.stateLocalIncomeOrSalesTax) + nz(it.realEstateTax) + nz(it.personalPropertyTax);
  const saltCapBase = isMfs ? T.SALT.capMfs : T.SALT.cap;
  const saltFloor = isMfs ? T.SALT.floorMfs : T.SALT.floor;
  const saltThreshold = isMfs ? T.SALT.thresholdMfs : T.SALT.threshold;
  const saltMagi = agi + foreign;
  const saltCap = Math.max(saltFloor, saltCapBase - T.SALT.rate * clamp0(saltMagi - saltThreshold));
  const saltAllowed = Math.min(saltPaid, saltCap);
  const charityAllowed = Math.min(nz(it.charitableGifts), 0.6 * clamp0(agi)) + Math.min(nz(it.charitableGiftsLimited), 0.3 * clamp0(agi));
  const gamblingAllowed = Math.min(nz(it.gamblingLosses), input.gamblingWinnings ?? nz(it.gamblingLosses));
  const itemizedTotal = rd(
    medicalAllowed + saltAllowed + nz(it.homeMortgageInterest) + nz(it.investmentInterest) +
    charityAllowed + nz(it.casualtyLoss) + gamblingAllowed + nz(it.otherItemized),
  );
  L["schA.17"] = itemizedTotal;

  const earnedIncomeForDep = wages + hhWages + seNet;
  const agedBlind = (p65?: boolean, blind?: boolean) => (p65 ? 1 : 0) + (blind ? 1 : 0);
  const marriedLike = isMfj || isMfs || status === "qss";
  const addonAmt = marriedLike ? T.AGED_BLIND_ADDON.married : T.AGED_BLIND_ADDON.unmarried;
  const addonCount = agedBlind(input.taxpayer.senior65Plus, input.taxpayer.blind) +
    (marriedLike ? agedBlind(input.spouse?.senior65Plus, input.spouse?.blind) : 0);
  let stdDed = T.STANDARD_DEDUCTION[status];
  if (input.claimedAsDependent) {
    stdDed = Math.min(stdDed, Math.max(T.DEPENDENT_STD_DED.floor, earnedIncomeForDep + T.DEPENDENT_STD_DED.earnedOffset));
  }
  stdDed += addonAmt * addonCount;

  const deduction = input.forceItemized ? itemizedTotal : Math.max(stdDed, itemizedTotal);
  L["1040.12"] = deduction;
  if (itemizedTotal > stdDed || input.forceItemized) d.push(`itemized deductions used (${itemizedTotal} vs standard ${stdDed})`);

  // ---- QBI ----
  const tiBeforeQbi = clamp0(agi - deduction - s1a.total);
  const netCapGainQbi = preferentialGain + nz(input.qualifiedDividends);
  const qbiDed = qbiDeduction(input, tiBeforeQbi, netCapGainQbi, d);
  L["1040.13a"] = qbiDed;

  // ---- taxable income ----
  const ti = clamp0(agi - deduction - qbiDed - s1a.total);
  L["1040.15"] = ti;

  // ---- tax ----
  const qd = nz(input.qualifiedDividends);
  let tax: number;
  if (preferentialGain + qd > 0 && ti > 0) {
    // Qualified Dividends and Capital Gain Tax Worksheet.
    const prefTotal = Math.min(ti, preferentialGain + qd);
    const ordinaryTi = ti - prefTotal;
    const bp0 = T.CG_ZERO_PCT_TOP[status];
    const bp15 = T.CG_FIFTEEN_PCT_TOP[status];
    const zeroAmt = clamp0(Math.min(prefTotal, bp0 - ordinaryTi));
    const fifteenAmt = clamp0(Math.min(prefTotal - zeroAmt, bp15 - ordinaryTi - zeroAmt));
    const twentyAmt = prefTotal - zeroAmt - fifteenAmt;
    const withPref = figureTax(ordinaryTi, status) + rd(fifteenAmt * 0.15) + rd(twentyAmt * 0.2);
    tax = Math.min(withPref, figureTax(ti, status));
  } else {
    tax = figureTax(ti, status);
  }
  L["1040.16"] = tax;

  // ---- credits ----
  const sch2line3 = 0; // AMT / excess APTC not modeled
  L["sch2.3"] = sch2line3;
  const line18 = tax + sch2line3;
  L["1040.18"] = line18;

  const seEarnedForEic = seNet - seDeduction - nz(adj.sepSimpleQualifiedPlans) - nz(adj.selfEmployedHealthInsurance);
  const eicEarned = wages + hhWages + Math.max(0, seEarnedForEic) + nz(input.nontaxableCombatPay);

  // CTC / ACTC (Schedule 8812)
  const ctcLimitBase = clamp0(line18 - nz(input.foreignTaxCredit) - nz(input.educationCredits));
  const ctcRes = ctc(input, agi, ctcLimitBase, eicEarned);
  L["1040.19"] = ctcRes.nonrefundable;

  // Schedule 3 nonrefundable credits
  const careCap = (input.dependentCare?.qualifyingPersons ?? 0) === 2 ? T.DEPENDENT_CARE.expenseLimitTwo : T.DEPENDENT_CARE.expenseLimitOne;
  let careCredit = 0;
  if (input.dependentCare && input.dependentCare.expenses > 0) {
    const taxpayerEi = wages + hhWages + Math.max(0, seEarnedForEic);
    const spouseEi = input.dependentCare.spouseEarnedIncome ?? Infinity;
    const capped = Math.min(input.dependentCare.expenses, careCap, taxpayerEi, isMfj ? spouseEi : Infinity);
    const pct = Math.max(T.DEPENDENT_CARE.minRate, T.DEPENDENT_CARE.topRate - Math.floor(clamp0(agi - T.DEPENDENT_CARE.agiFloor) / T.DEPENDENT_CARE.rateStepPer) * 0.01);
    careCredit = rd(capped * pct);
  }

  let saversCredit = 0;
  {
    const tiers = isMfj ? T.SAVERS.tiers.mfj : status === "hoh" ? T.SAVERS.tiers.hoh : T.SAVERS.tiers.other;
    const rate = agi <= tiers[0] ? 0.5 : agi <= tiers[1] ? 0.2 : agi <= tiers[2] ? 0.1 : 0;
    if (!input.claimedAsDependent && rate > 0) {
      const tp = Math.min(nz(input.taxpayer.saverCreditContributions), T.SAVERS.maxContributionPerPerson);
      const sp = isMfj ? Math.min(nz(input.spouse?.saverCreditContributions), T.SAVERS.maxContributionPerPerson) : 0;
      saversCredit = rd(rate * (tp + sp));
    }
  }

  const sch3 = nz(input.foreignTaxCredit) + careCredit + nz(input.educationCredits) + saversCredit + nz(input.otherNonrefundableCredits);
  L["sch3.8"] = sch3;
  L["1040.20"] = sch3;
  const line22 = clamp0(line18 - ctcRes.nonrefundable - sch3);
  L["1040.22"] = line22;

  // ---- other taxes (Schedule 2) ----
  const medicareWages = input.medicareWages ?? wages;
  const addlMedicare = rd(clamp0(medicareWages + seNet - T.ADDL_MEDICARE_THRESHOLD[status]) * T.ADDL_MEDICARE_RATE);
  const nii = input.netInvestmentIncome ??
    (nz(input.taxableInterest) + nz(input.ordinaryDividends) + Math.max(0, capTotal) + Math.max(0, nz(input.rentalRoyaltyPartnership)));
  const niit = rd(Math.min(nii, clamp0(agi + foreign - T.NIIT_THRESHOLD[status])) * T.NIIT_RATE);
  const sch2 = seTax + addlMedicare + niit + nz(input.householdEmploymentTax) +
    nz(input.earlyDistributionPenalty) + nz(input.additionalHsaTax) + nz(input.otherTaxes);
  L["sch2.9"] = addlMedicare;
  L["sch2.12"] = niit;
  L["sch2.21"] = sch2;
  L["1040.23"] = sch2;
  const totalTax = line22 + sch2;
  L["1040.24"] = totalTax;

  // ---- payments ----
  // EITC (Pub 596 / EIC Table midpoint approximation)
  let eitc = 0;
  const eitcKids = Math.min(3, (input.dependents ?? []).filter((dep) => dep.eitcQualifyingChild).length) as 0 | 1 | 2 | 3;
  const investmentIncome = input.eitcInvestmentIncome ??
    (nz(input.taxableInterest) + nz(input.taxExemptInterest) + nz(input.ordinaryDividends) +
      Math.max(0, capTotal) + Math.max(0, nz(input.rentalRoyaltyPartnership)));
  const eitcAgeOk = eitcKids > 0 ||
    ((input.taxpayer.ageAtEndOfYear ?? -1) >= T.EITC_NO_CHILD_MIN_AGE && (input.taxpayer.ageAtEndOfYear ?? 99) <= T.EITC_NO_CHILD_MAX_AGE) ||
    (isMfj && (input.spouse?.ageAtEndOfYear ?? -1) >= T.EITC_NO_CHILD_MIN_AGE && (input.spouse?.ageAtEndOfYear ?? 99) <= T.EITC_NO_CHILD_MAX_AGE);
  const mfsBlocked = isMfs && !input.mfsLivedApartLast6Months;
  if (input.eitcIneligible || input.claimedAsDependent || mfsBlocked) {
    if (mfsBlocked) d.push("EITC not allowed for MFS unless lived apart last 6 months of year");
  } else if (investmentIncome > T.EITC_INVESTMENT_LIMIT) {
    d.push(`EITC disallowed: investment income ${investmentIncome} exceeds ${T.EITC_INVESTMENT_LIMIT}`);
  } else if (!eitcAgeOk) {
    d.push("EITC with no qualifying children requires a spouse aged 25-64");
  } else {
    const p = T.EITC[eitcKids];
    const start = isMfj ? p.phaseoutStartMfj : p.phaseoutStartOther;
    eitc = Math.min(eitcAtAmount(eitcCellMid(eicEarned), p, start), eitcAtAmount(eitcCellMid(agi), p, start));
  }
  L["1040.27"] = eitc;
  L["1040.28"] = ctcRes.actc;

  const payments =
    nz(input.federalWithholding) + nz(input.estimatedTaxPayments) + nz(input.extensionPayment) +
    nz(input.excessSocialSecurity) + nz(input.otherRefundablePayments) + eitc + ctcRes.actc;
  L["1040.25d"] = nz(input.federalWithholding);
  L["1040.26"] = nz(input.estimatedTaxPayments) + nz(input.extensionPayment);
  L["1040.33"] = payments;

  const refund = clamp0(payments - totalTax);
  const amountOwed = clamp0(totalTax - payments);
  L["1040.34"] = refund;
  L["1040.37"] = amountOwed;

  if (input.claimedAsDependent && eitcKids > 0) d.push("dependent filer cannot claim dependents");
  if (input.dependents?.length && (status === "mfs")) d.push("verify MFS dependent/credit rules for your situation");

  return { lines: L, refund: rd(refund), amountOwed: rd(amountOwed), diagnostics: d };
}
