# IRS Approval Checklist for Tax Software

IRS charges no fee for this process. Time + rework is the cost.

## 1. Become an Authorized IRS e-file Provider
- Apply through IRS e-Services (Form 8633 process, Pub 3112).
- Get an **EFIN** (Electronic Filing Identification Number).
- Pass suitability check on principals (background, tax compliance, criminal history; fines/debts can disqualify).
- Choose provider role(s): software developer, transmitter, ERO — can be the same company or split (many startups outsource transmitting first).
- Allow 4–8 weeks; this is a human legal process — budget weeks, not days.
- Source: https://www.irs.gov/e-file-providers/information-and-technical-guidance-for-software-developers-and-transmitters

## 2. Build to spec
- **Pub 4163** — Information for Authorized IRS e-file Providers.
- **Pub 4164** — Modernized e-File Guide for Software Developers and Transmitters (schemas, business rules, XML).
- **Pub 1346** — Electronic Return File Specifications for Individual Returns.
- MeF Submission Composition Guide + State schema guides.
- Form schemas + business rules are published each fall for the coming season; individual 1040-series is one MeF package, states have their own.

## 3. Pass ATS (Assurance Testing System)
How it works (per IRS "How tax preparation software is approved"):
1. IRS publishes test tax returns + instructions (MeF User Guides page; see Pub 1436 test package).
2. You generate the returns in your software and transmit as MeF XML.
3. e-help Desk checks: (a) calculations match IRS answers, (b) XML formats/transmits/receives/views correctly.
4. On pass, IRS approves that software for e-filing that return type.
5. You may then market it as approved for e-filing.

Must repeat **per supported form (1040, 1120, 990, 1042, etc.) and every tax year**.

Source: https://www.irs.gov/e-file-providers/how-tax-preparation-software-is-approved-for-electronic-filing

## 4. States (separate)
- Most states ride Fed/State MeF but require their own registration + testing.
- Budget per-state QA every year; some states lag IRS schema releases.

## 5. Security / data protection + ongoing compliance
- Written Information Security Plan (WISP) — IRS now expects this from preparers/providers.
- Safeguarding: **Pub 4557** (Safeguarding Taxpayer Data), GLBA Safeguards Rule, IRS Security Summit requirements; TIGTA/GAO reviews possible.
- Encrypt PII at rest + in transit, least-privilege access, logging, MFA.
- Pub 1075 safeguards mindset if handling return data; state breach-notification laws apply.
- Record retention, rejection monitoring, refund/acknowledgment handling, fraud detection duties (suspicious returns, IP PIN).
- Annual e-file provider responsibilities per Pub 3112.
- SOC 2 Type II + annual pen test strongly recommended for any SaaS handling SSNs: ~$25k–$100k/yr.

## 6. Yearly recertification rhythm
- Fall (~November): new schemas + ATS test cases drop → update engine → internal QA → ATS submit → fix → pass. Budgets must assume this annual rebuild cycle forever.
- Winter: filing season support surge.
- Spring/summer: law changes for next year + tech debt.

## Key publications
- Pub 3112 — IRS e-file Application and Participation
- Pub 4163 — MeF Information for Authorized IRS e-file Providers / 1040 schema package
- Pub 4164 — MeF Guide for Software Developers and Transmitters
- Pub 1346 — Electronic Return File Specifications for Individual Returns
- Pub 4557 — Safeguarding Taxpayer Data
- Pub 1436 — Test Package for electronic filers (ATS scenarios)
- irs.gov/e-file-providers — portal + updates

## Practical tips
- Build an ATS harness early: scripted test returns with expected refunds/AGI so calc regressions show instantly. ATS answer mismatches on the core 1040 are the most common blocker — a rigorous known-answer harness pays for itself.
- Log every MeF acknowledgement + error code; retransmit logic is where MVPs fail.
- Keep a tax analyst in the loop — devs alone misread worksheets.
