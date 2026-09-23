/**
 * Tax year 2025 federal parameters (returns filed in 2026).
 *
 * Sources:
 * - Rev. Proc. 2024-40 (brackets, EITC, QBI threshold, SLI phaseout, aged/blind
 *   standard-deduction add-on, §911/§199A figures)
 * - One Big Beautiful Bill Act, P.L. 119-21 (standard deduction amounts, CTC,
 *   Schedule 1-A deductions, SALT cap)
 * - Notice 2024-80 (IRA phaseouts, saver's credit, retirement limits)
 * - SSA 2025 COLA (Social Security wage base)
 * - Pub. 1040 (2025 Tax Table construction), Pub. 590-A, Pub. 501, Topic 551
 */

import type { FilingStatus } from "./types.js";

/** Marginal rate breakpoints: [income floor, rate]. First floor must be 0. */
export const BRACKETS: Record<FilingStatus, Array<[number, number]>> = {
  single: [
    [0, 0.1],
    [11925, 0.12],
    [48475, 0.22],
    [103350, 0.24],
    [197300, 0.32],
    [250525, 0.35],
    [626350, 0.37],
  ],
  mfj: [
    [0, 0.1],
    [23850, 0.12],
    [96950, 0.22],
    [206700, 0.24],
    [394600, 0.32],
    [501050, 0.35],
    [751600, 0.37],
  ],
  qss: [
    [0, 0.1],
    [23850, 0.12],
    [96950, 0.22],
    [206700, 0.24],
    [394600, 0.32],
    [501050, 0.35],
    [751600, 0.37],
  ],
  mfs: [
    [0, 0.1],
    [11925, 0.12],
    [48475, 0.22],
    [103350, 0.24],
    [197300, 0.32],
    [250525, 0.35],
    [375800, 0.37],
  ],
  hoh: [
    [0, 0.1],
    [17000, 0.12],
    [64850, 0.22],
    [103350, 0.24],
    [197300, 0.32],
    [250500, 0.35],
    [626350, 0.37],
  ],
};

export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15750,
  mfs: 15750,
  hoh: 23625,
  mfj: 31500,
  qss: 31500,
};

/** Additional standard deduction, 65+ or blind (each condition, each spouse). */
export const AGED_BLIND_ADDON: { unmarried: number; married: number } = {
  unmarried: 2000, // single / hoh
  married: 1600, // mfj / mfs / qss
};

/** Dependent filer standard deduction: greater of floor or earned income + offset. */
export const DEPENDENT_STD_DED = { floor: 1350, earnedOffset: 450 };

/**
 * 2025 Tax Table (Pub. 1040) construction: tax at the midpoint of each cell.
 * Cells are $25 wide for TI in [$25, $3,000) and $50 wide for TI in
 * [$3,000, $100,000). Below $25 the cells are [0,5), [5,15), [15,25).
 * Validated against published rows (e.g. S 25,225 → 2,789; MFJ 25,325 → 2,562).
 */
export const TAX_TABLE_MAX = 100000;

/** Long-term capital gain / qualified dividend breakpoints. */
export const CG_ZERO_PCT_TOP: Record<FilingStatus, number> = {
  single: 48350,
  mfs: 48350,
  hoh: 64750,
  mfj: 96700,
  qss: 96700,
};
export const CG_FIFTEEN_PCT_TOP: Record<FilingStatus, number> = {
  single: 533400,
  mfs: 300000,
  hoh: 566700,
  mfj: 600050,
  qss: 600050,
};

export const CAPITAL_LOSS_LIMIT = { default: 3000, mfs: 1500 };

/** CTC/ODC/ACTC — OBBBA raised CTC to $2,200 for 2025. */
export const CTC = {
  perChild: 2200,
  perOtherDependent: 500,
  actcMaxPerChild: 1700,
  actcRate: 0.15,
  actcEarnedThreshold: 2500,
  phaseoutJoint: 400000,
  phaseoutOther: 200000,
  /** $50 per $1,000 (or fraction) of MAGI over threshold. */
  reductionPer1000: 50,
};

