# Minnesota Tax Year 2025 Document Corpus

Pulled 2026-09-16 from revenue.state.mn.us.

- `pages/` — markdown scrapes of the 6 DOR topic pages (rates/brackets, state tax forms, AMT, property tax refund, individual income tax, estimated tax)
- `forms/` — 44 PDFs: all TY2025 individual income tax forms + property tax refund forms + inflation adjustments

## Core

| File | What it is |
|---|---|
| `m1-25.pdf` | **Form M1**, Individual Income Tax |
| `m1-inst-25.pdf` | **M1 instructions** (booklet) |
| `m1x-25_0.pdf` | Form M1X, amended return |
| `inflation-adjusted-amounts-2025.pdf` | TY2025 bracket/deduction/exemption inflation adjustments |

## Schedules (attach to M1)

- `m1w` — MN income tax withheld
- `m1m` — income additions & subtractions · `m1mb` — business income add./subt. · `m1nc` — federal adjustments (nonconformity)
- `m1nr` — nonresidents/part-year · `m1cr` — credit for tax paid to other states · `m1rcr` — Wisconsin reciprocity
- `m1c` — nonrefundable credits · `m1ref` — refundable credits · `m1cwfc` — **Child & Working Family Credits**
- `m1cd` — dependent care · `m1dqc` — dependents/qualifying children · `m1ed` — K-12 education credit
- `m1ma` — marriage credit · `m1r` — 65+/disabled subtraction · `m1qpen` — public pension subtraction
- `m1sa` — MN itemized deductions (note: MN allows itemizing even when taking federal standard deduction)
- `m1mt` — **alternative minimum tax** · `m1mtc` — AMT credit
- `m1ls` — lump-sum distribution tax · `m1ar` — installment-sale-gain acceleration
- `m1cat` — casualty/theft · `m1ue` — unreimbursed employee expenses
- `m1lti` — long-term care insurance credit · `m1slc` — student loan credit · `m1psc` — stillborn credit
- `m1cmd` — teacher master's-degree credit · `m1home` — first-time homebuyer savings acct
- `m1529` — 529 education savings credit/subtraction · `m99` — combat-zone military credit
- `m1rent` — **Renter's Credit** (on Form M1 via M1REF — moved off M1PR for renters)
- `niit` — **Net Investment Income Tax** (MN 1% NIIT, started TY2024)

## Property tax refund

- `m1pr-25.pdf` — Form M1PR, Homestead Credit Refund (homeowners; renters now use M1RENT on the M1)
- `m1pr-inst-25.pdf` — M1PR instructions
- `m1prsr-25.pdf` — Schedule M1PR-SR, special refund

## Estimated tax

- `m15-25.pdf` — Schedule M15, underpayment-of-estimated-tax penalty
- `payment-record.pdf` — estimated payment record worksheet (2026)
- Note: MN has no static individual estimated-voucher PDF — vouchers are generated via e-Services/`SendCheck`. `est-25.pdf` exists but is for trusts/partnerships/S-corps (M2/M3/M8) — not pulled.

## Other

- `m23` — refund claim for deceased taxpayer · `mhp` — manufactured-home-park sale credit · `tpd` — tax position disclosure · `rev184_*` (linked in pages) — military/power-of-attorney forms

## Notes for the cost model

- MN tax type taxonomy: individual income = `field_tax_type=106`, property tax refund = `161`; TY2025 = `field_tax_year=12606` on `/form-search`.
- MN runs its own AMT (M1MT), its own NIIT (Schedule NIIT), and splits renters' refund onto the M1 — three state-unique calcs a tax engine can't inherit from federal logic.
- The state-tax-forms page lists forms in Spanish/Hmong/Somali too — only English pulled.
