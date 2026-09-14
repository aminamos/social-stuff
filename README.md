# Social Tokens Projects

A collection of high-leverage computational and AI agent systems directing LLM inference tokens toward structural transparency, public-interest data unmasking, and collective civic power.

---

## The Philosophy: Where Should Tokens Go?

The vast majority of modern token expenditure is consumed by customer service chatbots, marketing copy generation, automated engagement farming, and code assistants for software companies. 

**Social Tokens Projects** flips the resource equation: directing agentic multi-turn LLM reasoning, document ingestion, and graph entity resolution toward systemic material asymmetries—breaking through bureaucratic obfuscation, corporate shell structures, regulatory capture, and information bottlenecks that disempower ordinary people.

```
                    ┌──────────────────────────────────────────────┐
                    │          Social Tokens Architecture          │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐              ┌──────────────────┐
│ Messy Public Data│             │ Agent Reasoning  │              │ Collective Power │
│ Municipal rolls  │ ──────────► │ Entity resolution│ ───────────► │ Tenant unions    │
│ SOS registrations│  (Tokens)   │ Crossover parsing│  (Knowledge) │ Mutual aid       │
│ Liens & permits  │             │ Graph synthesis  │              │ Citywide action  │
└──────────────────┘             └──────────────────┘              └──────────────────┘
```

---

## Project Index

| # | Project Name | The Material Problem | Where Tokens Go | Status |
|---|--------------|----------------------|-----------------|--------|
| **01** | [**Eviction Defense & Right-to-Counsel Navigator**](01-eviction-defense-navigator/README.md) | Tenants face accelerated eviction timelines and complex court procedures without counsel, resulting in avoidable defaults. | Ingesting judicial court dockets, statutory defenses, and housing notices to draft verified answers, fee waivers, and discovery requests. | **Starter** |
| **02** | [**Corporate Shell Entity & Slumlord De-anonymization**](file:///E:/Development/social-tokens-projects/02-corporate-shell-deanonymizer/README.md) | Corporate landlords fragment ownership across hundreds of single-property LLCs to shield themselves from code enforcement, liability, and tenant organizing. | Ingesting municipal tax rolls, Secretary of State business filings, housing inspection violations, and mortgage deeds to reconstruct full ownership graphs and union dossiers. | **Active** |
| **03** | *Wage Theft & Subcontractor Chain Tracer* | General contractors isolate liability through multi-tiered subcontractor labor chains to evade wage theft judgments. | Ingesting certified payroll records, mechanics liens, prevailing wage audits, and corporate registration crossovers to trace ultimate liability up the chain. | *Planned* |
| **04** | *Hospital Price Transparency & Medical Bill Auditor* | Hospital charge-masters and medical billing departments weaponize opaque billing codes against uninsured and out-of-network patients. | Parsing itemized hospital bills against CMS price transparency machine-readable files (MRFs) and statutory dispute resolution rules. | *Planned* |
| **05** | *Environmental Permit & Toxic Release Monitor* | Industrial polluters fragment permits across subsidiaries, obfuscating cumulative neighborhood emissions and environmental justice impact. | Correlating EPA TRI records, state air quality permits, OSHA citations, and continuous monitoring sensor logs into community alert maps. | *Planned* |
| **06** | [**SSDI Hearing-Stage Pilot**](06-ssdi-hearing-pilot/README.md) | Disability claimants face denial-heavy back-office workflows and missed deadlines before ALJ hearings, reducing win rates and delaying backpay. | Running a fixed 5-step pipeline (notice parse, deadline calendar, record requests, evidence chronology, draft pre-hearing brief) with attorney/EDPNA sign-off. | **Starter** |

---

## Getting Started

Explore Project 2:
```bash
cd 02-corporate-shell-deanonymizer
python -m pip install -r requirements.txt
python -m pytest
python -m src.cli investigate --address "1420 11th Ave S"
```
