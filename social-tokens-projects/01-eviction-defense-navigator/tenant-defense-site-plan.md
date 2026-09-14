# Tenant Defense Starter Site

## Purpose

Build a public, jurisdiction-specific site that helps tenants get started when they receive an eviction notice or court papers.

The site is **legal information and document organization**, not an autonomous lawyer. Its job is to reduce avoidable defaults, organize facts, identify deadlines, explain official procedures, and connect people to qualified help.
## Pilot scope: Minneapolis and Hennepin County, Minnesota

Start narrowly with **residential eviction cases in Minneapolis**, handled through Minnesota's Fourth Judicial District / Hennepin County Housing Court. Do not initially claim to cover every Minnesota county or every housing dispute.

The pilot corpus should combine:

1. **Minnesota statewide authority**
   - Minnesota statutes and statewide court rules.
   - Minnesota Judicial Branch housing forms and instructions.
   - Minnesota Guide & File, where the official workflow supports the user's situation.

2. **Hennepin and Minneapolis material**
   - Hennepin County Housing Court process and self-help information.
   - Minneapolis ordinances and rental-housing rules.
   - Minneapolis inspection and rental-housing liaison resources.
   - Current legal-aid and tenant-support referrals.

3. **Public court records**
   - Public Hennepin civil case metadata, docket entries, and downloadable documents from Minnesota Court Records Online (MCRO).
   - Redacted, human-reviewed examples of complaints, answers, motions, orders, and judgments.

### Official Minnesota starting points

