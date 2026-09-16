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
npx wrangler login                          # or CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
npx wrangler d1 create prop-a-db            # paste database_id into wrangler.jsonc
npx wrangler d1 migrations apply prop-a-db --remote
npx wrangler r2 bucket create prop-a-docs
```

Source PDFs are gitignored — fetch them into `reference/` first (URLs also in
`reference/SOURCES.md`):

```bash
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
curl -sL -A "$UA" -o reference/mi-2024-ad-valorem-levy-report.pdf \
  "https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Tax-Levy-Reports/2024-Ad-Valorem-Tax-Levy-Report.pdf"
curl -sL -A "$UA" -o reference/mi-stc-annual-report-2024.pdf \
  "https://www.michigan.gov/mdhhs/-/media/Project/Websites/treasury/STC/2024/2024-Annual-Report.pdf"
curl -sL -A "$UA" -o reference/mi-property-tax-report-2022.pdf \
  "https://www.michigan.gov/treasury/-/media/Project/Websites/treasury/ORTA/Economic-Reports-Notices/FY-2025/PropTaxReport_2022.pdf"
for f in reference/*.pdf; do
  npx wrangler r2 object put "prop-a-docs/$(basename "$f")" --file "$f" --content-type application/pdf --remote
done
npm run deploy
```

`scripts/parse_treasury_pdfs.py` regenerates `data/*.json` from the source PDFs.

## Caveats

- Not a scored fiscal note: Headlee rollback interactions, demand feedback from
  an income-tax cut, and the constitutional amendment path are out of scope.
- County-level residential uplift is approximated by each county's residential
  share of SEV (county class-split TV is not published).
- Not legal or tax advice.
