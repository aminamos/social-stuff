// Regression test: /export.csv must quote every field.
// A violation_type like "CASE,FLSA" once split the row and hid the real
// docket URL in an unnamed trailing column.
// Runs WITHOUT type-checking (index.ts references Cloudflare runtime types):
//   deno test --no-check --sloppy-imports src/csv-export.test.ts
import worker from "./index.ts";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

function envWithRow(row: Record<string, unknown>) {
  return {
    DB: {
      prepare: (_q: string) => ({
        all: async () => ({ results: [row] }),
      }),
    },
    R2_BUCKET: { get: async (_k: string) => null },
  };
}

Deno.test("export.csv keeps comma fields inside their columns", async () => {
  const env = envWithRow({
    case_id: "WHD-DOL-1364653",
    source_agency: "US_DOL_WHD",
    respondent_legal_name: "KUSTOM KLEEN OF TEXAS, INC.",
    trade_name: "Kustom Kleen USA",
    address: "2226 Westgate",
    city: "Pearland",
    state: "TX",
    zip_code: "77581",
    industry_description: "Janitorial Services",
    violation_type: "CASE,FLSA",
    back_wages_recovered: 1320000,
    civil_penalties_assessed: 0,
    settlement_amount: 1320000,
    workers_affected: 766,
    repeat_violator: 0,
    status: "ENFORCEMENT_CONFIRMED",
    findings_date: "2004-12-31T00:00:00",
    description: "",
    provenance_type: "VERIFIED_PUBLIC_ACTION",
    source_docket_url:
      "https://national-housing-labor-registry.a-8c6.workers.dev/docs/WHD-DOL-1364653.pdf",
  });
  const res = await (worker as any).fetch(
    new Request("https://national-housing-labor-registry.a-8c6.workers.dev/export.csv"),
    env,
  );
  assert(res.status === 200, "status 200, got " + res.status);
  const lines = (await res.text()).trim().split("\n");
  assert(lines.length === 2, "header + one row, got " + lines.length);
  // Minimal quoted-CSV parse: 20 columns, docket URL in the last one.
  const cols: string[] = [];
  const line = lines[1];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let j = i + 1;
      let field = "";
      while (j < line.length) {
        if (line[j] === '"' && line[j + 1] === '"') { field += '"'; j += 2; }
        else if (line[j] === '"') { j++; break; }
        else { field += line[j]; j++; }
      }
      cols.push('"' + field.replace(/"/g, '""') + '"');
      if (line[j] === ",") j++;
      i = j;
    } else {
      const j = line.indexOf(",", i);
      cols.push(j < 0 ? line.slice(i) : line.slice(i, j));
      i = j < 0 ? line.length : j + 1;
    }
  }
  assert(cols.length === 20, "20 columns, got " + cols.length);
  assert(
    cols[19] ===
      '"https://national-housing-labor-registry.a-8c6.workers.dev/docs/WHD-DOL-1364653.pdf"',
    "docket URL stays in its column: " + cols[19],
  );
  assert(cols[9] === '"CASE,FLSA"', "comma field stays quoted: " + cols[9]);
});
