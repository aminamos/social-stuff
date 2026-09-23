/**
 * Known-answer tests for the TY2025 engine. Expected values are hand-computed
 * from the 2025 Tax Table (Pub. 1040), Tax Computation Worksheet, Schedule 1-A,
 * Schedule 8812, Pub. 596 EIC parameters, and the QDCGT worksheet.
 */

import { strict as assert } from "node:assert";
import { compute, taxTable, figureTax } from "../src/engine.js";
import type { TaxInput } from "../src/types.js";

let passed = 0;
let failed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`ok   ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}\n     ${e instanceof Error ? e.message : e}`);
  }
}

function expect(input: TaxInput, want: Record<string, number>, extra?: { refund?: number; owed?: number; diagnosticIncludes?: string }) {
  const r = compute(input);
  for (const [k, v] of Object.entries(want)) {
    const got = r.lines[k] ?? 0;
    assert.equal(got, v, `line ${k}: want ${v}, got ${got}`);
  }
  if (extra?.refund !== undefined) assert.equal(r.refund, extra.refund, "refund");
  if (extra?.owed !== undefined) assert.equal(r.amountOwed, extra.owed, "amount owed");
  if (extra?.diagnosticIncludes) {
    assert.ok(
      r.diagnostics.some((x) => x.includes(extra.diagnosticIncludes!)),
      `expected diagnostic containing "${extra.diagnosticIncludes}", got ${JSON.stringify(r.diagnostics)}`,
    );
  }
  return r;
}

// ---- Tax Table spot checks (published Pub. 1040 rows) ----
check("tax table: 25,200-25,250 single = 2,789", () => assert.equal(taxTable(25225, "single"), 2789));
check("tax table: 25,300-25,350 MFJ = 2,562", () => assert.equal(taxTable(25325, "mfj"), 2562));
check("tax table: bottom rows", () => {
  assert.equal(taxTable(4, "single"), 0);
  assert.equal(taxTable(10, "single"), 1);
  assert.equal(taxTable(20, "single"), 2);
  assert.equal(taxTable(37, "single"), 4);
  assert.equal(taxTable(987, "single"), 99);
  assert.equal(taxTable(3025, "single"), 303);
  assert.equal(taxTable(5975, "single"), 598);
});
check("figureTax switches to TCW at 100,000", () => {
  // single 100,000: 1,192.5 + 36,550*.12 + 51,525*.22 = 1,192.5+4,386+11,335.5 = 16,914
  assert.equal(figureTax(100000, "single"), 16914);
});

// ---- Wage-only returns ----
check("single W-2 60k", () => {
  expect(
    { filingStatus: "single", taxpayer: { ageAtEndOfYear: 35 }, wages: 60000, federalWithholding: 7000 },
    { "1040.9": 60000, "1040.11": 60000, "1040.12": 15750, "1040.15": 44250, "1040.16": 5075, "1040.24": 5075 },
    { refund: 1925 },
  );
});

check("MFJ 80k, two CTC children", () => {
  expect(
    {
      filingStatus: "mfj",
      taxpayer: { ageAtEndOfYear: 40 },
      spouse: {},
      dependents: [
        { qualifyingChildForCtc: true, under17: true, eitcQualifyingChild: true },
        { qualifyingChildForCtc: true, under17: true, eitcQualifyingChild: true },
      ],
      wages: 80000,
      federalWithholding: 6000,
    },
    { "1040.15": 48500, "1040.16": 5346, "1040.19": 4400, "1040.22": 946, "1040.24": 946, "1040.28": 0 },
    { refund: 5054 },
  );
});

check("HoH 30k, one child: CTC limit + ACTC + EITC", () => {
  expect(
    {
      filingStatus: "hoh",
      taxpayer: { ageAtEndOfYear: 32 },
      dependents: [{ qualifyingChildForCtc: true, under17: true, eitcQualifyingChild: true }],
      wages: 30000,
      federalWithholding: 1500,
    },
    { "1040.15": 6375, "1040.16": 638, "1040.19": 638, "1040.22": 0, "1040.27": 3262, "1040.28": 1562 },
    { refund: 6324 },
  );
});

// ---- Self-employment ----
check("single SE income 50k: SE tax + QBI", () => {
  expect(
    { filingStatus: "single", taxpayer: { ageAtEndOfYear: 40 }, businessIncome: 50000, qbi: { qualifiedBusinessIncome: 50000 } },
    { "sch2.4": 7065, "sch1.26": 3533, "1040.11": 46467, "1040.13a": 6143, "1040.15": 24574, "1040.16": 2711, "1040.24": 9776 },
    { owed: 9776 },
  );
});

