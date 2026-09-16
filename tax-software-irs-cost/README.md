# Tax Software + IRS Approval: What It Costs

Recreated from the original research notes (the laptop copy was never
committed). If the originals resurface, reconcile by hand.

## TL;DR

**IRS approval itself costs ~$0 in fees.** The spend is building, testing,
securing, and supporting the software.

| Scope | Year-1 build | Notes |
|---|---|---|
| MVP: federal 1040 + e-file only | ~$75k–$250k outsourced | ~$200k–$500k with a small US in-house team |
| Competitive consumer product (all states, imports, mobile) | ~$500k–$2M+ | states multiply scope fast |
| Annual keep-alive | ~$100k–$600k+ | tax law + IRS/state schemas change every year |
| Security / audits / hosting | ~$25k–$100k/yr | SOC 2, pen tests, monitoring, DR |

For scale reference: the IRS projected **$64M–$249M/year** to run its own
Direct File — mostly customer support. Support is the cost everyone
underestimates.

## Timeline sketch

- Months 0–2: rules engine for the 1040 + core schedules, known-answer test
  harness (this repo's `tax-engine/` is the start).
- Months 2–4: MeF XML output, transcript/`lines` plumbing, interview UI.
- Months 3–6 (parallel): e-file provider application (EFIN) + suitability;
  then ATS testing for each form type.
- Year 2+: states, each with their own MeF schema + approval process.

## Where the money actually goes

1. **Calculation engine + test coverage** — must be exact; ATS compares
   against IRS-computed answers.
2. **MeF plumbing** — XML schemas, reject-code handling, state engines.
3. **Security/compliance** — safeguarding taxpayer data (GLBA, Pub 4557),
   SOC 2, encryption, access controls.
4. **Support** — the largest per-user cost at scale; see
   `llm-unlimited-tokens.md` for how cheap tokens change this.

## Decision drivers

- 1040-only vs. also business/exempt-org returns
- Number of states at launch
- Build the transmitter vs. use a third-party transmitter (cuts dev cost,
  adds per-return fees and a vendor dependency)
- In-house dev vs. outsourced vs. white-label/licensing a calc engine
