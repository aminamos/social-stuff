#!/usr/bin/env python3
r"""
Triage owner_entity_review pending items in social-housing-db.

Reads data/reports/pending_review_raw.json (wrangler --json output; pull with:
  npx wrangler d1 execute social-housing-db --remote --json --command "SELECT ... "
) and emits:
  - data/reports/review_triage_report.json  (full decisions + evidence)
  - data/reports/review_triage_report.md    (human-readable shortlist)
  - data/reports/sql/reject_*.sql, approve_*.sql  (chunked UPDATEs)

Decision rules
--------------
multi_jurisdiction_name (reason='multi_jurisdiction_name'):
  REJECT  R_NUMERIC  — normalized name leads with a pure number:
                       pattern ^\d+(st|nd|rd|th)?(\s|$) e.g. '14 llc',
                       '511 holdings llc', '340 wilson llc', '18th street
                       property llc'. Address-derived LLC names are per-city
                       coincidences, not networks.
  REJECT  R_PLACEHOLDER — compound placeholder compounds like 'xyz properties'.
  REJECT  R_PERSON   — pure person names: no business token, 1-3 alphabetic
                       tokens (bare surnames from the "LASTNAME, FIRST"
                       comma-split normalization AND 'first last' pairs).
                       Two people in different cities share names constantly;
                       a name-only match can never be evidence on its own.
                       Parcel size does not rescue these (different "JONES,
                       DAWN" vs "JONES, PAULA" are still different people).
  KEEP    K_ORG      — non-person names containing institutional tokens
                       (bank|mellon|army|salvation|secretary|nation|trust|
                       mortgage|servicing|storage|opendoor|sfr\d|financial):
                       real orgs plausibly owning in multiple cities.
  Biz-token names (COMPANY_RE): KEEP pending if total_parcels >= 8 AND
                       min(parcels) >= 2 — moderate evidence a human should
                       see. Below that the collision presumption wins
                       (2+1 parcels is ~zero evidence for a generic LLC name).

large_auto_group (reason='large_auto_group', entity_id_b IS NULL):
  REJECT  L_PLACEHOLDER — display_name is an 'unknown ...' aggregate bucket
                       ('unknown st paul landlord' slipped past
                       isNonEntityName).
  REJECT  L_SURNAME   — normalized entity is a bare surname from
                       Nashville's "SMITH, GLENN C. ET UX" format
                       (single token, display has comma, display carries no
                       business token — 'Loancare, LLC' is a company, not a
                       surname).
  REJECT  L_BADEMAIL  — malformed multi-email entity id
                       ('email:a@x; b@y') fused by an older build.
  KEEP    K_PERSON    — person-looking display names (2-4 alpha tokens or
                       "SURNAME FIRST" comma forms) with 50+ parcels: could
                       be legit large landlords or agent/staff-name
                       artifacts (Minneapolis 'Kari Jacobsen' 394, Philly
                       couple names). Human decides.
  APPROVE L_CONFIRM   — business/gov/org display names (llc/inc/lp/trust/
                       reit/univ/housing/authority/…, incl. truncated
                       suffixes like 'L P', 'LL', 'HOUSIN'): a single real
                       recorded owner; the auto-group is legitimate.

Note on approve semantics: applyEntityReview() only touches
owner_entity_review when entity_id_b IS NULL — there is no merge to apply,
and the endpoint leaves the entity at status 'auto'. These SQL files
replicate the endpoint exactly (review status + reviewed_at only).
"""
import json, re, sys, os
from datetime import datetime, timezone
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "reports", "pending_review_raw.json")
OUT_JSON = os.path.join(ROOT, "data", "reports", "review_triage_report.json")
OUT_MD = os.path.join(ROOT, "data", "reports", "review_triage_report.md")
SQL_DIR = os.path.join(ROOT, "data", "reports", "sql")

COMPANY_RE = re.compile(
    r"\b(llc|inc|corp|corporation|l\.?p\.?|ltd|llp|holdings|properties|"
    r"ventures|partners|trust|management|mgmt|investments|realty|"
    r"enterprises|company|group|homes|apartments|associates|rentals?|"
    r"housing|authority|bank|mortgage|association|university|reit|"
    r"servicing|fund)\b", re.I)

ORG_TOKEN_RE = re.compile(
    r"\b(bank|mellon|army|salvation|secretary|nation|trust|mortgage|"
    r"servicing|storage|opendoor|sfr\d*|sfig|financial|church|university|"
    r"authority|housing|city of|public)\b", re.I)

# Display-name business markers incl. registry truncations:
#   'L P'/'L' = split LP, 'LL' = truncated LLC, 'HOUSIN' = truncated HOUSING,
#   'UNIV' = UNIVERSITY, plus suffix-less org nouns seen in the queue.
EXT_BIZ_RE = re.compile(
    r"(\bl\s*p\b|\bl\b$|\bll$|\bhousin\b|\buniv\b|limited|assoc\b|"
    r"\baffordable\b|\brestorations\b|\bhomeowners\b)", re.I)

NUMERIC_LEAD_RE = re.compile(r"^\d+(st|nd|rd|th)?(\s|$)")
PLACEHOLDER_NAMES = {"xyz properties llc", "abc properties"}
GOV_RE = re.compile(r"\b(city of|housing auth|public housing|secretary of|"
                    r"trustees of|university|federal national|county of)\b", re.I)
BAD_EMAIL_RE = re.compile(r"^email:[^;]*;")
SURNAME_ARTIFACT = re.compile(r"^[a-z]+$")  # single-token normalized name