check("single SE 300k: SS wage-base cap, wage-limited QBI, addl Medicare", () => {
  expect(
    {
      filingStatus: "single",
      taxpayer: { ageAtEndOfYear: 45 },
      businessIncome: 300000,
      qbi: { qualifiedBusinessIncome: 300000, w2WagesFromBusiness: 50000 },
    },
    { "sch2.4": 29871, "1040.11": 285064, "1040.13a": 25000, "1040.15": 244314, "1040.16": 55243, "sch2.9": 693, "1040.24": 85807 },
    { owed: 85807 },
  );
});

check("SSTB above QBI phase-in range -> no deduction", () => {
  const r = expect(
    {
      filingStatus: "single",
      taxpayer: { ageAtEndOfYear: 45 },
      businessIncome: 300000,
      qbi: { qualifiedBusinessIncome: 300000, sstb: true, w2WagesFromBusiness: 50000 },
    },
    { "1040.13a": 0 },
  );
  assert.ok(r.lines["1040.15"] > 0);
});

// ---- Retirement income / SS taxation ----
check("single 65+, pension 20k + SS 24k: partial SS taxable, senior deduction", () => {
  expect(
    { filingStatus: "single", taxpayer: { senior65Plus: true }, pensions: 20000, socialSecurityBenefits: 24000, federalWithholding: 500 },
    { "1040.6b": 3500, "1040.11": 23500, "1040.12": 17750, "sched1A.37": 6000, "1040.15": 0, "1040.24": 0 },
    { refund: 500 },
  );
});

check("QSS pension 50k + SS 30k: 85% tier", () => {
  expect(
    { filingStatus: "qss", taxpayer: { senior65Plus: true }, pensions: 50000, socialSecurityBenefits: 30000 },
    { "1040.6b": 25500, "1040.11": 75500, "1040.12": 33100, "sched1A.37": 5970, "1040.15": 36430, "1040.16": 3894 },
  );
});

check("MFS lived with spouse: SS 85% taxable", () => {
  expect(
    { filingStatus: "mfs", taxpayer: {}, spouse: {}, socialSecurityBenefits: 20000, mfsLivedWithSpouse: true },
    { "1040.6b": 17000, "1040.11": 17000, "1040.15": 1250, "1040.16": 126 },
    { diagnosticIncludes: "MFS" },
  );
});

// ---- Capital gains ----
check("single 50k wages + 40k LTCG + 5k qualified dividends: QDCGT worksheet", () => {
  expect(
    {
      filingStatus: "single",
      taxpayer: { ageAtEndOfYear: 40 },
      wages: 50000,
      ordinaryDividends: 5000,
      qualifiedDividends: 5000,
      capital: { longTermNet: 40000 },
    },
    { "1040.7": 40000, "1040.9": 95000, "1040.15": 79250, "1040.16": 8510 },
  );
});

check("capital loss limited to 3,000 with carryover diagnostic", () => {
  const r = compute({
    filingStatus: "single",
    taxpayer: { ageAtEndOfYear: 40 },
    wages: 50000,
    capital: { shortTermNet: -10000 },
  });
  assert.equal(r.lines["1040.7"], -3000);
  assert.ok(r.diagnostics.some((x) => x.includes("carryover") && x.includes("7000")), JSON.stringify(r.diagnostics));
});

// ---- Itemized / SALT ----
check("MFJ itemized with $40k SALT cap", () => {
  expect(
    {
      filingStatus: "mfj",
      taxpayer: { ageAtEndOfYear: 40 },
      spouse: { ageAtEndOfYear: 40 },
      wages: 200000,
      medicareWages: 200000,
      federalWithholding: 30000,
      itemized: { stateLocalIncomeOrSalesTax: 45000, realEstateTax: 15000, homeMortgageInterest: 15000, charitableGifts: 5000 },
    },
    { "schA.17": 60000, "1040.12": 60000, "1040.15": 140000, "1040.16": 20628 },
    { refund: 9372, diagnosticIncludes: "itemized" },
  );
});

