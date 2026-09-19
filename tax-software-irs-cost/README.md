# Cost to Build Tax Software + Pass IRS Checks

Short answer: the IRS itself charges **~$0** for e-file approval. Almost all the cost is **building correct tax logic + MeF XML + security + yearly updates + support**.

## Ballpark (2026, US)

| Scope | Year-1 build | Yearly keep-alive |
|---|---|---|
| MVP: federal 1040-only, single state, MeF e-file, basic UX | **$75k–$250k** outsourced / **$200k–$500k** US in-house | **$100k–$250k** |
| Competitive consumer app (all states, imports W-2/1099, PDF, mobile, bank/IRS payments) | **$500k–$2M+** | **$250k–$600k+** |
| Pro / enterprise (1120/1065/990, bulk, API, multi-user, states) | **$1M–$5M+** | **$400k–$1M+** |
| Security / audits / hosting (any scope) | — | **$25k–$100k/yr** (SOC 2, pen tests, monitoring, DR) |
| Reference point: IRS Direct File pilot | — | IRS projected **$64M–$249M/yr** to run; GAO said estimate was incomplete, startup costs missing. 80%+ was customer support at scale. |

Why so wide? Tax logic + yearly churn. Every tax year the IRS changes schemas, business rules, and test cases, and every state does the same. You rebuild/test/recertify **every year**.

## Where the money goes

1. **Tax engine + forms (30–40%)** — 1040 + schedules, calculations, eligibility, state logic. Needs a CPA/EA + devs together. One missed worksheet = failed return. ATS compares your output against IRS-computed answers, so the engine must be exact.
2. **IRS MeF integration (15–25%)** — XML generation per Pub 4164 schemas, submissions, acknowledgements, error-code handling, retransmits, state engines.
3. **Security + hosting (10–20%)** — PII encryption at rest/in transit, access controls, logging, SOC 2 / pen test, secure hosting. Budget **$25k–$100k/yr** for audits/infra alone.
4. **ATS testing + certification (5–10%)** — free to take, expensive to pass: build harnesses for IRS test returns, fix calc/XML mismatches, repeat per form and per year.
5. **UX, onboarding, imports, e-sign, payments (10–20%)**
6. **Support (the killer)** — IRS found support dominates at scale. Even small vendors need tax-season staff. See `llm-unlimited-tokens.md` for how cheap tokens change this.

Ongoing maintenance rule of thumb for SaaS (15–20% of build/yr) **understates** tax software — plan **30–50%** because of annual law + schema churn.

## IRS regulatory path (no fee, but mandatory)

1. **Become an Authorized e-file Provider** — apply via IRS e-Services, get an **EFIN**, pass suitability check (Pub 3112).
2. **Build to Pub 4163 + 4164** — MeF schemas, business rules, transmission specs.
3. **Pass Assurance Testing System (ATS)** — IRS publishes test returns; you submit them as XML; e-help desk verifies calcs + XML round-trip. Must pass **per return type, per tax year**.
4. **Get listed, then repeat yearly** — new schemas/tests each year, retest before filing season. States each have their own Fed/State MeF approval on top.
5. **Protect data** — Pub 1075 / Safeguards mindset for return data, breach notification, WISP (Written Information Security Plan) now expected for preparers/providers.

Details + links: see `irs-approval-checklist.md`.

## Timeline

- Months 0–2: rules engine for the 1040 + core schedules, known-answer test harness (this repo's `tax-engine/` is the start).
- Months 2–4: MeF XML output, transcript/`lines` plumbing, interview UI.
- Months 3–6 (parallel): e-file provider application + **EFIN** suitability (**4–8 weeks**), then ATS testing per form type.
- MVP build + ATS pass (1040-only): **4–9 months** total.
- Full multi-state launch: **9–18 months**; year 2+ states each have their own MeF schema + approval process.
- Recertification: **every fall** before filing season.

## Decision drivers

- 1040-only vs. also business/exempt-org returns (1120/1065/990)
- Number of states at launch — states multiply scope fast
- Build the transmitter vs. use a third-party transmitter (cuts dev cost, adds per-return fees and a vendor dependency)
- In-house dev vs. outsourced vs. white-label/licensing a calc engine

## Cheapest viable path

1. Start **one return type** (1040), **one state**, transmit-only via MeF.
2. Use a third-party e-file transmitter/API first, then bring MeF in-house.
3. Budget year 2 on day 1 — the second tax year is not optional.

*Sources: IRS "How tax preparation software is approved for electronic filing" (ATS process), IRS Pubs 3112/4163/4164 + MeF guides, IRS Direct File cost report + GAO critique, general SaaS MVP/maintenance ranges. IRS fees verified $0; build ranges are market estimates, not quotes.*
