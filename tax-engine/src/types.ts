/**
 * Input and output types for the TY2025 federal individual income tax engine.
 *
 * All money amounts are whole dollars unless noted. The engine mirrors the
 * ordering of Form 1040 and its numbered schedules for tax year 2025 (filed
 * in 2026). Inputs that the engine does not model (e.g. Schedule D line items,
 * Form 8949) are provided as netted summaries.
 */

export type FilingStatus = "single" | "mfj" | "mfs" | "hoh" | "qss";

export interface PersonInfo {
  /** Born before January 2, 1961 (i.e. age 65+ for TY2025 per IRS convention). */
  senior65Plus?: boolean;
  blind?: boolean;
  /** Covered by a retirement plan at work in 2025 (W-2 box 13). */
  coveredByEmployerPlan?: boolean;
  /** Traditional IRA contributions made for 2025 (pre-deduction-limit). */
  iraContributions?: number;
  /** Eligible retirement contributions for the saver's credit (Form 8880). */
  saverCreditContributions?: number;
  /** For EITC with no qualifying child: taxpayer must be 25–64 at year end. */
  ageAtEndOfYear?: number;
}

export interface Dependent {
  /** Meets the qualifying-child tests for the child tax credit. */
  qualifyingChildForCtc?: boolean;
  /** Under age 17 at end of 2025 (CTC age test). */
  under17?: boolean;
  /** Meets the qualifying-child tests for EITC. */
  eitcQualifyingChild?: boolean;
}

export interface CapitalSummary {
  /** Net short-term gain/(loss) — Schedule D line 6 (can be negative). */
  shortTermNet?: number;
  /** Net long-term gain/(loss) — Schedule D line 15 (can be negative). */
  longTermNet?: number;
  /** Capital loss carryover into 2025, split by character (positive numbers). */
  shortTermCarryover?: number;
  longTermCarryover?: number;
  /** Unrecaptured §1250 gain — Schedule D line 19 (taxed max 25%). */
  unrecaptured1250Gain?: number;
  /** 28%-rate (collectibles) gain — Schedule D line 18 (taxed max 28%). */
  collectiblesGain?: number;
}

export interface ItemizedInput {
  /** Schedule A line 1 — unreimbursed medical/dental expenses (before 7.5% floor). */
  medicalExpenses?: number;
  /** State and local income taxes OR general sales taxes (choose larger). */
  stateLocalIncomeOrSalesTax?: number;
  realEstateTax?: number;
  personalPropertyTax?: number;
  /** Home mortgage acquisition-debt interest (<= $750k debt assumed). */
  homeMortgageInterest?: number;
  investmentInterest?: number;
  /** Cash charitable contributions to public charities (60% AGI limit applied). */
  charitableGifts?: number;
  /** Non-cash / other-organization gifts within limits (30% AGI limit applied). */
  charitableGiftsLimited?: number;
  /** Federally declared disaster casualty loss, after $100/10% AGI floors. */
  casualtyLoss?: number;
  /** Gambling losses (allowed only up to gambling winnings). */
  gamblingLosses?: number;
  /** Other itemized deductions (Schedule A line 16 catch-all). */
  otherItemized?: number;
}

export interface QbiInput {
  /** Combined qualified business income from all trades/businesses. */
  qualifiedBusinessIncome?: number;
  /** Any part of QBI from a specified service trade or business. */
  sstb?: boolean;
  /** W-2 wages paid by the business (for the phase-in limit). */
  w2WagesFromBusiness?: number;
  /** Unadjusted basis immediately after acquisition of qualified property. */
  ubia?: number;
  qualifiedReitDividends?: number;
  ptpIncome?: number;
}

export interface TaxInput {
  filingStatus: FilingStatus;

  taxpayer: PersonInfo;
  spouse?: PersonInfo;
  dependents?: Dependent[];

  /** True if someone else can claim the taxpayer as a dependent. */
  claimedAsDependent?: boolean;
  /** MFS only: lived with spouse at any time in 2025. */
  mfsLivedWithSpouse?: boolean;
  /** MFS only: lived apart from spouse for the last 6 months of 2025 (EITC §32(d)). */
  mfsLivedApartLast6Months?: boolean;

  // ---- Form 1040 income ----
  /** Line 1a — W-2 box 1 total. */
  wages?: number;
  /** Line 1b — household employee wages not on a W-2. */
  householdEmployeeWages?: number;
  /** W-2 box 5 total (Medicare wages). Defaults to `wages` — used for Additional Medicare Tax. */
  medicareWages?: number;
  /** W-2 box 3 total (Social Security wages). Defaults to `wages` — caps the SE-tax SS base. */
  socialSecurityWages?: number;
  /** Line 2a. */
  taxExemptInterest?: number;
  /** Line 2b. */
  taxableInterest?: number;
  /** Line 3b. */
  ordinaryDividends?: number;
  /** Line 3a (subset of 3b). */
  qualifiedDividends?: number;
  /** Line 4b — taxable IRA distributions. */
  iraDistributions?: number;
  /** Line 5b — taxable pensions/annuities. */
  pensions?: number;
  /** Line 6a — total Social Security benefits (SSA-1099 box 5). */
  socialSecurityBenefits?: number;
  /** Line 7 — simplified Schedule D summary. */
  capital?: CapitalSummary;

