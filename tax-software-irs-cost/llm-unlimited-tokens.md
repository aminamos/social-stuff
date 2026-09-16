# Same question, but with ~free, ~unlimited LLM tokens

Recreated from the original research notes.

## TL;DR

Cheap tokens cut the build cost roughly in half — they do **not** touch the
IRS requirements. Revised ranges: 1040-only MVP **~$25k–$100k** with a tiny
team; competitive consumer product **~$200k–$700k**. A 2–3 person team
(dev + part-time CPA + QA) can ship in 3–6 months.

## What gets cheap with free tokens

- Boilerplate: MeF XML plumbing, form-schema bindings, interview/UX copy.
- Test harness generation: turn the published ATS test cases into
  known-answer tests automatically.
- Annual churn: diff each year's new IRS pubs/schemas into code drafts for
  human review.
- Document intake: W-2/1099 extraction, prior-year import.
- Support: the biggest per-user cost at scale — plain-English explanations,
  refund-where-is-it, amendment guidance. Token cost itself is noise
  (~$500–$5k/yr even without the "unlimited" assumption).

## What doesn't change

- **ATS still demands exact calculations and valid XML.** IRS compares your
  outputs to theirs; hallucinated math fails.
- **EFIN/suitability, state approvals** — human legal processes with real
  calendars.
- **Security/compliance**: SOC 2, pen tests, Pub. 4557 safeguarding,
  secure hosting — still ~$25k–$100k/yr.

## The one rule

**Keep LLMs out of the math path.** All tax math lives in a deterministic
rules engine (`tax-engine/`); the LLM may call it as a tool but never
computes. An eval harness of known-answer returns blocks deploys on any
mismatch — unlimited tokens make hallucinations cheaper to produce, not
less liable. A wrong refund is still your bug.

## Where to reinvest the savings

- 2× the regression/known-answer test coverage.
- Better MeF reject-code recovery and state-engine tooling.
- Verification is the bottleneck now, not writing code.
