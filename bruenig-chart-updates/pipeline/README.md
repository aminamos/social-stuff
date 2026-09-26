# bruenig-chart-updates pipeline

Fetches public datasets, recomputes updated versions of Matt Bruenig /
People's Policy Project charts, and emits SQL that seeds D1.

## Layout

| file | what it does |
|---|---|
| `fetch_asec.py` | Downloads `asecpubNNcsv.zip` from the Census datasets tree, parses the person CSV (`pppubNN.csv`), computes Bruenig-style market vs disposable poverty rates (total + children) per SPM unit. |
| `fetch_scf.py` | Downloads the Fed's Distributional Financial Accounts (`dfa.zip` -> `dfa-networth-shares.csv`), derives top-1% / top-10% / bottom-50% net-worth shares, quarterly. |
| `fetch_oecd.py` | Queries OECD Income Distribution Database via SDMX REST (dataflow `OECD.WISE.INE,DSD_WISE_IDD@DF_IDD`), extracts market + disposable poverty rates for all countries. |
| `seed.py` | Reads `computed/*.csv`, writes `../data/seed.sql` (charts/series/points, idempotent `INSERT OR REPLACE`) and `../data/seed_releases.sql` (baseline `releases` rows). |
| `downloads/` | Raw fetched bytes (gitignored, cached between runs). |
| `computed/` | Intermediate CSVs the seed step reads. |

## Re-running

```bash
cd bruenig-chart-updates
python pipeline/fetch_asec.py      # or --years 2026,2025,2024,2023
python pipeline/fetch_scf.py
python pipeline/fetch_oecd.py
python pipeline/seed.py
wrangler d1 execute bruenig-chart-updates --remote --file data/seed.sql
wrangler d1 execute bruenig-chart-updates --remote --file data/seed_releases.sql
```

Downloads are cached in `pipeline/downloads/` — delete a file there to force
a refresh.

## Dataset vintages (as of first seed, 2026-09-26)

| dataset | releases.dataset | latest observed | cadence |
|---|---|---|---|
| CPS ASEC | `cps-asec` | release 2026 (income year 2025) | annual, ~September |
| SCF / DFA | `scf` | survey 2022 (DFA quarterly through 2026:Q2) | SCF triennial; DFA quarterly |
| OECD IDD | `oecd-idd` | 2025 (latest country year; USA 2023) | rolling |

## Cron-to-pipeline flow

The worker's monthly cron (`0 8 2 * *`) fetches each dataset's index URL
(listed in `data/release-urls.json`, mirrored in `src/release-sources.ts`),
extracts a vintage with the regex hint, and compares it to
`releases.latest_vintage` in D1:

- same vintage → bump `checked_at`
- newer vintage → write `releases.stale = 1` + a `change_log` row; the site
  banner can show "new <dataset> released — charts updating"

The pipeline itself is NOT run by the worker (hundreds of MB of downloads).
When `stale = 1`, a human/CI re-runs this pipeline and re-seeds D1, then
clears `releases.stale` / sets `latest_vintage` (handled by re-running
`seed_releases.sql`).

## Methodology / provenance

Every seeded chart carries `provenance.recipe_md` with the exact recipe,
variable lists, and honest differences from Bruenig's computations:

- **poverty** — SPM units; market income = person-level sum of earnings,
  capital income, private pensions/annuities, and child support received;
  disposable = `SPM_RESOURCES`; line = `SPM_POVTHRESHOLD`. Differs from
  Bruenig's older posts where he used a sqrt(family-size)-scaled fixed
  line; documented in the recipe.
- **wealth** — DFA net-worth shares (SCF public tables lack a top-1% band;
  DFA is the Fed's SCF-calibrated distributional series).
- **intl** — OECD PR_INC_MRKT / PR_INC_DISP at PL_50, METH2012, D_CUR.

## Known gaps

- ASEC backfill covers income years 2022–2025 only: new-format public CSVs
  with embedded `SPM_*` fields start with ASEC 2023; older releases are
  fixed-width with different variable names (not yet implemented).
- OECD market-income series have coverage gaps for some countries/years —
  latest-year-per-country is used; x encodes `ISO3:YYYY`.
