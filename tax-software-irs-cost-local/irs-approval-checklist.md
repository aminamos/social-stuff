# IRS Approval Checklist for Tax Software

IRS charges no fee for this process. Time + rework is the cost.

## 1. Become an Authorized IRS e-file Provider
- Apply through IRS e-Services (Form 8633 process, Pub 3112).
- Get an **EFIN** (Electronic Filing Identification Number).
- Pass suitability check (background, tax compliance).
- Allow 4–8 weeks.
- Source: https://www.irs.gov/e-file-providers/information-and-technical-guidance-for-software-developers-and-transmitters

## 2. Build to spec
- **Pub 4163** — Information for Authorized IRS e-file Providers.
- **Pub 4164** — Modernized e-File Guide for Software Developers and Transmitters (schemas, business rules, XML).
- MeF Submission Composition Guide + State schema guides.
- Transmitter + Software Developer roles can be same company or split (many startups outsource transmitting first).

## 3. Pass ATS (Assurance Testing System)
How it works (per IRS "How tax preparation software is approved"):
1. IRS publishes test tax returns + instructions (MeF User Guides page).
2. You generate the returns in your software and transmit as MeF XML.
3. e-help Desk checks: (a) calculations match IRS answers, (b) XML formats/transmits/receives/views correctly.
4. On pass, IRS approves that software for e-filing that return type.
5. You may then market it as approved for e-filing.

Must repeat **per supported form (1040, 1120, 990, 1042, etc.) and every tax year**.

Source: https://www.irs.gov/e-file-providers/how-tax-preparation-software-is-approved-for-electronic-filing

## 4. States (separate)
- Most states ride Fed/State MeF but require their own registration + testing.
- Budget per-state QA every year; some states lag IRS schema releases.

## 5. Security / data protection
- Written Information Security Plan (WISP) — IRS now expects this from preparers/providers.
- Encrypt PII at rest + in transit, least-privilege access, logging, MFA.
- Pub 1075 safeguards mindset if handling return data; state breach-notification laws apply.
- SOC 2 Type II + annual pen test strongly recommended for any SaaS handling SSNs: ~$25k–$100k/yr.

## 6. Yearly recertification rhythm
- Fall: new schemas + ATS test cases drop → update engine → internal QA → ATS submit → fix → pass.
- Winter: filing season support surge.
- Spring/summer: law changes for next year + tech debt.

## Practical tips
- Build an ATS harness early: scripted test returns with expected refunds/AGI so calc regressions show instantly.
- Log every MeF acknowledgement + error code; retransmit logic is where MVPs fail.
- Keep a tax analyst in the loop — devs alone misread worksheets.