def is_personish(name: str) -> bool:
    toks = name.split()
    return 1 <= len(toks) <= 3 and all(t.isalpha() for t in toks)


def triage_mj(r, ev):
    name = ev["name"].strip().lower()
    pa, pb = ev["parcels_a"], ev["parcels_b"]
    total, mn = pa + pb, min(pa, pb)
    if NUMERIC_LEAD_RE.match(name):
        return "reject", "R_NUMERIC"
    if name in PLACEHOLDER_NAMES:
        return "reject", "R_PLACEHOLDER"
    if ORG_TOKEN_RE.search(name):
        return "pending", "K_ORG"
    if COMPANY_RE.search(name):
        if total >= 8 and mn >= 2:
            return "pending", "K_BIZ_MODERATE"
        return "reject", "R_BIZ_WEAK"
    # no business tokens
    if is_personish(name):
        return "reject", "R_PERSON"
    return "reject", "R_PERSON_LIKE"


def triage_lg(r, ev):
    disp = (ev.get("display_name") or "").strip()
    norm = r["entity_id_a"].split(":", 2)[-1]
    low = disp.lower()
    if BAD_EMAIL_RE.match(r["entity_id_a"]):
        return "reject", "L_BADEMAIL"
    if "unknown" in low:
        return "reject", "L_PLACEHOLDER"
    if (GOV_RE.search(disp) or COMPANY_RE.search(disp)
            or EXT_BIZ_RE.search(disp)):
        return "approve", "L_CONFIRM"
    if SURNAME_ARTIFACT.match(norm) and "," in disp:
        return "reject", "L_SURNAME"
    # remaining: person/unknown display names
    return "pending", "K_PERSON"


def main():
    rows = json.load(open(RAW))[0]["results"]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    decisions = []
    for r in rows:
        ev = json.loads(r["evidence"])
        if r["reason"] == "multi_jurisdiction_name":
            d, rule = triage_mj(r, ev)
        elif r["reason"] == "large_auto_group":
            d, rule = triage_lg(r, ev)
        else:
            d, rule = "pending", "UNKNOWN_REASON"
        decisions.append({
            "id": r["id"], "reason": r["reason"], "decision": d, "rule": rule,
            "entity_id_a": r["entity_id_a"], "entity_id_b": r["entity_id_b"],
            "evidence": ev,
            "a_name": r.get("a_name"), "b_name": r.get("b_name"),
        })

    counts = Counter((x["reason"], x["decision"]) for x in decisions)
    rules = Counter(x["rule"] for x in decisions)
    print("counts:", dict(counts))
    print("rules:", dict(rules))

    os.makedirs(SQL_DIR, exist_ok=True)
    for action in ("reject", "approve"):
        ids = [x["id"] for x in decisions if x["decision"] == action]
        status = "rejected" if action == "reject" else "approved"
        for ci in range(0, len(ids), 100):
            chunk = ids[ci:ci + 100]
            fn = os.path.join(SQL_DIR, f"{action}_{ci // 100:02d}.sql")
            with open(fn, "w") as f:
                f.write(
                    f"UPDATE owner_entity_review SET status = '{status}', "
                    f"reviewed_at = '{now}' WHERE id IN "
                    f"({','.join(map(str, chunk))}) AND status = 'pending';\n")

    report = {
        "generated_at": now, "total": len(decisions),
        "counts": {f"{k[0]}:{k[1]}": v for k, v in counts.items()},
        "rules": dict(rules), "decisions": decisions,
    }
    json.dump(report, open(OUT_JSON, "w"), indent=1)

    kept = [x for x in decisions if x["decision"] == "pending"]
    rejected_lg = [x for x in decisions if x["reason"] == "large_auto_group"
                   and x["decision"] == "reject"]
    with open(OUT_MD, "w") as f:
        f.write(f"# Review queue triage — {now}\n\n")
        f.write(f"Total {len(decisions)}. "
                f"Rejected: {sum(v for (r_, d), v in counts.items() if d == 'reject')}, "
                f"approved: {sum(v for (r_, d), v in counts.items() if d == 'approve')}, "
                f"left pending: {len(kept)}\n\n")
        f.write("## Left pending for human review\n\n")
        for x in sorted(kept, key=lambda x: (x["reason"], x["evidence"].get("name", x["evidence"].get("display_name", "")))):
            ev = x["evidence"]
            if x["reason"] == "multi_jurisdiction_name":
                f.write(f"- [{x['id']}] ({x['rule']}) **{ev['name']}** — "
                        f"{ev['jurisdiction_a']} ({ev['parcels_a']}) vs "
                        f"{ev['jurisdiction_b']} ({ev['parcels_b']}) | "
                        f"{x['a_name']} // {x['b_name']}\n")
            else:
                f.write(f"- [{x['id']}] ({x['rule']}) **{ev.get('display_name')}** — "
                        f"{ev.get('parcel_count')} parcels, "
                        f"{ev.get('jurisdiction_count')} jurs | "
                        f"{x['entity_id_a']}\n")
        f.write("\n## Auto-group rejects (anomalies)\n\n")
        for x in rejected_lg:
            f.write(f"- [{x['id']}] ({x['rule']}) {x['entity_id_a']} — "
                    f"{x['evidence'].get('display_name')} "
                    f"({x['evidence'].get('parcel_count')} parcels)\n")
    print(f"wrote {OUT_JSON}, {OUT_MD}, sql in {SQL_DIR}")


if __name__ == "__main__":
    main()
