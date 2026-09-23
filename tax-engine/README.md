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
| `GET /` | — | interview UI (questionnaire → TaxInput → compute → MeF download) |
| `GET /health` | — | `{ ok, taxYear, persistence }` |
| `POST /compute` | — | `TaxResult` for the posted `TaxInput` |
| `POST /mef` | — | `{ input, meta? }` → MeF `Return` XML (download) |
| `POST /intake` | — | `{ documents: [...] }` → merged partial `TaxInput` + per-doc mapping |
| `POST /returns` | D1 | computes + persists `{ id, result, artifact? }`; R2 snapshot at `returns/<id>.json` |
| `GET /returns/:id` | D1 | stored `{ input, result }` |
| `GET /artifacts?prefix=` | R2 | `{ objects: [{ key, size, uploaded }], truncated, cursor? }` |
| `GET /artifacts/:key` | R2 | raw object body (e.g. `state/ca/2025/2025-540-booklet.pdf`) |
| `GET /watch/status`, `POST /watch/run` | R2 | tax-watch run summary / on-demand run |

`wrangler.jsonc` binds a real `DB` (D1 `tax-engine`) and `RETURNS_BUCKET`
(R2 `tax-engine-artifacts`); both are provisioned and migrations are applied.
The worker is deployed at `https://tax-engine.a-8c6.workers.dev`.
R2 also holds reference data: TY2025 state tax docs under `state/{ca,mn,ny}/2025/`
and county data under `geo/` — see each prefix's `manifest.json`.
(`d1 migrations apply` and `r2 object` default to the local simulator — `--remote`
is required for the real database; see repo `AGENTS.md`.)
Compute routes work even with the bindings absent (501 on persistence routes).

## tax-watch (tax-law change monitor)

`src/watch/` is a separate subsystem: a weekly cron (`triggers.crons`, Mon
06:20 UTC) that monitors federal/state/local tax-law sources and records
changes in R2 — the review queue that feeds the state engines.

- **Polling**: every `WatchSource` in `src/watch/registry.ts` (IRS newsroom,
  Federal Register API, all 50 state DORs + DC/PR, and the local
  income-tax jurisdictions that exist — MD counties, NYC, Detroit, OH/RITA,
  PA Act 32, Portland, STL/KC) gets its URLs fetched and word-diffed against
  the last snapshot in `watch/state/`. Cosmetic churn (timestamps, counters)
  is filtered by a minimum-diff threshold; fetch errors are recorded, so
  dead URLs and bot-walled sites surface instead of failing silently.
- **Search discovery**: per-jurisdiction queries run through a pluggable
  provider — `SEARCH_PROVIDER` = `duckduckgo` (default, key-free), `brave`,
  `exa`, `perplexity`, `firecrawl` (keys via `wrangler secret put
  <NAME>_API_KEY`). New URLs land as findings; `WATCH_SEARCH_ENABLED=0`
  makes a poll-only run.
- **Scope**: income, corporate, capital-gains, withholding, pass-through,
  credits, estate, payroll. Sales tax deliberately excluded.
- **Output**: `watch/changes/<ts>.json` + `watch/changes/latest.json` +
  `watch/status.json` in R2; `GET /watch/status` and `POST /watch/run`
  (`?searches=0` = poll only) expose it live.
- **Known limit**: some `.gov` sites bot-wall datacenter IPs (FTB, mass.gov,
  detroitmi.gov…) — those poll as persistent fetch-errors until a proxied
  fetch path or better URL exists; search discovery covers them meanwhile.

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
  Qualified Dividends & Capital Gain Tax Worksheet; full **Schedule D Tax
  Worksheet** (0/15/20 preferential, unrecaptured §1250 at 25%, 28% collectibles)
  when those gains are present.
- **Credits**: CTC/ODC/ACTC (Sch 8812, $2,200/$500/$1,700, 5%-per-$1k
  phaseout), EITC (Rev. Proc. 2024-40 params, EIC-table midpoint lookup on both
  earned income and AGI, $11,950 investment limit, age 25–64 no-child rule,
  MFS-separated rule), dependent-care credit (2441 rate slide), saver's credit,
  **Form 8863** education (AOC $2,500 max w/ 40% refundable, LLC 20%×$10k,
  $80–90k/$160–180k phaseout), **Form 5695** energy (§25C $1,200/yr + per-item
  caps + $2,000 heat-pump cap; §25D 30% solar/wind/geothermal/battery),
  **Schedule R** elderly/disabled (15% of base after nontaxable benefits and
  AGI excess, tax-liability limited).