check("single MAGI 600k: SALT cap falls to $10k floor", () => {
  expect(
    {
      filingStatus: "single",
      taxpayer: { ageAtEndOfYear: 40 },
      wages: 600000,
      medicareWages: 600000,
      itemized: { stateLocalIncomeOrSalesTax: 50000, homeMortgageInterest: 10000 },
    },
    { "schA.17": 20000, "1040.12": 20000, "1040.15": 580000, "1040.16": 172547, "sch2.9": 3600, "1040.24": 176147 },
    { owed: 176147 },
  );
});

// ---- Schedule 1-A ----
check("single: tips + overtime + car loan deductions below thresholds", () => {
  expect(
    {
      filingStatus: "single",
      taxpayer: { ageAtEndOfYear: 30 },
      wages: 60000,
      qualifiedTips: 10000,
      qualifiedOvertime: 8000,
      carLoanInterest: 3000,
    },
    { "sched1A.13": 10000, "sched1A.21": 8000, "sched1A.30": 3000, "sched1A.38": 21000, "1040.15": 23250, "1040.16": 2555 },
  );
});

check("MFJ: car loan interest phased down $200 per $1k over $200k MAGI", () => {
  expect(
    {
      filingStatus: "mfj",
      taxpayer: { ageAtEndOfYear: 35 },
      spouse: { ageAtEndOfYear: 33 },
      wages: 210000,
      medicareWages: 210000,
      carLoanInterest: 9000,
    },
    { "sched1A.30": 7000, "1040.15": 171500, "1040.16": 27558 },
  );
});

check("MFJ seniors 65+: $6k each minus 6% MAGI phaseout", () => {
  expect(
    {
      filingStatus: "mfj",
      taxpayer: { senior65Plus: true },
      spouse: { senior65Plus: true },
      pensions: 160000,
    },
    { "sched1A.37": 10800, "1040.15": 114500, "1040.16": 15018 },
  );
});

check("MFS ineligible for Schedule 1-A deductions", () => {
  const r = compute({ filingStatus: "mfs", taxpayer: { senior65Plus: true }, spouse: {}, wages: 50000, qualifiedTips: 10000 });
  assert.equal(r.lines["sched1A.38"], 0);
  assert.ok(r.diagnostics.some((x) => x.includes("MFS")));
});

// ---- EITC ----
check("MFJ 50k, two EITC children", () => {
  expect(
    {
      filingStatus: "mfj",
      taxpayer: { ageAtEndOfYear: 35 },
      spouse: { ageAtEndOfYear: 34 },
      dependents: [
        { qualifyingChildForCtc: true, under17: true, eitcQualifyingChild: true },
        { qualifyingChildForCtc: true, under17: true, eitcQualifyingChild: true },
      ],
      wages: 50000,
    },
    { "1040.27": 3034, "1040.19": 1853, "1040.28": 2547 },
    { refund: 5581 },
  );
});

check("EITC disallowed when investment income > $11,950", () => {
  const r = compute({
    filingStatus: "single",
    taxpayer: { ageAtEndOfYear: 30 },
    dependents: [{ eitcQualifyingChild: true }, { eitcQualifyingChild: true }],
    wages: 20000,
    taxableInterest: 12000,
  });
  assert.equal(r.lines["1040.27"], 0);
  assert.ok(r.diagnostics.some((x) => x.includes("investment income")));
});

check("EITC: single no children must be 25-64", () => {
  const young = compute({ filingStatus: "single", taxpayer: { ageAtEndOfYear: 22 }, wages: 10000 });
  assert.equal(young.lines["1040.27"], 0);
  const eligible = compute({ filingStatus: "single", taxpayer: { ageAtEndOfYear: 40 }, wages: 10000 });
  // EI=10,000 -> mid 10,025; .0765*8,490 plateau 649.49 - .0765*(10,025-10,620<0)=0 -> 649
  assert.equal(eligible.lines["1040.27"], 649);
});

// ---- Adjustments ----
check("single 90k, $3k SLI paid: phased to $1,670", () => {
  expect(
    { filingStatus: "single", taxpayer: { ageAtEndOfYear: 30 }, wages: 90000, studentLoanInterestPaid: 3000 },
    { "sch1.20": 1670, "1040.11": 88330, "1040.15": 72580, "1040.16": 10881 },
  );
});

