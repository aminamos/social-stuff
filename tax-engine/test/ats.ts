/**
 * ATS-style harness: scripted test returns with expected outputs.
 *
 * Mirrors the IRS Assurance Testing System workflow — each case in
 * test/ats/cases/*.json is a full return (TaxInput) plus the expected result
 * (form lines, refund, amount owed). `npm run ats` computes every case and
 * diffs; regressions print as line-level mismatches.
 *
 * When IRS ATS test packages are available (requires Authorized e-file
 * Provider status), drop their translated JSON cases into the same folder —
 * the runner is format-agnostic.
 */

import { strict as assert } from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { compute } from "../src/engine.js";
import type { TaxInput } from "../src/types.js";

interface AtsCase {
  name: string;
  description?: string;
  source?: string;
  input: TaxInput;
  expected: { lines?: Record<string, number>; refund?: number; owed?: number };
}

const dir = join(dirname(fileURLToPath(import.meta.url)), "ats", "cases");
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

let passed = 0;
let failed = 0;

for (const file of files) {
  const c = JSON.parse(readFileSync(join(dir, file), "utf8")) as AtsCase;
  try {
    const r = compute(c.input);
    for (const [k, v] of Object.entries(c.expected.lines ?? {})) {
      const got = r.lines[k] ?? 0;
      assert.equal(got, v, `line ${k}: want ${v}, got ${got}`);
    }
    if (c.expected.refund !== undefined) assert.equal(r.refund, c.expected.refund, "refund");
    if (c.expected.owed !== undefined) assert.equal(r.amountOwed, c.expected.owed, "amount owed");
    passed++;
    console.log(`ok   ${file} — ${c.name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${file} — ${c.name}\n     ${e instanceof Error ? e.message : e}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed (${files.length} cases)`);
process.exit(failed ? 1 : 0);
