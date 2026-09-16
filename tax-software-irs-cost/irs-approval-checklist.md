# IRS Approval Path for Tax Software (e-file)

Recreated from the original research notes. Authoritative sources are the
IRS publications and irs.gov pages linked below — recheck them each year.

## Steps

1. **Apply to be an Authorized e-file Provider** (IRS e-services).
   - Get an **EFIN** (Electronic Filing Identification Number).
   - Pass a **suitability check** on principals (background, tax compliance,
     criminal history; fines/debts can disqualify).
   - Choose provider role(s): software developer, transmitter, ERO.
   - https://www.irs.gov/e-file-providers

2. **Build to MeF (Modernized e-File) specs.**
   - Form schemas + business rules published each fall for the coming season.
   - Individual 1040-series MeF package; states have their own schemas.
   - Publications: **Pub. 4163** (MeF schemas for Form 1040 software
     developers), **Pub. 4164** (MeF guide for software developers and
     transmitters), **Pub. 1346** (electronic return file specs).

3. **Pass ATS (Assurance Testing System).**
   - Free IRS-run testing: submit a battery of test returns via the same MeF
     pipeline used in production.
   - IRS checks: valid XML against the schema, correct business-rule
     application, and **calculated amounts matching IRS answers**.
   - Repeat per form/schedule set supported and **every tax year**.

4. **Compliance obligations after approval.**
   - Safeguarding: **Pub. 4557** (Safeguarding Taxpayer Data), GLBA Safeguards
     Rule, IRS Security Summit requirements; TIGTA/GAO reviews possible.
   - Record retention, rejection monitoring, refund/acknowledgment handling,
     fraud detection duties (suspicious returns, IP PIN).
   - Annual e-file provider responsibilities (Pub. 3112, Application and
     Participation).

5. **States**: each state has its own MeF package + approval/ATS testing;
   some piggyback federal status, some don't.

## Key publications

- Pub. 3112 — IRS e-file Application and Participation
- Pub. 4163 — Modernized e-File (MeF) Information for Authorized IRS
  e-file Providers / 1040 schema package
- Pub. 4164 — MeF Guide for Software Developers and Transmitters
- Pub. 1346 — Electronic Return File Specifications for Individual Returns
- Pub. 4557 — Safeguarding Taxpayer Data
- Pub. 1436 — Test Package for electronic filers (ATS scenarios)
- irs.gov/e-file-providers — portal + updates

## Gotchas

- EFIN suitability is a human legal process — budget weeks, not days.
- ATS answer mismatches on the core 1040 are the most common blocker; a
  rigorous known-answer test harness pays for itself here.
- Every November-ish, new schema packages drop; budgets must assume an
  annual rebuild cycle forever.