  // ---- Schedule 1, Part I (1040 line 8) ----
  taxableStateRefunds?: number;
  alimonyReceived?: number;
  /** Schedule C net profit (negative = loss). Also used as SE income unless overridden. */
  businessIncome?: number;
  otherGains?: number;
  /** Schedule E net (rental, royalty, partnership, S-corp, trust). */
  rentalRoyaltyPartnership?: number;
  farmIncome?: number;
  unemploymentCompensation?: number;
  /** Schedule 1 line 8z catch-all (gambling winnings, hobby income, etc.). */
  otherIncome?: number;
  /** Gambling winnings included in `otherIncome` (caps the loss deduction). */
  gamblingWinnings?: number;
  /** Nontaxable combat pay elected for EITC — not income, only affects EITC. */
  nontaxableCombatPay?: number;

  // ---- Schedule 1, Part II adjustments ----
  adjustments?: {
    /** Line 11 — capped at $300 per eligible educator ($600 max if both spouses). */
    educatorExpenses?: number;
    reservistExpenses?: number;
    hsaDeduction?: number;
    movingExpensesArmedForces?: number;
    sepSimpleQualifiedPlans?: number;
    selfEmployedHealthInsurance?: number;
    earlyWithdrawalPenalty?: number;
    alimonyPaid?: number;
    archerMsa?: number;
    juryDutyPay?: number;
    other?: number;
  };
  /** Line 20 — student loan interest paid in 2025 (deduction computed, <= $2,500). */
  studentLoanInterestPaid?: number;

  // ---- Schedule 1-A (new for 2025) ----
  /** Qualified tips received (employee + trade/business), before the $25k cap. */
  qualifiedTips?: number;
  /** Qualified overtime premium compensation, before the $12.5k/$25k cap. */
  qualifiedOvertime?: number;
  /** Qualified passenger vehicle loan interest not deducted elsewhere. */
  carLoanInterest?: number;
  /** Income excluded via §§911/931/933 + Puerto Rico + adoption benefits — MAGI add-back only. */
  excludedForeignIncome?: number;

  // ---- Deductions ----
  itemized?: ItemizedInput;
  /** Force itemizing even if the standard deduction is larger (e.g. MFS rule). */
  forceItemized?: boolean;

  // ---- QBI (§199A / Form 8995) ----
  qbi?: QbiInput;

  // ---- Credits computed elsewhere, passed through ----
  foreignTaxCredit?: number;
  educationCredits?: number;
  otherNonrefundableCredits?: number;
  /** Simplified Form 2441 input. */
  dependentCare?: {
    expenses: number;
    qualifyingPersons: 1 | 2;
    /** Spouse's earned income (MFJ) — caps the credit; omit if >= expenses. */
    spouseEarnedIncome?: number;
  };

  // ---- Other taxes (Schedule 2) ----
  /** Net self-employment earnings source (Sch C/SE). Defaults to `businessIncome`. */
  selfEmploymentIncome?: number;
  householdEmploymentTax?: number;
  earlyDistributionPenalty?: number;
  additionalHsaTax?: number;
  /** Net investment income for NIIT. Default: interest + dividends + net gains + rental/royalty/partnership. */
  netInvestmentIncome?: number;
  otherTaxes?: number;

  // ---- Payments ----
  federalWithholding?: number;
  estimatedTaxPayments?: number;
  extensionPayment?: number;
  excessSocialSecurity?: number;
  otherRefundablePayments?: number;

  // ---- EITC ----
  /** Override investment income for the $11,950 EITC limit (otherwise computed). */
  eitcInvestmentIncome?: number;
  /** Set if the taxpayer is ineligible (e.g. no SSN, prior disallowance). */
  eitcIneligible?: boolean;

  // ---- Education credits (Form 8863) ----
  education?: {
    /** American Opportunity Credit students (first 4 years, >= half-time, no felony drug conviction). */
    aocStudents?: {
      qualifiedExpenses: number;
      /** Set false to disqualify (e.g. claimed AOC 4 prior years). */
      eligible?: boolean;
    }[];
    /** Lifetime Learning Credit qualified expenses, all students combined. */
    llcExpenses?: number;
  };