/** EITC — Rev. Proc. 2024-40 §3.06. */
export interface EitcParams {
  creditRate: number;
  earnedIncomeAmount: number;
  maxCredit: number;
  phaseoutRate: number;
  phaseoutStartOther: number;
  phaseoutStartMfj: number;
}
export const EITC: Record<0 | 1 | 2 | 3, EitcParams> = {
  0: {
    creditRate: 0.0765,
    earnedIncomeAmount: 8490,
    maxCredit: 649,
    phaseoutRate: 0.0765,
    phaseoutStartOther: 10620,
    phaseoutStartMfj: 17730,
  },
  1: {
    creditRate: 0.34,
    earnedIncomeAmount: 12730,
    maxCredit: 4328,
    phaseoutRate: 0.1598,
    phaseoutStartOther: 23350,
    phaseoutStartMfj: 30470,
  },
  2: {
    creditRate: 0.4,
    earnedIncomeAmount: 17880,
    maxCredit: 7152,
    phaseoutRate: 0.2106,
    phaseoutStartOther: 23350,
    phaseoutStartMfj: 30470,
  },
  3: {
    creditRate: 0.45,
    earnedIncomeAmount: 17880,
    maxCredit: 8046,
    phaseoutRate: 0.2106,
    phaseoutStartOther: 23350,
    phaseoutStartMfj: 30470,
  },
};
export const EITC_INVESTMENT_LIMIT = 11950;
export const EITC_NO_CHILD_MIN_AGE = 25;
export const EITC_NO_CHILD_MAX_AGE = 64;

/** Social Security wage base / SE tax. */
export const SS_WAGE_BASE = 176100;
export const SE_NET_FACTOR = 0.9235;
export const SE_SS_RATE = 0.124;
export const SE_MEDICARE_RATE = 0.029;
export const SE_MIN_EARNINGS = 400;

export const ADDL_MEDICARE_RATE = 0.009;
export const ADDL_MEDICARE_THRESHOLD: Record<FilingStatus, number> = {
  mfj: 250000,
  mfs: 125000,
  single: 200000,
  hoh: 200000,
  qss: 200000,
};

export const NIIT_RATE = 0.038;
export const NIIT_THRESHOLD: Record<FilingStatus, number> = {
  mfj: 250000,
  qss: 250000,
  mfs: 125000,
  single: 200000,
  hoh: 200000,
};

/** Social Security benefit taxation (§86) income bases. */
export const SS_BASE_LOW = { joint: 32000, other: 25000 };
export const SS_BASE_HIGH = { joint: 44000, other: 34000 };

/** Schedule 1-A (OBBBA) — MFS filers are ineligible for all four parts. */
export const SCHED_1A = {
  tips: { cap: 25000, capJoint: 25000, threshold: 150000, thresholdJoint: 300000 },
  overtime: { cap: 12500, capJoint: 25000, threshold: 150000, thresholdJoint: 300000 },
  carLoan: { cap: 10000, capJoint: 10000, threshold: 100000, thresholdJoint: 200000 },
  senior: { perPerson: 6000, threshold: 75000, thresholdJoint: 150000, rate: 0.06 },
};

/** SALT cap — OBBBA. MAGI = AGI + §§911/931/933 exclusions. */
export const SALT = {
  cap: 40000,
  capMfs: 20000,
  floor: 10000,
  floorMfs: 5000,
  threshold: 500000,
  thresholdMfs: 250000,
  rate: 0.3,
};

/** Student loan interest deduction. */
export const SLI = {
  max: 2500,
  phaseoutOther: [85000, 100000] as const,
  phaseoutJoint: [170000, 200000] as const,
};

/** Traditional IRA deduction phaseouts (Notice 2024-80). */
export const IRA = {
  limit: 7000,
  catchUp: 1000,
  catchUpAge: 50,
  phaseoutCoveredOther: [79000, 89000] as const,
  phaseoutCoveredJoint: [126000, 146000] as const,
  phaseoutSpouseCoveredJoint: [236000, 246000] as const,
  phaseoutMfs: [0, 10000] as const,
};

/** Child & dependent care credit (Form 2441). */
export const DEPENDENT_CARE = {
  expenseLimitOne: 3000,
  expenseLimitTwo: 6000,
  topRate: 0.35,
  minRate: 0.2,
  agiFloor: 15000,
  rateStepPer: 2000,
};

/** Saver's credit (Notice 2024-80): rate tier AGI ceilings. Key by household type. */
export const SAVERS = {
  maxContributionPerPerson: 2000,
  tiers: {
    mfj: [47500, 51000, 79000],
    hoh: [35625, 38250, 59250],
    other: [23750, 25500, 39500],
  },
};

/** §199A QBI. */
export const QBI = {
  rate: 0.2,
  thresholdOther: 197300,
  thresholdJoint: 394600,
  phaseRangeOther: 50000,
  phaseRangeJoint: 100000,
};

