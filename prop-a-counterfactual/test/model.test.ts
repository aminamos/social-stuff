import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { runModel, defaultParams, type CountyRow, type ClassRow } from "../src/model";

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

console.log("model.test.ts: all assertions passed");
console.log(`  uplift ${(r.state.uplift/1e9).toFixed(2)}B | IIT coverage ${(r.state.incomeTaxCoveragePct*100).toFixed(1)}% | shortfall ${(r.state.incomeTaxShortfall/1e9).toFixed(2)}B`);
console.log(`  turnover +${r.turnover.extraSalesLow}-${r.turnover.extraSalesHigh}/yr | price decline ${(r.prices.priceDeclinePctLow*100).toFixed(1)}-${(r.prices.priceDeclinePctHigh*100).toFixed(1)}%`);