- **Other taxes (Sch 2)**: SE tax (with $176,100 SS wage base), additional
  Medicare 0.9%, NIIT 3.8%, **AMT (Form 6251)** — AMTI refigured without the
  senior deduction, SALT add-back (itemized) or standard-deduction add-back,
  preference inputs (ISO, PAB interest, depreciation, passive, QSBS),
  $88,100/$137,000/$68,500 exemption with phaseout, 26%/28% split at
  $239,100, Part III preferential-rate computation, AMT FTC input.
- **Kiddie tax (Form 8615)**: net unearned income over $2,700 at the parent's
  marginal rate; larger of tentative vs. child-rate tax replaces line 16.
- **Estimated-tax penalty (Form 2210)**: 90%-of-current / 100%-or-110%-of-prior
  safe harbor, quarterly shortfalls at the 7% §6621 rate (all 2025 quarters),
  withholding spread evenly unless per-quarter inputs are given.
- **Minnesota M1 (v1)**: federal AGI + MN additions − subtractions, MN
  standard/itemized (with the 3%-of-excess-AGI, 80%-cap limiter), $5,200
  dependent exemptions, 5.35/6.8/7.85/9.85% brackets, withholding →
  refund/owed. Lines keyed `m1.*`.
- **Result**: payments, refund vs. amount-owed, plus `diagnostics[]` for
  known simplifications.

## Deliberate limitations (diagnostics flag most of them)

- Foreign earned income exclusion computation, adoption credit, premium tax
  credit / excess APTC repayment: pass-through input fields or not modeled.
- Form 2210 uses the standard quarterly method; Schedule AI (annualized
  income) may produce a smaller penalty — diagnostics note this.
- Schedule B payer-level detail is intake data, not math; the engine emits
  totals + Part III diagnostics instead.
- M1 v1 assumes full-year MN residency (no Schedule M1NR) and does not
  compute the MN SS subtraction — pass it via `mn.subtractions`.
- IRA/SLI/SS benefit interdependence is resolved in two passes; inside a
  phaseout band the result can differ from iterated software by a few dollars.
- MFS edge cases (spouse itemizing, community property) are the caller's job;
  `forceItemized` is provided.
- Per-business §199A aggregation is simplified to a single QBI pool.
- MeF XML is structure v1 (correct hierarchy + core monetary elements);
  ATS-grade conformance needs the official XSD bundle for element validation.

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

1. ~~Widen coverage~~ — done: Sch D Tax Worksheet, 8863, 5695, 2210,
   Schedule R, AMT (6251), kiddie tax (8615), Schedule B triggers.
2. ~~Structured document intake~~ — done: `POST /intake` merges typed
   W-2/1099/1098 documents into `TaxInput` (LLM extraction is upstream;
   the merge is deterministic).
3. ~~Interview UI~~ — done: `GET /` serves the questionnaire → `TaxInput` →
   `/compute` flow, with a MeF XML download button.
4. ~~MeF XML~~ — done (v1): `POST /mef` emits ReturnHeader + ReturnData
   keyed off `lines`. Next: validate elements against the official XSDs.
5. **IRS ATS testing → Authorized e-file Provider (EFIN)** — the harness is
   ready (`npm run ats`, cases in `test/ats/cases/`); the e-Services
   application itself is a business process. See
   `../tax-software-irs-cost-local/irs-approval-checklist.md`.
6. State returns — MN v1 done (`m1.*` lines); CA/NY reference docs are
   staged in R2 for when they're added.

## Sources (all TY2025, verified at build time)

Rev. Proc. 2024-40; Pub. 1040 (2025 Tax Table); Pub. 596 (EIC); Pub. 590-A;
Pub. 501 / Topic 551; Notice 2024-80; OBBBA (P.L. 119-21) — Schedule 1-A form
text; SSA 2025 COLA. Comments in `src/tables2025.ts` cite each constant.
