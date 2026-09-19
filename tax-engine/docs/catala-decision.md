# Decision: Catala for law-to-code encoding

**Status:** decided 2026-09-19
**Recommendation: reference-only — do NOT integrate Catala into the engine.**
Keep the TypeScript engine as the single implementation. Use Catala
selectively as a *differential-testing oracle* for new, high-risk encodings
(e.g. §121 home-sale exclusion, AMT), not as a runtime dependency.

## Context

`tax-engine` is a deterministic TypeScript engine computing TY2025 Form 1040
(+ core schedules) as a Cloudflare Worker. Issue #12 asked whether to adopt
[Catala](https://github.com/CatalaLang/catala) — INRIA's law-to-code language —
for encoding the tax law the engine implements.

## Evidence

### 1. What the Catala ecosystem has for US federal income tax

Almost nothing usable. From first-party sources:

- `CatalaLang/catala-examples` ships a `us_tax_code/` demo described only as
  "the Catala formalization of several sections of the US Tax Code"
  ([README](https://github.com/catalalang/catala-examples/blob/HEAD/README.md)).
- The Catala paper (Merigoux, Chataing, Protzenko, arXiv 2103.03198 — the
  language's own academic reference) states the demo encodes **IRC §121**
  (principal-residence gain exclusion) and explicitly notes that *"finishing
  the formalization of Section 121 is left as future work"* — i.e. even §121
  is incomplete. The Catala book's build example additionally references a
  `Section_132` module (fringe benefits).
- There is **no** Catala encoding of Form 1040, §1 tax brackets, §24 (CTC),
  §32 (EITC), §199A (QBI), §86 (Social Security), §1411 (NIIT), or any other
  section this engine computes. The production-grade encodings are all French
  (family benefits, housing benefits — the biggest Catala case study to date).

Integrating Catala would therefore not mean *reusing* an encoding — it would
mean **writing the entire Form 1040 encoding ourselves**, duplicating the TS
engine line-for-line in a second language.

### 2. Can Catala output run in a Cloudflare Worker?

Technically yes — this is not the blocker.

- Catala has a **JavaScript backend** (confirmed in the catala-examples README:
  "the OCaml, Javascript and Python artifacts"; the paper: the French family
  benefits program was "exposed ... as an OCaml library and JavaScript Web
  simulator"). Plain generated JS runs natively in Workers' V8 isolates; the
  Workers runtime also supports WebAssembly modules.
- Generated JS for programs of this size is KBs to low hundreds of KB — far
  under the Worker script limits (3 MB compressed free / 10 MB paid).
- Tax math is sub-millisecond; CPU-time limits are a non-issue. No Node.js
  APIs needed.

### 3. Licensing

The Catala compiler and the code in its repos are released under
**Apache License 2.0** (per the project README's License section), unless a
sub-directory states otherwise. No legal blocker for use or redistribution.

### 4. The real costs

- **The compiler is research-grade.** Its own README disclaims: "Catala is a
  research project from Inria... The compiler is yet unstable and lacks some
  of its features." Depending on it means an OCaml/dune toolchain in our
  build and tracking an unstable compiler's output for a tax-filing product.
- **IRS line ordering is a feature.** The engine deliberately follows IRS
  worksheet line order (`1040.15`, `sch1.20`, ...) so outputs map 1:1 onto
  forms and MeF XML. Catala's default-logic semantics would restructure the
  computation away from that audit-friendly ordering.
- **Maintenance doubles.** Every TY parameter update (Rev. Proc., OBBBA-style
  law changes) would need to land in two implementations and stay in sync —
  with zero upstream US-tax encodings to share the work.

## The hybrid option (adopted in limited form)

Where Catala *does* add value is as an independent second implementation for
**differential testing** of new, high-risk encodings:

- If we ever model §121 (home-sale exclusion — currently unmodeled) or AMT
  (currently a permanent diagnostic), write the Catala version *first* as the
  literate, lawyer-readable spec, compile it with the JS backend, and fuzz
  the TS implementation against it in `test/`.
- The literate-programming format (law text interleaved with code) is also
  strong supporting documentation for IRS ATS conversations — a Catala
  encoding of a section reads as an annotated reading of the statute, which
  is exactly the artifact a reviewer wants.

Concretely: Catala lives in `test/` tooling and docs, never in `src/` or the
Worker bundle. No `catala` build step in CI until a concrete encoding
justifies it.

## Jev integration: workflow assistance only, never legal authority

A plausible Jev (TypeSafe) integration exists — but strictly around the
legal-programming *workflow*, not as a decider of what the law means.

Jev is a fit for typed triage over legal text and diffs:

- classifying clauses as computational, definitional, exception, or
  human-review-only;
- prioritizing which legal changes actually require Catala code updates;
- selecting relevant edge-case tests from a finite test taxonomy;
- flagging ambiguous or internally inconsistent provisions;
- routing issues to compiler, domain-expert, or lawyer review.

The safe architecture is a pipeline, not a replacement:

```
legal text / diff
    ↓
Jev: typed triage + confidence
    ↓
human review
    ↓
Catala source + compiler + tests
    ↓
authoritative legal computation
```

Hard line: Jev must not determine eligibility, tax liability, or statutory
meaning. Catala's deterministic implementation and human legal review remain
the authority. Jev supplies probabilistic judgment about *process*; Catala
supplies mechanically checked answers about *law*.

Bend is a weaker fit for direct integration along the same lines: Jev could
help its surrounding tooling (choosing CPU/C/Rust/CUDA execution paths,
classifying compiler errors, selecting candidate optimization passes,
triaging GitHub issues, deciding whether generated code needs human review)
but must never replace Bend's compiler, LAWS.bend, type checks, or formal
proofs — Bend's value is mechanically checked code and massively parallel
execution, Jev's is probabilistic routing.

Current Jev-integration ranking, most to least promising:

1. political-bias-llm-eval — direct closed-label classification.
2. Catala tooling — meaningful but safety-constrained (this section).
3. Bend tooling — routing and triage only, not core language semantics.

## Decision

**Reference-only.** Do not integrate Catala into the runtime engine.

- The ecosystem offers no reusable US federal income tax encoding; we'd be
  writing it all ourselves on an unstable research compiler.
- The TS engine is already further along than anything Catala-side for 1040.
- Feasibility (JS backend → Workers) and licensing (Apache 2.0) are both
  fine — the decision rests on cost/benefit, not technical blockers.

Revisit if a maintained, complete US federal 1040 encoding appears upstream
in the Catala ecosystem.
