/**
 * CLI: `tsx src/cli.ts <input.json>` — prints computed form lines, refund/owed,
 * and diagnostics. Example input in test/fixtures/ or README.
 */

import { readFileSync } from "node:fs";
import { compute } from "./engine.js";
import type { TaxInput } from "./types.js";

const path = process.argv[2];
if (!path) {
  console.error("usage: tsx src/cli.ts <input.json>");
  process.exit(1);
}

const input = JSON.parse(readFileSync(path, "utf-8")) as TaxInput;
const result = compute(input);

const keys = Object.keys(result.lines).sort((a, b) =>
  a.localeCompare(b, undefined, { numeric: true }),
);
for (const k of keys) {
  if (result.lines[k] !== 0) console.log(`${k.padEnd(12)} ${result.lines[k].toLocaleString("en-US")}`);
}
console.log("---");
console.log(`refund      ${result.refund.toLocaleString("en-US")}`);
console.log(`amount owed ${result.amountOwed.toLocaleString("en-US")}`);
if (result.diagnostics.length) {
  console.log("diagnostics:");
  for (const d of result.diagnostics) console.log(`  - ${d}`);
}
