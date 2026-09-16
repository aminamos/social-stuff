# IRS Tax Year 2025 Document Corpus

Pulled 2026-09-16 from irs.gov (source page: https://www.irs.gov/forms-instructions).

Year-editioned TY2025 files come from `irs.gov/pub/irs-prior/{id}--2025.pdf`.
Rev-dated / continuous-use files come from `irs.gov/pub/irs-pdf/{id}.pdf` (no `--2025` suffix in filename).

- `forms/` — 71 PDFs: 1040 family, all lettered/numbered schedules, credits, info returns (W-2/W-4/W-9, 1099 series, 1098 series, 5498)
- `instructions/` — 48 PDFs: matching instruction booklets where IRS publishes them separately
- `pubs/` — 30 PDFs: Pub 17 + individual-tax pubs (501–596 series), business pubs (334, 463, 535-adjacent), VITA pub 4491
- `efile-mef/` — 10 PDFs: provider/MeF/security pubs (3112, 4163, 4164, 1345, 1436, 1075, 4557, 5708, 5293, 5712)

## File-ID quirks worth knowing

| File | Actually is |
|---|---|
| `forms/f1040s--2025.pdf` | **Form 1040-SR** (seniors) |
| `forms/f1040sr--2025.pdf` | **Schedule R** (credit for elderly/disabled) — not 1040-SR |
| `forms/f1040s8--2025.pdf` | **Schedule 8812** (CTC/ODC). The standalone `f8812.pdf` is an obsolete 2011 form. |
| `forms/f1040s1a--2025.pdf` | **Schedule 1-A "Additional Deductions"** — NEW for TY2025 (OBBBA: tips, overtime, car-loan interest, senior deduction) |
| `forms/f1040sei--2025.pdf` | Schedule EIC |
| `forms/f1099msc--2025.pdf` | Form 1099-MISC (ID is `f1099msc`, not `f1099misc`) |
| `forms/f1099ptr--2025.pdf` | Form 1099-PATR (ID is `f1099ptr`, not `f1099patr`) |
| `instructions/i1040s8--2025.pdf` | Instructions for Schedule 8812 |
| `instructions/i1099mec--2025.pdf` | Combined instructions for 1099-MISC **and** 1099-NEC |
| `instructions/i1040tt.pdf` | "Publication 1040" — 2025 Tax Table + EIC tables + tax computation worksheet (current = TY2025) |

## Gaps / notes

- Instructions for Schedules 1, 2, 3, A, SE, EIC are inside `i1040gi--2025.pdf` (the main 1040 booklet), not separate PDFs.
- No separate instruction PDFs exist for 8867, 4868, 4952, 8396, 8615 — embedded in the forms.
- Pub 972 (obsolete since 2021), Pub 929 (discontinued), Pub 535 (withdrawn — HTML placeholder, not a PDF) were skipped. Pub 334 + 463 cover the Schedule C ground.
- Not pulled (out of 1040 MVP scope): Form 1040-NR, business returns (1120/1065/990/1041), employment forms (940/941), W-7.
- MeF *schemas* (XSDs) and ATS test returns are not on forms-instructions — they live on the MeF user guides / e-file provider pages referenced in `../irs-approval-checklist.md`.