check("single covered by plan, AGI in IRA phaseout: reduced deduction", () => {
  // wages 85,000 + interest 5,000 -> iraMagi = 90,000 inside (79k,89k) -> over band -> 0
  const over = compute({ filingStatus: "single", taxpayer: { coveredByEmployerPlan: true, iraContributions: 7000, ageAtEndOfYear: 40 }, wages: 90000 });
  assert.equal(over.lines["sch1.19"], 0);
  // iraMagi 84,000: tentative 7,000 * (1 - (84,000-79,000)/10,000) = 3,500 -> nearest $10 = 3,500, floor 200
  const mid = compute({ filingStatus: "single", taxpayer: { coveredByEmployerPlan: true, iraContributions: 7000, ageAtEndOfYear: 40 }, wages: 84000 });
  assert.equal(mid.lines["sch1.19"], 3500);
});

// ---- Other taxes / credits ----
check("single 220k wages + 30k interest: NIIT + additional Medicare", () => {
  expect(
    { filingStatus: "single", taxpayer: { ageAtEndOfYear: 45 }, wages: 220000, medicareWages: 220000, taxableInterest: 30000 },
    { "1040.11": 250000, "1040.15": 234250, "1040.16": 52023, "sch2.9": 180, "sch2.12": 1140, "1040.24": 53343 },
    { owed: 53343 },
  );
});

check("saver's credit single AGI 20k -> 50%", () => {
  expect(
    { filingStatus: "single", taxpayer: { ageAtEndOfYear: 40, saverCreditContributions: 2000 }, wages: 20000 },
    { "sch3.8": 1000, "1040.22": 0 },
  );
});

check("dependent filer standard deduction = earned + 450", () => {
  expect(
    { filingStatus: "single", taxpayer: { ageAtEndOfYear: 19 }, claimedAsDependent: true, wages: 2000, taxableInterest: 500, federalWithholding: 100 },
    { "1040.12": 2450, "1040.15": 50, "1040.16": 6 },
    { refund: 94 },
  );
});

check("dependent care credit: 2 qualifying persons, mid AGI", () => {
  // AGI 60,000 -> pct = 35 - floor(45,000/2,000) = 35-22 = 13 -> floored at 20%
  const r = compute({
    filingStatus: "mfj",
    taxpayer: { ageAtEndOfYear: 38 },
    spouse: { ageAtEndOfYear: 36 },
    wages: 60000,
    dependentCare: { expenses: 5000, qualifyingPersons: 2 },
  });
  assert.equal(r.lines["sch3.8"], 1000); // 20% * min(5000, 6000)
});


// ---- Schedule D Tax Worksheet (unrecaptured §1250) ----
check("schD worksheet: 50k LT gain incl 20k unrecaptured §1250, single TI 200k", () => {
  // ordinary 150k -> 28,847; 15% on 30k pref -> 4,500; 25% on 20k 1250 -> 5,000 = 38,347
  expect(
    { filingStatus: "single", taxpayer: {}, wages: 165750, capital: { longTermNet: 50000, unrecaptured1250Gain: 20000 } },
    { "1040.15": 200000, "1040.16": 38347 },
  );
});
check("schD worksheet collapses to QDCGT without special rates", () => {
  // single TI 150k: 20k LT + 5k qd -> ordinary 125k; 0% room = 0 (125k > 48,350);
  // 15% on all 25k -> 3,750; ordinary tax(125k) = 11,335.5+ ... computed below
  const r = compute({ filingStatus: "single", taxpayer: {}, wages: 140750, ordinaryDividends: 5000, qualifiedDividends: 5000, capital: { longTermNet: 20000 } });
  assert.equal(r.lines["1040.15"], 150000);
  // ordinary tax on 125,000 single = 1192.5+4386+12072.5+24%*(125000-103350)=22847
  assert.equal(r.lines["1040.16"], 22847 + 3750);
});

// ---- Form 8863 ----
check("8863: AOC $3,000 expenses single AGI 75,750", () => {
  expect(
    { filingStatus: "single", taxpayer: {}, wages: 75750, education: { aocStudents: [{ qualifiedExpenses: 3000 }] } },
    { "sch3.3": 1350, "1040.29": 900 },
  );
});
check("8863: AOC phaseout at MAGI 85k (factor 0.5)", () => {
  expect(
    { filingStatus: "single", taxpayer: {}, wages: 85000, education: { aocStudents: [{ qualifiedExpenses: 3000 }] } },
    { "sch3.3": 675, "1040.29": 450 },
  );
});
check("8863: LLC 20% of $10k capped", () => {
  expect(
    { filingStatus: "single", taxpayer: {}, wages: 60000, education: { llcExpenses: 15000 } },
    { "sch3.3": 2000, "1040.29": 0 },
  );
});

