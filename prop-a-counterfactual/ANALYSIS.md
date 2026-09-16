# Uncapping Proposal A: Counterfactual Revenue, Turnover, and Price Analysis

**The question** (verbatim request): *What revenue would the state raise in the
counterfactual where everybody is taxed at the same (full-assessment) rate?
Could we eliminate income and capital gains tax with that? How much housing
turnover could we get from old people selling to young people? How much would
home prices for young people go down now that property tax is properly
capitalized into housing cost?*

## Background mechanics

Since Proposal A (1994), Michigan taxes property on **taxable value (TV)**, not
assessed value. TV grows at the lesser of inflation or 5%/yr and **resets to
SEV (50% of market value) only at transfer**. Three decades of compounding mean
long-tenure owners pay on a fraction of what a new buyer pays on the same
house.

## Answer 1 — Revenue from taxing everyone at SEV: **≈ +$8.3B/yr**

| 2024 (all classes, 83 counties) | Amount |
|---|---|
| State equalized value (SEV) | $679.2B |
| Taxable value (TV) | $481.5B |
| **Cap gap** | **$197.7B (29.1% of SEV)** |
| Ad valorem levy | $20.32B (42.21 avg mills) |
| **Uplift if levied on SEV** | **+$8.2–8.35B** |
| Resulting total levy | ≈ $28.6B (+41%) |

The gap is concentrated where you'd expect: Oakland ($26.3B), Wayne ($24.7B),
Macomb ($14.6B), Kent ($13.9B), Washtenaw ($7.4B). By class: residential holds
$154.0B of the gap (31% of residential SEV); agriculture is deepest in
percentage terms (54.7% of ag SEV escapes); commercial 24.2%; industrial 20.8%;
personal property is nearly uncapped already. Residential-only uncapping raises
≈ **+$6.2B**.

Treasury's own estimate for 2022 was $5.43B on a $130B gap; the gap has since
grown ~50% to $197.7B (and $224.6B in 2025 assessments), which is why the
figure is larger now.

## Answer 2 — Replace income + capital gains tax? **Not quite — ≈ 70%**

- Michigan net individual income tax: **~$11.4B** (CY2024, Census STC) to
  ~$12.1B (FY2023-24, SFA). Michigan levies **no separate capital-gains tax** —
  gains are ordinary income at the flat 4.25% IIT rate, so "income + capital
  gains" = the whole IIT line.
- Uncap uplift **$8.3B ÷ $11.4B ≈ 72%**. Shortfall ≈ **$3.1B**.
- Full replacement through the property base would need ≈ **46.7 avg mills on
  SEV** vs 42.21 today — i.e. uncap *and* ~11% higher millages. Alternatives:
  uncap + keep a ~1.2% flat income tax, or pair uncapping with a broader sales
  tax base (services) for the remainder.

Who gains/loses is a *distribution* question, not a revenue one: ≈ $8.3B/yr
shifts from income-earners onto owners of long-held (mostly residential)
property — a transfer from renters/workers toward incumbent owners' tax bills,
offset by their share of the income-tax cut.

## Answer 3 — Turnover from older → younger owners: **≈ +4.8k–12k sales/yr**

Mechanism: the capped TV is a **lock-in subsidy** — selling forfeits it, so
long-tenure (disproportionately older) owners stay put. Remove the cap and the
subsidy vanishes: holding the house no longer beats selling.

Calibration (defaults, adjustable in the worker):

- Baseline: **105,862** closed sales in 2024 (Realcomp MLS, ~most of the state),
  median $265k.
- Locked-in cohort ≈ **45%** of sellers (long-tenure owners with material
  TV discounts).
- Mobility lift **10–25%** for that cohort — anchored on Ferreira (2010,
  *J. Public Econ.*): when CA Props 60/90 made Prop 13 benefits portable,
  55-year-old owners' mobility was **~25%** higher than 54-year-olds'.

**Estimate: +4.8k to +11.9k additional transactions/yr (+4.5–11.3% of
baseline)**, front-loaded: once the subsidized stock turns over, the lock-in is
gone permanently and turnover settles above today's level. Effect concentrates
in the oldest-owner neighborhoods — exactly where TV/SEV ratios are lowest.

## Answer 4 — Prices for young buyers: **−1.5% to −3.1% on the residential stock, with a caveat**

The honest subtlety the premise misses: **a buyer already pays tax on full
SEV** — the seller's capped TV dies at closing. So the cap's subsidy is a
wealth transfer to incumbents, not a wedge embedded in purchase prices. Young
buyers' price relief comes through two channels, not direct capitalization:

1. **Supply**: the turnover above adds inventory in older-owner neighborhoods.
2. **Carrying cost**: ~$6.2B/yr more residential tax raises the user cost of
   holding, partially capitalizing into lower values.

Modeled: PV of residential uplift at a 5% discount rate, 25–100%
capitalization share → **−1.5% to −3.1%** on ≈ $994B residential market value.
Offsetting it: the income-tax cut raises buyer purchasing power, pushing prices
back up — the *net* is ambiguous and county-specific. Michigan's version is
weaker than the Prop 13 literature (Sommer & Sullivan, *AEJ: Macro* 2018)
because MI taxes can't be inherited at all — the discount never transfers.

## What this model does NOT capture

- **Headlee**: millage rollbacks and voter-approval requirements could shave
  realized uplift; a statutory base change's interaction with Headlee is
  legally untested.
- Demand-side feedback from the income-tax cut; migration response.
- Legal pathway: repealing the cap requires a constitutional amendment.
- Timing: uncapping all at once vs phased.

## Data & reproduction

| Source | Used for |
|---|---|
| [2024 Ad Valorem Property Tax Report](https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Tax-Levy-Reports/2024-Ad-Valorem-Tax-Levy-Report.pdf) (Treasury Form 625) | County TV, levies, avg millages; statewide series 2004–2024 |
| [STC 2024 Annual Report](https://www.michigan.gov/mdhhs/-/media/Project/Websites/treasury/STC/2024/2024-Annual-Report.pdf) | Appendix 3: county SEV by class; class-level statewide SEV/TV |
| [STC 2025 Annual Report](https://www.michigan.gov/treasury/-/media/Project/Websites/treasury/STC/2025/2025-Annual-Report.pdf) | 2025 class values (gap now $224.6B) |
| [Treasury Property Tax Report (2022 data)](https://www.michigan.gov/treasury/-/media/Project/Websites/treasury/ORTA/Economic-Reports-Notices/FY-2025/PropTaxReport_2022.pdf) | $5.43B/2022 official cap-savings estimate |
| [Realcomp 2024 annual](https://realcomp.moveinmichigan.com/Portals/0/StatisticsDocuments/YearSummaries/Realcomp_ANN_2024.pdf) | 105,862 sales, $265k median |
| Census STC / [SFA monthly revenue](https://sfa.senate.michigan.gov/Publications/MonthRev/mrroct24.pdf) | Net IIT ~$11.4–12.1B |
| Ferreira (2010), *JPubE* 94(3) | Lock-in mobility lift ~25% at age 55 |
| Sommer & Sullivan (2018), *AEJ:Macro* 10(2) | Prop 13 equilibrium: turnover ↑, prices ↓ |

Reproduce: `python3 scripts/parse_treasury_pdfs.py` regenerates `data/*.json`
(verified: county sums match statewide totals exactly). The worker exposes the
same model at `/api/model` with every parameter overridable by query string.
