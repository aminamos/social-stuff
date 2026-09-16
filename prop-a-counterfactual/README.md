# Proposal A Counterfactual — Michigan

Serverless Cloudflare Worker that models the counterfactual: **what if every
Michigan parcel were taxed on state equalized value instead of
Proposal-A-capped taxable value?** Answers three questions from the
[analysis](ANALYSIS.md): uncap revenue (~+$8.3B), whether it could replace the
income tax (~72% — no), housing turnover (+5–12k sales/yr), and the honest price
effect (−1.5–3.1% via supply/carrying-cost, not direct capitalization).

## Stack

- **Cloudflare Worker** (TypeScript), no framework
- **D1** (`prop-a-db`) — `counties` (83 rows: TV/SEV/levy/millage), `state_series`
  (2004–2024), `class_values` (2024–2025), `model_params` (tunables), `source_documents`
- **R2** (`prop-a-docs`) — archived Treasury/STC source PDFs, `GET /docs/<key>`
- **Deterministic engine** (`src/model.ts`) — uplift = gap × county millage;
  every parameter adjustable live via D1 or `?param=` query string

## Endpoints

| Route | Description |
|---|---|
| `GET /` | UI: headline answers, assumption sliders, sortable county table, gap series |
| `GET /api/model?uncapShare=&residentialOnly=&incomeTaxRevenue=` | Full model run |
| `GET /api/counties` | Raw county table |
| `GET /api/series` | 2004–2024 statewide SEV/TV/levy |
| `GET /api/classes` | 2024–2025 class-level SEV/TV |
| `GET /api/sources` | Source-document registry |
| `GET /docs/<key>` | Archived source PDFs from R2 |

## Dev

```bash
npm install
npm test          # engine tests (tsx, no CF needed)
npm run check     # tsc --noEmit
npm run dev       # wrangler dev (local D1 via migrations)
```

### Data layer

```bash
npx wrangler d1 create prop-a-db            # then paste database_id into wrangler.jsonc
npx wrangler d1 migrations apply prop-a-db --remote
# R2: create prop-a-docs bucket, upload the 3 PDFs listed in reference/SOURCES.md
```

`scripts/parse_treasury_pdfs.py` regenerates `data/*.json` from the source PDFs.

## Caveats

- Not a scored fiscal note: Headlee rollback interactions, demand feedback from
  an income-tax cut, and the constitutional amendment path are out of scope.
- County-level residential uplift is approximated by each county's residential
  share of SEV (county class-split TV is not published).
- Not legal or tax advice.
