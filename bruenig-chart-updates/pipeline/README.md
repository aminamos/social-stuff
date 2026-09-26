# bruenig-chart-updates pipeline

Fetches public datasets, recomputes updated versions of Matt Bruenig /
People's Policy Project charts, and emits SQL that seeds D1.

## Layout

| file | what it does |
|---|---|
| `fetch_asec.py` | Downloads `asecpubNNcsv.zip` from the Census datasets tree, parses the person CSV (`pppubNN.csv`), computes Bruenig-style market vs disposable poverty rates (total + children) per SPM unit. |
| `fetch_scf.py` | Downloads the Fed's Distributional Financial Accounts (`dfa.zip` -> `dfa-networth-shares.csv`), derives top-1% / top-10% / bottom-50% net-worth shares, quarterly. |
| `fetch_scf_deciles.py` | Downloads the SCF 2022 public summary extract (`scfp2022s.zip` -> `rscfp2022.dta`) and reproduces Bruenig's wealth-decile chart set: overall decile shares, within-group decile shares (race / age band / education), and decile composition charts — all weighted, averaged over the 5 implicates. |
| `fetch_oecd.py` | Queries OECD Income Distribution Database via SDMX REST (dataflow `OECD.WISE.INE,DSD_WISE_IDD@DF_IDD`), extracts market + disposable poverty rates for all countries, plus market-income Gini by age group (`INC_MRKT_GINI`). |
| `seed.py` | Reads `computed/*.csv`, writes `../data/seed.sql` (charts/series/points, idempotent `INSERT OR REPLACE`) and `../data/seed_releases.sql` (baseline `releases` rows). Also stamps provenance `original_charts` / `original_window`. |
| `originals/` | Staged copies of Bruenig's original chart SVGs (fetched from peoplespolicyproject.org uploads) before upload to R2 `bruenig-chart-updates-data/originals/<dir>/<file>.svg`. |

## Re-running

```bash
cd bruenig-chart-updates
python pipeline/fetch_asec.py      # or --years 2026,2025,2024,2023,2022
python pipeline/fetch_scf.py
python pipeline/fetch_scf_deciles.py
python pipeline/fetch_oecd.py
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
- **wealth (decile charts)** — recomputed from the SCF 2022 public
  summary extract microdata (weighted deciles per implicate, averaged
  over 5 implicates) — same source Bruenig used.
- **wealth-shares (quarterly)** — DFA net-worth shares (SCF public tables
  lack a top-1% band; DFA is the Fed's SCF-calibrated distributional
  series). Our extension — no matching original chart in the post.
- **intl poverty** — OECD PR_INC_MRKT / PR_INC_DISP at PL_50, METH2012,
  D_CUR. The anchor post is text-only (no chart original); extension.
- **intl Gini** — OECD INC_MRKT_GINI by age group (18-65 / 65+ / all),
  reproducing the chart in "Crunching the Numbers on Predistribution".

## Original chart artifacts

Bruenig's original chart SVGs are archived in R2
(`bruenig-chart-updates-data`) under `originals/<dir>/<file>.svg`, where
`<dir>` groups a post's chart set (`wealth-post` holds all 18 SVGs from
"Wealth Distribution in 2022") or a standalone chart slug. Staged copies
live in `pipeline/originals/`; upload with
`wrangler r2 object put bruenig-chart-updates-data/<key> --file <path>
--remote --config wrangler.toml`.

Each chart's provenance carries:
- `original_charts`: `[{title, source_url, r2_key}]` — the PPP upload
  URL plus its R2 key (served via `/docs/originals/...`).
- `original_window`: `{first_x, last_x}` — the x-range covered by the
  original publication (poverty: income years 2021–2022; SCF decile
  charts: all x `D1`–`D10`, single 2022 vintage). `null` bounds = no
  original-window styling (our-extension charts, or intl charts whose
  x encodes `ISO3:YYYY` per country).

Rows with `original_charts` set but zero series are **update pending**
(Norway 2019, Alaska 2017–2020 — not computable from the public SCF
extract); rows with `original_charts: []` are our extensions.

## Known gaps

- ASEC backfill covers income years 2021–2025: new-format public CSVs
  with embedded `SPM_*` fields start with ASEC 2022; older releases are
  fixed-width with different variable names (not yet implemented).
- OECD market-income series have coverage gaps for some countries/years —
  latest-year-per-country is used; x encodes `ISO3:YYYY`.