- [Minnesota Judicial Branch housing and landlord-tenant forms](https://mncourts.gov/getforms/housing-landlord-tenant)
- [Minnesota Eviction Answer packet](https://mncourts.gov/getforms/housing-landlord-tenant/forms-packet-eviction-answer)
- [Minnesota Guide & File](https://www.mncourts.gov/eFile-Guide-And-File.aspx)
- [Hennepin County court information](https://mncourts.gov/find-courts/hennepin)
- [Minnesota Self-Help Centers](https://mncourts.gov/help-topics/self-help-centers/locations)
- [City of Minneapolis renter resources](https://www.minneapolismn.gov/resident-services/property-housing/housing/renting/renters/resources/)
- [Hennepin County eviction prevention](https://www.hennepincounty.gov/services/assistance/housing/eviction-prevention)
- [HOME Line Minnesota](https://homelinemn.org/)
- [Mid-Minnesota Legal Aid](https://mylegalaid.org/get-help)
- [Volunteer Lawyers Network](https://www.vlnmn.org/help/)

The site should link to these sources rather than copy volatile contact details into prompts or static text. Run a scheduled source check and show each source's last-verified date.

## Pulling public case PDFs from Minnesota courts

This is feasible through **MCRO**, but it is not the same as having every tenant case or every filing.

The official [Minnesota Court Records Online (MCRO)](https://mncourts.gov/access-case-records/mcro) page says that users can search:

- cases by party, attorney, case number, and other identifiers;
- documents by case number;
- hearings;
- judgments.

MCRO provides many public district-court documents filed on or after July 1, 2015, including civil case documents, and allows public documents to be downloaded as PDFs without charge. It also states that some case types and older documents are not available remotely. The site instructs users to use a PDF viewer for downloaded documents.

### Recommended case-PDF workflow

1. Use MCRO's case or document search to identify a Hennepin civil eviction case.
2. Record the case number, court, filing date, document type, docket entry, and source URL.
3. Download only documents that MCRO exposes as public and downloadable.
4. Store the original PDF, SHA-256 hash, retrieval timestamp, and provenance metadata.
5. Extract text with page boundaries; retain the original page image for OCR verification.
6. Detect and redact unnecessary personal information before indexing or displaying examples.
7. Classify the document: complaint, answer, affidavit, motion, order, judgment, notice, or other.
8. Have a Minnesota housing lawyer or legal-aid reviewer label representative examples.
9. Keep case documents in a separate corpus from controlling law.
10. Cite the case number, docket/document identifier, page, and MCRO source whenever a case PDF is used.

### Important limits

- Public does not mean safe to republish without review. Court PDFs may contain names, addresses, financial information, medical information, or other sensitive facts.
- A public filing is not necessarily correct law. Pleadings contain one party's allegations; orders and judgments reflect only the decision in that case.
- Published appellate opinions and current statutes are stronger legal authority than ordinary trial-court filings.
- MCRO availability can change, and not every document is remotely available.
- Do not bypass access controls, CAPTCHAs, rate limits, or court-site restrictions. Begin with manual or explicitly permitted retrieval and confirm applicable terms before building an automated downloader.
- Do not bulk-mirror raw tenant files into a public search engine. Prefer a private research corpus, de-identified excerpts, and links back to the official record.

### Case corpus schema

```json
{
  "source": "MCRO",
  "jurisdiction": "Minnesota Fourth Judicial District",
  "county": "Hennepin",
  "case_type": "civil_eviction",
  "case_number": "",
  "document_id": "",
  "document_type": "order",
  "filed_date": null,
  "retrieved_at": null,
  "source_url": "",
  "sha256": "",
  "pages": [],
  "privacy_review": "pending",
  "legal_review": "pending",
  "allowed_for_public_display": false
}
```

Use case PDFs primarily to improve extraction, explain document types, and identify questions for counsel. Do not let similarity to a prior case determine a tenant's legal result.


## Core thesis

Legal-aid and tenant-defense workflows are among the strongest tokens-to-utility opportunities because:

- tenants often face short deadlines and severe consequences;
- many tenants are unrepresented while landlords may have counsel;
- intake materials are messy: notices, leases, ledgers, texts, photos, and court papers;
- document extraction, timeline construction, form assistance, and referral routing are highly automatable;
- a small amount of accurate procedural help can prevent a missed deadline or improve a legal-aid intake.

The safe formulation is:

> **Supervised document extraction and official-form assistance can be a high-value access-to-justice force multiplier.**

Do not describe the product as an autonomous pleading generator or AI lawyer.

## What a non-lawyer can build

A non-lawyer can build a public site that provides:

- general legal information;
- court-process explanations;
- deadline and checklist assistance;
- document OCR and structured fact extraction;
- evidence organization;
- links to official court forms and instructions;
- referrals to legal aid, tenant organizations, court self-help, and emergency services;
- a factual intake summary for a lawyer or legal-aid advocate;
- carefully constrained document assembly from user-confirmed answers.

A disclaimer is useful but is not a complete legal-safety strategy. The product behavior must itself stay on the information, organization, and user-directed form-assistance side of the line. UPL and consumer-protection rules vary by jurisdiction; obtain local legal review before launch.

## What the first version should not do

Do not initially:

- promise a legal outcome;
- say that a user definitely has a defense;
- tell a user to ignore a notice, court paper, or deadline;
- invent or freely draft legal authorities;
- generate a filing-ready pleading without user review;
- automatically file in court;
- provide nationwide answers from a single undifferentiated knowledge base;
- rely on a general-purpose LLM's memory of landlord-tenant law;
- expose user documents or use them for model training without explicit, informed consent;
- treat all public tenant cases as the complete or controlling record.

## Recommended first product: Tenant Case Starter

### User flow

1. **Choose jurisdiction**
   - State, county/city, and court if known.
   - If unsupported, stop and provide general emergency guidance plus referrals.

2. **Identify the situation**
   - Notice from landlord.
   - Summons and complaint.
   - Court date already scheduled.
   - Lockout or utility shutoff.
   - Rent, repair, deposit, retaliation, or discrimination issue.

3. **Upload or photograph documents**
   - Notice.
   - Summons and complaint.
   - Lease.
   - Rent ledger or payment records.
   - Text messages and emails.
   - Repair requests and inspection records.
   - Photos or videos.

4. **Extract facts**
   - Names and addresses.
   - Court and case number.
   - Document type.
   - Service date.
   - Stated deadline.
   - Court date.
   - Amounts claimed.
   - Lease dates and rent amounts.
   - Alleged breach.

5. **Require confirmation**
   - Show the source page or image beside every extracted field.
   - Mark uncertain OCR and conflicting dates.
   - Never silently resolve contradictions.

6. **Produce a starter packet**
   - Deadline checklist.
   - Chronological factual timeline.
   - Evidence index.
   - Plain-language explanation of the next procedural step.
   - Official court forms and instructions.
   - Legal-aid and court-self-help referrals.
   - Questions to ask a lawyer or advocate.

7. **Optional controlled form assistance**
   - Populate an official form only from user-confirmed answers.
   - Preserve the official form's wording and structure.
   - Clearly label the output as an unreviewed draft.
   - Require the user to inspect every answer before export.

## Grounding architecture

Cases alone are not sufficient grounding. Tenant matters depend heavily on current statutes, ordinances, court rules, forms, service requirements, and local procedure.

### Source hierarchy

1. **Official controlling sources**
   - State statutes.
   - City and county ordinances.
   - Court rules.
   - Official court forms and instructions.
   - Official court self-help pages.
   - Current fee schedules and e-filing instructions.

2. **Reviewed explanatory sources**
   - Legal-aid organizations.
   - LawHelp and state LawHelp portals.
   - Court-approved self-help materials.
   - Tenant organizations, where reviewed for accuracy and date.

3. **Case law**
   - Published and precedential cases where applicable.
   - Same jurisdiction first.
   - Current and validity-checked.
   - Used to explain legal concepts or identify questions, not to replace current primary law.

4. **Public case records and outcomes**
   - Useful for research and examples.
   - Do not treat them as representative: many housing cases end in defaults, settlements, or stipulations and never become published precedent.
   - Redact or avoid unnecessary personal information.

### Retrieval rules

Every retrieved source should carry:

- jurisdiction;
- court or issuing authority;
- source type;
- effective date;
- publication or update date;
- retrieval date;
- stable URL or document identifier;
- version/hash when stored locally.

Retrieval must filter by jurisdiction and source date before generation. Do not embed-search a national corpus and let the model choose a local rule based on wording similarity.

Every legal proposition shown to a user should link to the source passage that supports it. If the system cannot retrieve a controlling source, it should say that it cannot verify the point.

## Separate facts from law

Maintain two independent objects:

### User facts

Examples:

- `service_date`
- `court_date`
- `response_deadline_as_printed`
- `amount_claimed`
- `rent_payments`
- `repair_requests`
- `lockout_alleged`

Facts come from user documents and user confirmation. The system must not rewrite them to fit a legal theory.

### Legal sources

Examples:

- notice-period rule;
- response deadline rule;
- approved answer form;
- fee-waiver instructions;
- local filing method;
- habitability statute;
- retaliation statute.

Legal sources come from the versioned jurisdictional corpus. The model may connect facts to source-backed questions, but it must not manufacture a conclusion when an element is missing or uncertain.

## Safe output categories

Prefer outputs in this order:

1. **Directly extracted fact**
   - “Your uploaded summons lists March 14 as the court date.”

2. **Procedural instruction from an official source**
   - “The court’s instructions say a tenant must respond using Form X.”

3. **Source-backed issue flag**
   - “Your timeline includes a repair complaint before the notice. Ask a qualified advocate whether retaliation rules apply.”

4. **Attorney intake summary**
   - “Here are the facts and documents to send to legal aid.”

Avoid unsupported individualized advice:

- “You definitely have a retaliation defense.”
- “The landlord’s case is invalid.”
- “You will win.”
- “You do not need to respond.”

## Emergency routing

The product should visibly escalate rather than continue ordinary automation when it detects:

- a court deadline within a configured window;
- a lockout or threatened lockout;
- utility shutoff;
- a writ or sheriff notice;
- domestic violence or safety concerns;
- disability or language-access needs;
- immigration or criminal consequences;
- a minor or dependent adult at risk;
- conflicting dates that could change the response deadline.

Provide local legal-aid, court self-help, 211, tenant-organization, and emergency-service links. Do not claim that a referral guarantees representation.

## Privacy and security requirements

Tenant documents contain highly sensitive personal information. The initial release should:

- avoid retention by default;
- encrypt uploads in transit and at rest;
- delete raw files on a short, disclosed schedule;
- provide an immediate delete button;
- minimize logs and never log document contents by default;
- redact Social Security numbers, bank details, and unnecessary identifiers;
- avoid using user documents for model training;
- disclose every third-party OCR, storage, and model provider;
- avoid advertising trackers on sensitive intake pages;
- use separate access controls for user files and aggregate analytics;
- maintain an incident-response and deletion procedure.

## LLM behavior contract

The model should be instructed to:

- answer only from retrieved, jurisdiction-matched sources and confirmed user facts;
- cite source IDs for every legal proposition;
- distinguish extracted facts, user statements, source rules, and inferences;
- ask for confirmation when dates or names conflict;
- never invent citations, statutes, cases, forms, deadlines, or court procedures;
- refuse unsupported jurisdictions;
- avoid predicting outcomes;
- surface uncertainty explicitly;
- recommend human help for urgent or high-risk cases;
- produce a factual summary rather than a legal conclusion when the source set is incomplete.

Illustrative system contract:

```text
You are a tenant-information and document-organization assistant.
You are not a lawyer and must not present individualized legal conclusions.
Use only the confirmed user facts and the jurisdiction-filtered sources provided.
For every procedural or legal statement, cite the supporting source ID.
Never invent a citation, deadline, court form, rule, case, or quotation.
If sources conflict or are stale, report the conflict and direct the user to
an official court or qualified legal-aid provider.
Separate extracted facts from legal information and from questions for counsel.
Do not tell the user to ignore a notice or deadline.
Before producing any form draft, require confirmation of every populated field.
```

## Technical design

### Ingestion

- PDF/image upload.
- Local or private OCR where possible.
- Page-level text and bounding boxes.
- Document classification: notice, complaint, lease, ledger, correspondence, evidence.
- Virus scanning and file-type validation.

### Extraction

Use a strict schema. Example:

```json
{
  "document_type": "summons_and_complaint",
  "jurisdiction": "",
  "court": "",
  "case_number": "",
  "parties": [],
  "service_date": null,
  "court_date": null,
  "deadline_as_printed": null,
  "amounts": [],
  "allegations": [],
  "uncertainties": [],
  "source_spans": []
}
```

Do not allow free-form extraction to directly populate a court filing. Use validation, user confirmation, and an audit trail.

### Rules engine

Keep deterministic calculations separate from the LLM:

- date arithmetic;
- deadline display;
- jurisdiction routing;
- document completeness checks;
- official-form selection;
- referral lookup.

The model can explain the result, but should not calculate critical deadlines from prose without a deterministic check and user confirmation.

### Retrieval

Use metadata filters before semantic retrieval:

```text
jurisdiction = selected_jurisdiction
source_status = current
source_type in allowed_types
```

Then retrieve the smallest set of relevant passages. Store source provenance with every response.

### Form generation

Prefer:

1. official fillable form;
2. deterministic form assembly from confirmed fields;
3. human-readable draft summary;
4. LLM prose only where the official workflow permits it.

Do not create a visually similar replacement for an official court form unless a qualified reviewer confirms that it is accepted.

## Rollout plan

### Phase 1: Minneapolis / Hennepin information pilot

- Minnesota Fourth Judicial District and Hennepin County Housing Court.
- Residential eviction cases involving Minneapolis tenants.
- Official Minnesota housing process guide and HOU202 answer workflow.
- MCRO case/document links and a private, provenance-preserving PDF research corpus.
- Deadline/document extraction.
- Minneapolis and Hennepin referral directory.
- Evidence timeline.
- No generated legal conclusions.
- No automatic filing.

### Phase 2: reviewed form assistance

- Use the official Minnesota answer form or Minnesota Guide & File workflow.
- Add deterministic field mapping.
- Add source citations and confirmation screens.
- Have a Minnesota housing attorney or legal-aid organization review test cases.

### Phase 3: supervised partnerships

- Partner with Hennepin legal aid, HOME Line, a tenant organization, law-school clinic, or court self-help office.
- Add advocate review queues only with explicit consent and secure access.
- Measure whether referrals are completed and whether users avoid missed deadlines.

### Phase 4: expansion

- Add another Minnesota jurisdiction only after maintaining source freshness, local review, and operational support for Hennepin.
- Never expand merely by adding a national case-law index.



## Evaluation and acceptance criteria

Before public launch, test with synthetic or consented cases covering:

- notice versus summons classification;
- unreadable or incomplete scans;
- conflicting dates;
- multiple tenants;
- incorrect amount calculations;
- unsupported jurisdictions;
- a deadline that falls on a weekend or holiday;
- a lockout or utility-shutoff escalation;
- a stale source replaced by a current source;
- a source conflict;
- a user changing a confirmed fact;
- deletion of uploaded documents.

The system must:

- preserve user-entered facts exactly unless the user edits them;
- show uncertainty rather than guess;
- cite the source behind each procedural claim;
- never invent a legal authority;
- route urgent cases to human help;
- produce a usable factual packet even when it cannot determine a legal issue;
- fail closed for unsupported jurisdictions.

Useful outcome metrics:

- percentage of users who identify the correct document type;
- percentage who receive and confirm the correct deadline source;
- completed legal-aid referrals;
- reduction in incomplete intake packets;
- extraction error rate by field;
- citation/source accuracy;
- deletion compliance;
- rate of unsafe or unsupported answers.

Do not optimize only for generated-document count. The meaningful outcome is whether a tenant reaches the right human or official process in time with better-organized facts.

## Sources and reference models
- [Minnesota Judicial Branch: Housing and landlord-tenant forms](https://mncourts.gov/getforms/housing-landlord-tenant) — official statewide forms.
- [Minnesota Eviction Answer packet](https://mncourts.gov/getforms/housing-landlord-tenant/forms-packet-eviction-answer) — official answer workflow, including HOU202.
- [Minnesota Court Records Online (MCRO)](https://mncourts.gov/access-case-records/mcro) — official public case/document search and PDF access rules.
- [Minnesota Guide & File](https://www.mncourts.gov/eFile-Guide-And-File.aspx) — official guided filing workflow.
- [Hennepin County court information](https://mncourts.gov/find-courts/hennepin) — Fourth Judicial District resources.
- [Minnesota Self-Help Centers](https://mncourts.gov/help-topics/self-help-centers/locations) — official self-help locations and information.
- [City of Minneapolis renter resources](https://www.minneapolismn.gov/resident-services/property-housing/housing/renting/renters/resources/) — current city housing, legal-aid, and financial-assistance referrals.
- [Hennepin County eviction prevention](https://www.hennepincounty.gov/services/assistance/housing/eviction-prevention) — county prevention and assistance resources.
- [HOME Line Minnesota](https://homelinemn.org/) — statewide tenant education, advocacy, and legal-help referral.
- [Mid-Minnesota Legal Aid](https://mylegalaid.org/get-help) — legal-aid intake.
- [Volunteer Lawyers Network](https://www.vlnmn.org/help/) — volunteer legal services.

- [California Courts: Eviction cases](https://selfhelp.courts.ca.gov/eviction) — example of official, jurisdiction-specific procedural self-help.
- [California Courts: Eviction forms](https://selfhelp.courts.ca.gov/eviction-forms) — example of official forms and instructions.
- [LawHelp.org: Rent and eviction resources](https://www.lawhelp.org/resource/rent-and-eviction-help-resources) — legal-aid referrals, self-advocacy resources, and LawHelp Interactive.
- [LawHelp Interactive](https://lawhelpinteractive.org/) — example of free guided legal-document assembly.
- [ABA: AI for legal use](https://www.americanbar.org/groups/law_practice/resources/law-practice-magazine/2025/september-october-2025/ai-for-legal-use/) — professional-responsibility and verification context.

## Bottom line

Build a **tenant case starter**, not an autonomous legal representative:

> upload papers → extract and confirm facts → identify the official next step → organize evidence → prepare questions and a factual intake packet → connect the tenant to official forms and human help.

That is technically achievable, materially useful, and safer than promising an automated pleading that can independently interpret local law.