// ---- Form 5695 ----
check("5695: windows capped at 600, heat pump separate 2k cap, solar 30%", () => {
  const r = compute({ filingStatus: "single", taxpayer: {}, wages: 120000, energy: { windowsSkylights: 3000, heatPumpOrBiomass: 5000, solarElectric: 20000 } });
  assert.equal(r.lines["sch3.5"], 600 + 1500 + 6000);
});

// ---- Schedule R ----
check("schR: under-65 disabled single, AGI 17k", () => {
  // base = min(5000, 8000) - 0.5*(17000-7500) = 250 -> 38; capacity = tax 126
  expect(
    { filingStatus: "single", taxpayer: {}, wages: 17000, scheduleR: { under65OnDisability: true, disabilityIncome: 8000 } },
    { "schR.22": 38, "1040.22": 88 },
  );
});
check("schR: MFS without living apart gets 0 + diagnostic", () => {
  const r = compute({ filingStatus: "mfs", taxpayer: { senior65Plus: true }, wages: 30000, scheduleR: {} });
  assert.equal(r.lines["schR.22"] ?? 0, 0);
  assert.ok(r.diagnostics.some((x) => x.includes("lived apart")));
});

// ---- Form 6251 AMT ----
check("AMT: ISO spread triggers AMT", () => {
  const r = compute({ filingStatus: "single", taxpayer: {}, wages: 300000, amt: { isoAdjustment: 400000 } });
  assert.equal(r.lines["f6251.4"], 700000);
  assert.ok((r.lines["sch2.3"] ?? 0) > 100000, `AMT should be large, got ${r.lines["sch2.3"]}`);
});
check("AMT: wage-only 300k no prefs -> zero AMT", () => {
  const r = compute({ filingStatus: "single", taxpayer: {}, wages: 300000 });
  assert.equal(r.lines["sch2.3"], 0);
});

// ---- Form 8615 kiddie tax ----
check("8615: dependent child, $5k interest, parent MFJ TI 100k", () => {
  // netUnearned 2,300; parent diff 506; child tax on 1,350 = 136; tentative 642 > 368
  const r = compute({
    filingStatus: "single", taxpayer: {}, claimedAsDependent: true, taxableInterest: 5000,
    kiddieTax: { unearnedIncome: 5000, parentFilingStatus: "mfj", parentTaxableIncome: 100000 },
  });
  assert.equal(r.lines["f8615.5"], 2300);
  assert.equal(r.lines["1040.16"], 642);
});

// ---- Form 2210 ----
check("2210: no payments, prior tax lower safe harbor", () => {
  const r = compute({
    filingStatus: "single", taxpayer: {}, wages: 300000,
    underpayment: { priorYearTax: 60000, priorYearAgi: 100000 },
  });
  // requiredAnnual = min(0.9*totalTax, 60000); quarterly = 15000
  // penalty = 15000 * .07 * 971/365 = 2793.3 -> 2793
  assert.equal(r.lines["f2210.19"], 2793);
  assert.equal(r.amountOwed, (r.lines["1040.37"] ?? 0) + 2793);
});
check("2210: balance due under $1,000 -> no penalty", () => {
  const r = compute({
    filingStatus: "single", taxpayer: {}, wages: 50000, federalWithholding: 7000,
    underpayment: { priorYearTax: 1000 },
  });
  assert.equal(r.lines["f2210.19"] ?? 0, 0);
});

// ---- Minnesota M1 ----
check("M1: single wages 60k, MN withholding 2.5k", () => {
  // mnTI = 60000 - 14950 = 45050; tax = 5.35%*32570 + 6.8%*12480 = 1742.50+848.64 = 2591
  expect(
    { filingStatus: "single", taxpayer: {}, wages: 60000, mn: { withholding: 2500 } },
    { "m1.6": 45050, "m1.7": 2591, "m1.38": 91 },
  );
});
check("M1: std deduction 3% reduction over 238,950 AGI", () => {
  // agi 300k: reduction = min(0.8*14950, 0.03*61050=1831.5) -> ded 14950-1831.5 = 13118.5 -> 13119 (rd of 13118.5 = 13119? rd rounds .5 up -> wait Math.round(13118.5)=13119)
  const r = compute({ filingStatus: "single", taxpayer: {}, wages: 300000, mn: {} });
  assert.equal(r.lines["m1.4"], 13119);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);