  // ---- Energy credits (Form 5695, TY2025 — both parts sunset after 2025 under OBBBA) ----
  energy?: {
    /** §25C — 30% of costs, $1,200/yr cap (+$2,000 separate heat-pump/biomass cap). */
    exteriorDoors?: number;
    windowsSkylights?: number;
    insulationAirSealing?: number;
    homeEnergyAudit?: number;
    heatPumpOrBiomass?: number;
    otherQualifiedProperty?: number;
    /** §25D — 30%, no annual cap; unused carries forward. */
    solarElectric?: number;
    solarWaterHeating?: number;
    windEnergy?: number;
    geothermalHeatPump?: number;
    batteryStorage?: number;
    /** Fuel cell: $500 per 0.5 kW of capacity — pass the computed credit. */
    fuelCellCredit?: number;
    carryforwardFrom2024?: number;
  };

  // ---- Schedule R — credit for the elderly or the disabled ----
  scheduleR?: {
    /** Taxable disability income (required when under 65 and claiming via disability). */
    disabilityIncome?: number;
    /** Under 65, retired on permanent and total disability. */
    under65OnDisability?: boolean;
    /** Nontaxable part of Social Security + nontaxable pensions/annuities. */
    nontaxableBenefits?: number;
    /** MFS only: did not live with spouse at any time in 2025 (required for Sch R). */
    mfsLivedApartAllYear?: boolean;
  };

  // ---- AMT (Form 6251) preference/adjustment inputs ----
  amt?: {
    /** §2g — tax-exempt interest on private activity bonds. */
    privateActivityBondInterest?: number;
    /** §2i — ISO exercise spread (FMV minus exercise price). */
    isoAdjustment?: number;
    /** §2h — excluded QSBS gain add-back (7% of the §1202 exclusion). */
    qsbsExclusionAddback?: number;
    /** §2l — post-1986 depreciation difference (AMT minus regular; can be negative). */
    depreciationAdjustment?: number;
    /** §2k — disposition-of-property basis difference (AMT minus regular). */
    dispositionAdjustment?: number;
    /** §2m — passive activity loss difference (AMT minus regular). */
    passiveAdjustment?: number;
    /** §2c — AMT Form 4952 minus regular Form 4952 (can be negative). */
    investmentInterestDifference?: number;
    /** §2d/2o-2t/3 catch-all: depletion, long-term contracts, IDCs, circulation, etc. */
    otherAdjustments?: number;
    /** AMT foreign tax credit (line 8). */
    amtForeignTaxCredit?: number;
    /** Form 8801 prior-year minimum tax credit (nonrefundable, Sch 3). */
    priorYearMinimumTaxCredit?: number;
  };

  // ---- Form 8615 "kiddie tax" — this return is the CHILD's return ----
  kiddieTax?: {
    /** Child's unearned income (interest, dividends, gains, taxable SS part of child). */
    unearnedIncome: number;
    /** Parent's filing status (controls the parent's bracket set). */
    parentFilingStatus: FilingStatus;
    /** Parent's taxable income (Form 1040 line 15). */
    parentTaxableIncome: number;
    /** Net unearned income of all OTHER children of the parent (8615 line 7). */
    otherChildrenNetUnearned?: number;
    /** Child's itemized deductions directly connected to unearned income + $1,350. */
    itemizedDeductionBase?: number;
    /** Child's age/status confirms 8615 applies; set false to force off. */
    applies?: boolean;
  };

  // ---- Form 2210 underpayment penalty ----
  underpayment?: {
    /** Prior-year (2024) total tax. */
    priorYearTax: number;
    /** Prior-year AGI (drives the 110% rule above $150k / $75k MFS). */
    priorYearAgi?: number;
    /** Withholding per quarter [Q1..Q4]; default: spread evenly. */
    withholdingByQuarter?: number[];
    /** Estimated payments per quarter [Q1..Q4] (due 4/15, 6/15, 9/15, 1/15). */
    estimatesByQuarter?: number[];
    /** Skip the penalty computation even when inputs are present. */
    waive?: boolean;
  };

  // ---- Schedule B triggers ----
  /** Foreign financial accounts — Schedule B Part III + FBAR diagnostic. */
  foreignAccounts?: boolean;
  /** Seller-financed mortgage interest, bond-premium amortization, nominee, etc. */
  scheduleBRequired?: boolean;

  // ---- Minnesota M1 (v1) ----
  mn?: {
    /** Wages sourced to MN (defaults to wages — resident assumption). */
    resident?: boolean;
    additions?: number;
    /** MN subtractions (e.g. SS subtraction computed elsewhere, milit. pay). */
    subtractions?: number;
    /** MN itemized total (Schedule M1SA); defaults to federal itemized. */
    itemizedTotal?: number;
    /** MN income tax withheld. */
    withholding?: number;
    /** MN estimated payments. */
    estimatedPayments?: number;
  };
}

export interface TaxResult {
  /** Form/line values, keyed as "1040.15", "sch1.10", "sched1A.13", "sch2.4", etc. */
  lines: Record<string, number>;
  /** 1040 line 34 — overpaid / refund. */
  refund: number;
  /** 1040 line 37 — amount owed. */
  amountOwed: number;
  /** Non-fatal caveats: unsupported forms, simplifications that fired, AMT note. */
  diagnostics: string[];
}
