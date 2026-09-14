# SSDI Hearing-Stage Pilot — Scope (N=50–100)

Source: prior session verdict — welfare-sludge domain; fee rail is SSDI/SSI at the ALJ hearing stage (25% of backpay, capped $9,200, SSA withholds and pays). This scope covers the harness only. No real cases, no filings, no representation in this phase.

## 1. Objective
Run N=50–100 real cases (once a partner office is secured) through a fixed 5-step back-office pipeline, with a licensed attorney / EDPNA as the sole signing layer. Measure exactly three things against the office baseline: win rate, days from retention to filing, dollars recovered per case. Token cost per case is a footnote.

## 2. Non-goals for scoping phase
- No client contact, no SSA filings, no representation by the agent.
- No intake build (intake is solved: GetCalFresh, Propel, mRelief already distribute).
- No VA track yet — VA reuses this harness minus the rule corpus.
- No optimization of token spend; optimize record acquisition and deadline adherence instead.

## 3. Pipeline (fixed, in order)
1. **Notice parse** — input: denial / hearing-notice PDF or scan. Output: structured fields (claimant ID, denial date, appeal deadline, ALJ office, issues stated). Reject unreadable scans to a human queue; never guess dates.
2. **Deadline calendar** — input: parsed notice + case retention date. Output: calendar entries for appeal deadline, records-request follow-ups, brief-due date, with a missed-deadline alarm. Deadlines never slip: any parse confidence below threshold blocks downstream steps.
3. **Record request generation** — input: provider list + authorizations. Output: per-facility request letters/packets and a retrieval ledger (requested / received / overdue). Records cost ($150–500/case typical) is tracked here, not token cost.
4. **Evidence chronology** — input: medical records, earnings records, prior decisions. Output: dated event table where every row cites a source span (page/line or exhibit ID). No row without a citation.
5. **Draft pre-hearing brief** — input: chronology + retrieved statute/regulation spans. Output: draft brief for human EDPNA/attorney to sign. Agent never files; human signs, notarizes, appears.

## 4. Draft brief template (max 1–2 pages + exhibits)
- Caption + procedural history (dates, prior denials, hearing date) — each date cited.
- Issues presented (1–3, quoted from notice).
- Statement of facts = chronology subset, one citation per sentence.
- Argument: each legal claim paired to exactly one retrieved statute/regulation span + one record span. No free-form assertions.
- Relief requested + signature block (human only) + exhibit index.
- Rejection rule: any uncited factual or legal sentence fails the draft.

## 5. Grounding / compliance gates (mechanical, per prior-session failure modes)
- **Standing:** SSA-1696 names an individual human; firm/corporation cannot be appointed. Non-attorney direct pay requires EDPNA status. Agent is back office only.
- **MiDAS rule:** automate claims, never denials; agent asserts only grounded spans.
- **DoNotPay/FTC rule:** no claim the tool substitutes for counsel; every pilot brief needs attorney review logged + outcome tracked as empirical evidence.
- **Stanford hallucination rule:** general LLMs 58–88% / legal RAG 17–43% on legal queries — hence the paired-citation rule above and a verification pass that quotes the source text alongside each claim.

## 6. Metrics (only three + footnote)
- **Win rate vs. office baseline:** approvals / dispositions for pilot cohort vs. same office's trailing baseline (same hearing level). Report with N, dates, and exclusion log.
- **Days retention → filing:** median + range; deadline-slip count reported separately (target: zero).
- **$ recovered per case:** authorized fees actually withheld/paid via SSA; report mean/median + total.
- Footnote: tokens and record-retrieval $ per case. Expected ratio per prior analysis: 100–1000:1 on the $9,200 cap if briefs are grounded and deadlines hold.

## 7. Pilot design assumptions (to confirm with partner office)
- Hearing-stage cases only (largest volume: ~277K ALJ dispositions FY2025 at ~50% approval; cleanest rail).
- Office supplies baseline win rate, retention dates, and outcome notices (the verifier).
- N=50 minimum for signal; 100 preferred. Stop rule: >0 deadline slips in first 10 cases pauses the pilot.
- Honest unknown carried forward: representation effect (+20–30pp) is confounded with human record development and advocacy. Assumed edge is completeness + deadline adherence, not persuasiveness. If wrong, this is still a document-processing cost play, smaller.

## 8. Next build steps (not in this scope doc's phase)
1. Case folder schema + exhibit ID convention.
2. Notice parser with confidence thresholds + human queue.
3. Chronology + brief templates as fill-in files.
4. Citation verifier (claim ↔ source-span check).
5. Metrics log (baseline, per-case dates, outcomes, fees, footnote costs).

Verification of this scope: re-read against the prior-session verdict memo; every number above traces to it. No code, no tests, no filings in this phase.