/** AMT (Form 6251) — Rev. Proc. 2024-40 §3.11. */
export const AMT = {
  exemption: { single: 88100, hoh: 88100, mfj: 137000, qss: 137000, mfs: 68500 } as Record<FilingStatus, number>,
  /** Exemption phaseout: 25% of AMTI over threshold; exemption gone at completePhaseout. */
  phaseoutStart: { single: 626350, hoh: 626350, mfj: 1252700, qss: 1252700, mfs: 626350 } as Record<FilingStatus, number>,
  phaseoutRate: 0.25,
  /** 28% rate begins above this taxable excess amount. */
  rate28Breakpoint: { single: 239100, hoh: 239100, mfj: 239100, qss: 239100, mfs: 119550 } as Record<FilingStatus, number>,
};

/** Education credits (Form 8863) — AOC §25A(b), LLC §25A(c); phaseouts not indexed. */
export const EDUCATION = {
  aocMax: 2500,
  aocFirstTier: 2000,
  aocSecondTier: 2000,
  aocRefundableRate: 0.4,
  llcRate: 0.2,
  llcExpenseCap: 10000,
  phaseout: [80000, 90000] as const,
  phaseoutJoint: [160000, 180000] as const,
};

/** Form 5695 — §25C home improvement + §25D clean energy (both expire 12/31/2025, OBBBA §§70406/70407). */
export const ENERGY = {
  c: {
    rate: 0.3,
    annualCap: 1200,
    doorCapEach: 250,
    doorCapTotal: 500,
    windowCap: 600,
    auditCap: 150,
    heatPumpCap: 2000, // separate annual cap for heat pumps / biomass
  },
  d: {
    rate: 0.3,
  },
};

/** Schedule R — §22 (amounts are statutory, not indexed). */
export const SCHEDULE_R = {
  initial: {
    singleOrHoh: 5000,
    qss: 5000,
    mfjBothElderly: 7500,
    mfjOneElderly: 5000,
    mfsApart: 3750,
  },
  agiThreshold: { single: 7500, hoh: 7500, qss: 7500, mfj: 10000, mfs: 5000 } as Record<FilingStatus, number>,
  rate: 0.15,
};

/** Form 8615 kiddie tax — Rev. Proc. 2024-40 §3.31 / i8615. */
export const KIDDIE = {
  /** Unearned-income trigger. */
  trigger: 2700,
  /** Line 2 deduction when the child doesn't itemize. */
  nonItemizerDeduction: 2700,
  /** Itemized filer floor = $1,350 + directly-connected deductions. */
  itemizerBase: 1350,
};

/** Form 2210 — §6621 underpayment rate held 7% all four quarters of 2025 (Rev. Rul. 2025-7/13/19). */
export const F2210 = {
  annualRate: 0.07,
  /** Days each quarter's underpayment accrues through the 4/15/26 return due date. */
  accrualDays: [365, 304, 212, 90] as const,
  safeHarborBalanceDue: 1000,
  currentTaxPct: 0.9,
  priorTaxPct: 1.0,
  priorTaxPctHighAgi: 1.1,
  highAgiThreshold: 150000,
  highAgiThresholdMfs: 75000,
};

/** Minnesota M1, TY2025 — Dept. of Revenue inflation-adjusted amounts (Dec 2024 notice). */
export const MN = {
  brackets: {
    mfj: [[0, 0.0535], [47620, 0.068], [189180, 0.0785], [330410, 0.0985]],
    qss: [[0, 0.0535], [47620, 0.068], [189180, 0.0785], [330410, 0.0985]],
    single: [[0, 0.0535], [32570, 0.068], [106990, 0.0785], [198630, 0.0985]],
    mfs: [[0, 0.0535], [23810, 0.068], [94590, 0.0785], [165205, 0.0985]],
    hoh: [[0, 0.0535], [40100, 0.068], [161130, 0.0785], [264050, 0.0985]],
  } as Record<FilingStatus, Array<[number, number]>>,
  standardDeduction: { single: 14950, mfs: 14950, hoh: 22500, mfj: 29900, qss: 29900 } as Record<FilingStatus, number>,
  /** Std/itemized reduced by 3% of AGI over threshold, capped at 80% reduction. */
  deductionPhaseout: { threshold: 238950, thresholdMfs: 119475, rate: 0.03, maxReduction: 0.8 },
  dependentExemption: 5200,
};
