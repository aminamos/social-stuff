# Source documents

Archived in the `prop-a-docs` R2 bucket, served at `GET /docs/<key>`, registry at `GET /api/sources`.

| R2 key | Document | Original URL |
|---|---|---|
| `mi-2024-ad-valorem-levy-report.pdf` | 2024 Ad Valorem Property Tax Report (Treasury Form 625) | michigan.gov/taxes — Tax-Levy-Reports |
| `mi-stc-annual-report-2024.pdf` | State Tax Commission 2024 Annual Report (Appendix 3/4: county + class SEV/TV) | michigan.gov — STC/2024 |
| `mi-property-tax-report-2022.pdf` | Michigan Property Tax Report (Treasury ORTA, Proposal A history; official $5.43B 2022 cap-savings estimate) | michigan.gov/treasury — ORTA FY-2025 |

To rebuild the bucket after download:

```bash
npx wrangler r2 object put prop-a-docs/mi-2024-ad-valorem-levy-report.pdf --file <pdf> --content-type application/pdf --remote
```
