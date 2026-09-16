import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { runModel, defaultParams, sanitizeParams, type CountyRow, type ClassRow } from "../src/model";

const counties: CountyRow[] = JSON.parse(readFileSync(new URL("../data/county_2024.json", import.meta.url), "utf8"));
const classes: ClassRow[] = JSON.parse(readFileSync(new URL("../data/class_values.json", import.meta.url), "utf8"));

// --- fixture sanity ---
assert.equal(counties.length, 83, "83 counties");
const tv = counties.reduce((a, c) => a + c.tv, 0);
const sev = counties.reduce((a, c) => a + c.sev, 0);
const levy = counties.reduce((a, c) => a + c.total_tax, 0);
assert.equal(sev, 679_173_427_952, "SEV matches STC 2024 statewide total");
assert.ok(Math.abs(tv - 481_508_518_562) < 1e6, "TV matches levy-report county sum");
assert.ok(Math.abs(levy - 20_324_680_828) < 1e6, "levy matches reported total");

// --- headline math ---
const r = runModel(counties, classes, defaultParams());
const expectedUplift = counties.reduce((a, c) => a + c.gap * c.avg_rate * 1.0 / 1000, 0);
assert.ok(Math.abs(r.state.uplift - expectedUplift) < 1, "uplift = gap × avg millage");
assert.ok(r.state.uplift > 8e9 && r.state.uplift < 9e9, `uplift ~$8.2B, got ${r.state.uplift}`);
assert.ok(r.state.incomeTaxCoveragePct > 0.65 && r.state.incomeTaxCoveragePct < 0.8,
  `covers ~72% of IIT, got ${r.state.incomeTaxCoveragePct}`);
assert.ok(r.state.incomeTaxShortfall > 0, "does not fully replace IIT at defaults");

// uncapShare=0 → zero uplift
const p0 = { ...defaultParams(), uncapShare: 0 };
assert.equal(runModel(counties, classes, p0).state.uplift, 0);

// residential-only mode is smaller than full uncap
const pr = { ...defaultParams(), residentialOnly: 1 };
const rr = runModel(counties, classes, pr);
assert.ok(rr.state.uplift < r.state.uplift && rr.state.uplift > 4e9, `res-only ${rr.state.uplift}`);

// turnover bounds are ordered and plausible
assert.ok(r.turnover.extraSalesLow < r.turnover.extraSalesHigh);
assert.ok(r.turnover.extraSalesHigh < r.turnover.baseSales * 0.2, "lift stays under +20% of baseline");

// mills for full replacement exceeds current avg rate
assert.ok(r.state.millsNeededForFullReplacement > r.state.avgRate);

// --- exact headline values (docs must match these) ---
assert.equal(r.turnover.extraSalesLow, 4764, "turnover low");
assert.equal(r.turnover.extraSalesHigh, 11909, "turnover high");
assert.ok(Math.abs(r.prices.priceDeclinePctLow - 0.01634) < 1e-4, `price low ${r.prices.priceDeclinePctLow}`);
assert.ok(Math.abs(r.prices.priceDeclinePctHigh - 0.03269) < 1e-4, `price high ${r.prices.priceDeclinePctHigh}`);
assert.ok(r.state.residentialUplift > 6.4e9 && r.state.residentialUplift < 6.6e9,
  `residential uplift ~$6.5B, got ${r.state.residentialUplift}`);

// --- millMult scales linearly ---
const p12 = { ...defaultParams(), millMult: 1.2 };
const r12 = runModel(counties, classes, p12);
assert.ok(Math.abs(r12.state.uplift / r.state.uplift - 1.2) < 1e-9, "millMult scales uplift");

// --- sanitize: out-of-range params clamp, never Infinity/NaN ---
const rShareHi = runModel(counties, classes, { ...defaultParams(), uncapShare: 2 });
assert.equal(rShareHi.state.uplift, r.state.uplift, "uncapShare clamps to 1");
assert.equal(rShareHi.params.uncapShare, 1);
const rMillNeg = runModel(counties, classes, { ...defaultParams(), millMult: -1 });
assert.equal(rMillNeg.state.uplift, 0, "negative millMult clamps to 0");
assert.equal(rMillNeg.params.millMult, 0);
const rZeroDisc = runModel(counties, classes, { ...defaultParams(), discountRate: 0 });
assert.equal(rZeroDisc.params.discountRate, 0.01, "discountRate floors at 0.01");
assert.ok(Number.isFinite(rZeroDisc.prices.pvOfUplift), "discountRate=0 stays finite");
assert.ok(Number.isFinite(rZeroDisc.prices.priceDeclinePctHigh));
const rCapHi = runModel(counties, classes, { ...defaultParams(), capShare: 5 });
assert.equal(rCapHi.params.capShare, 1, "capShare clamps to 1");
const rResTruthy = runModel(counties, classes, { ...defaultParams(), residentialOnly: 7 });
assert.equal(rResTruthy.params.residentialOnly, 1, "truthy residentialOnly → 1");
assert.equal(rResTruthy.state.uplift, rr.state.uplift, "truthy residentialOnly ≡ res-only mode");
const pNeg = { ...defaultParams(), uncapShare: -1, incomeTaxRevenue: -5 };
const rNeg = runModel(counties, classes, pNeg);
assert.equal(rNeg.state.uplift, 0, "negative uncapShare clamps to 0");
assert.equal(rNeg.state.incomeTaxCoveragePct, 0, "negative IIT revenue → 0 coverage, not negative");
const pNoCap = { ...defaultParams(), capShare: 0 };
assert.equal(runModel(counties, classes, pNoCap).prices.pvOfUplift, 0, "capShare=0 → no price effect");
assert.deepEqual(Object.keys(sanitizeParams(defaultParams())).sort(),
  Object.keys(defaultParams()).sort(), "sanitize preserves param keys");

console.log("model.test.ts: all assertions passed");
console.log(`  uplift ${(r.state.uplift/1e9).toFixed(2)}B | IIT coverage ${(r.state.incomeTaxCoveragePct*100).toFixed(1)}% | shortfall ${(r.state.incomeTaxShortfall/1e9).toFixed(2)}B`);
console.log(`  turnover +${r.turnover.extraSalesLow}-${r.turnover.extraSalesHigh}/yr | price decline ${(r.prices.priceDeclinePctLow*100).toFixed(1)}-${(r.prices.priceDeclinePctHigh*100).toFixed(1)}%`);
