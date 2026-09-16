# tax-engine — federal individual income tax engine, tax year 2025

A **deterministic** TypeScript engine that computes a Form 1040 (plus the core
schedules) for **tax year 2025** — the returns filed in 2026. No LLM touches the
math path; every output line is keyed to its form (`1040.15`, `sch1.20`,
`sched1A.38`, `sch2.9`...) so it can later feed a MeF XML transmitter.

Ships as a Cloudflare Worker API (`wrangler dev` / `wrangler deploy`) plus a
pure library (`compute(input)`) and a CLI.

## Quick start

```bash
npm install
npm test          # known-answer tests (tsx, no framework)
npm run check     # tsc --noEmit
npm run dev       # wrangler dev --remote: worker on :8787, D1/R2 hit production
echo '{"filingStatus":"single","taxpayer":{"ageAtEndOfYear":35},"wages":60000,"federalWithholding":7000}' \
  | curl -s -X POST localhost:8787/compute -H 'content-type: application/json' -d @-
npx tsx src/cli.ts some-return.json   # CLI, prints form lines
```

## Worker API

| Route | Needs | Returns |
|---|---|---|
| `GET /health` | — | `{ ok, taxYear, persistence }` |
| `POST /compute` | — | `TaxResult` for the posted `TaxInput` |
| `POST /returns` | D1 | computes + persists `{ id, result }` |
| `GET /returns/:id` | D1 | stored `{ input, result }` |

`wrangler.jsonc` ships a `DB` (D1) and `RETURNS_BUCKET` (R2) binding. Deploy:
create the resources (`wrangler d1 create tax-engine`, `wrangler r2 bucket
create tax-engine-artifacts`), paste the real `database_id` into
`wrangler.jsonc`, run `wrangler d1 migrations apply DB --remote`, `wrangler deploy`.
(`migrations apply` and `r2 object` default to the local simulator — `--remote`
is required for the real database; see repo `AGENTS.md`.)
Compute routes work even with the bindings absent (501 on persistence routes).

## What it computes (TY2025)

- **Income (1040 lines 1–8)**: W-2 wages, interest, ordinary/qualified
  dividends, taxable IRA/pension, Social Security (§86 worksheet incl. the
  MFS-lived-with-spouse 85% rule), capital gain/loss with $3k/$1.5k limit and
  carryover diagnostics, Schedule 1 part I categories.
- **Adjustments (Sch 1 part II)**: educator, HSA, SE-tax half (computed),
  SEP/SE-health, alimony, IRA deduction with workplace-plan phaseouts
  (two-pass resolution vs. the §86 provisional income), student loan interest.
- **Schedule 1-A (OBBBA, new for 2025)**: tips (≤$25k), overtime (≤$12.5k/$25k),
  car-loan interest (≤$10k, $200-per-$1k phaseout over $100k/$200k), senior
  deduction ($6k/person, 6% over $75k/$150k). MFS ineligible, per the form.
- **Deductions**: standard (incl. $2,000/$1,600 aged-blind add-on, dependent
  limitation) vs. itemized (Schedule A: medical 7.5% floor, **SALT cap $40k
  with 30% phasedown above $500k MAGI**, mortgage, charity AGI limits,
  casualty, gambling).
- **QBI §199A**: 20% rate, $197.3k/$394.6k thresholds, $50k/$100k phase-in,
  W-2/UBIA limits, SSTB exclusion, REIT/PTP carve-out.
- **Tax (line 16)**: exact 2025 Tax Table ($25 cells below $3k, $50 cells to
  $100k, tax at cell midpoint) below $100k TI; bracket math above;
  Qualified Dividends & Capital Gain Tax Worksheet with 0/15/20 breakpoints.
- **Credits**: CTC/ODC/ACTC (Sch 8812, $2,200/$500/$1,700, 5%-per-$1k
  phaseout), EITC (Rev. Proc. 2024-40 params, EIC-table midpoint lookup on both
  earned income and AGI, $11,950 investment limit, age 25–64 no-child rule,
  MFS-separated rule), dependent-care credit (2441 rate slide), saver's credit.
- **Other taxes (Sch 2)**: SE tax (with $176,100 SS wage base), additional
  Medicare 0.9%, NIIT 3.8%.
- **Result**: payments, refund vs. amount-owed, plus `diagnostics[]` for
  known simplifications.

## Deliberate limitations (diagnostics flag most of them)

- AMT (Form 6251) is not computed — a diagnostic always notes it.
- Unrecaptured §1250 / 28% collectibles gain (Schedule D Tax Worksheet) is
  approximated under the QDCGT worksheet and flagged.
- Kiddie tax, foreign earned income exclusion computation, adoption credit,
  premium tax credit / excess APTC repayment, energy credits: pass-through
  input fields or not modeled.
- IRA/SLI/SS benefit interdependence is resolved in two passes; inside a
  phaseout band the result can differ from iterated software by a few dollars.
- MFS edge cases (spouse itemizing, community property) are the caller's job;
  `forceItemized` is provided.
- Per-business §199A aggregation is simplified to a single QBI pool.

## Testing strategy

`test/engine.test.ts` is a known-answer suite: every expectation is
hand-computed from the published tables/worksheets (and two rows of the actual
Pub. 1040 Tax Table are asserted verbatim). Extend it with:

- **Golden KATs**: edge cases at phaseout boundaries.
- **IRS ATS test packages** once we're an authorized e-file provider — the
  real target for this engine's correctness bar.
- **Differential fuzzing** vs. another implementation (e.g. direct-file OSS or
  Tax-Calculator projects) on randomized inputs.

## Roadmap

1. Widen coverage: Schedule B/D detail, Form 8863 education, energy credits,
   Form 2210 underpayment, Schedule R, AMT, dependent return (8615).
2. Structured document intake (W-2/1099 parsing) — LLM-assisted extraction
   feeding this deterministic core; the LLM never computes.
3. Interview UI (1040 questionnaire → TaxInput).
4. MeF XML generation for the supported forms, keyed off `lines`.
5. IRS ATS testing → Authorized e-file Provider (EFIN). See
   `../tax-software-irs-cost/irs-approval-checklist.md`.
6. State returns (MN first?).

## Sources (all TY2025, verified at build time)

Rev. Proc. 2024-40; Pub. 1040 (2025 Tax Table); Pub. 596 (EIC); Pub. 590-A;
Pub. 501 / Topic 551; Notice 2024-80; OBBBA (P.L. 119-21) — Schedule 1-A form
text; SSA 2025 COLA. Comments in `src/tables2025.ts` cite each constant.
