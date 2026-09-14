"""Merge county research batches into county_sources.json with re-verification.

Reads data/review_batches/batch{1,2,3,5,6}.json (researcher output:
county_seat, zoning_ordinance_url, city_code_url) and merges into
data/county_sources.json. EVERY non-null URL is re-checked here with an
independent HTTP request (browser User-Agent); any URL that fails is set
back to null with a needs_review note. Nothing unverified survives.

Also backfills the assessor_url field + review item for records swept
before assessor support existed.

Usage:
    source .venv/bin/activate
    python scripts/merge_review_batches.py

Outputs: rewrites data/county_sources.json/.csv, data/county_review.md
"""

from __future__ import annotations

import csv
import json
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "data" / "county_sources.json"
CSV_OUT = ROOT / "data" / "county_sources.csv"
REVIEW_OUT = ROOT / "data" / "county_review.md"
BATCH_DIR = ROOT / "data" / "review_batches"

TIMEOUT = 25
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

REVIEW_SEAT = "county seat + city code URL not yet researched"
REVIEW_ZONING = "county zoning ordinance URL not yet found"
REVIEW_CITY = "city code URL not yet found"
REVIEW_GIS = "no verified ArcGIS Hub GIS portal"
REVIEW_ASSESSOR = "county assessor / property-tax URL not yet found"


def verify(url: str | None) -> bool:
    if not url:
        return False
    try:
        r = requests.head(url, timeout=TIMEOUT, allow_redirects=True, headers=UA)
        if r.status_code == 405:
            r = requests.get(url, timeout=TIMEOUT, allow_redirects=True, headers=UA, stream=True)
        return r.status_code == 200
    except requests.RequestException:
        return False


def main() -> int:
    if not SOURCES.exists():
        print("missing data/county_sources.json", file=sys.stderr)
        return 1
    records: list[dict] = json.loads(SOURCES.read_text(encoding="utf-8"))
    by_county = {r["county"]: r for r in records}

    batch_files = sorted(BATCH_DIR.glob("batch*.json"))
    if not batch_files:
        print("no batch files in data/review_batches/", file=sys.stderr)
        return 1

    merged = 0
    for bf in batch_files:
        for b in json.loads(bf.read_text(encoding="utf-8")):
            county = b["county"]
            if county not in by_county:
                print(f"warning: {county} not in county list, skipping")
                continue
            r = by_county[county]
            nr = set(r.get("needs_review", []))
            if b.get("county_seat"):
                r["county_seat"] = b["county_seat"]
                nr.discard(REVIEW_SEAT)
            for field, review in (("zoning_ordinance_url", REVIEW_ZONING), ("city_code_url", REVIEW_CITY)):
                url = b.get(field)
                if url and verify(url):
                    r[field] = url
                    nr.discard(review)
                    if field == "city_code_url":
                        nr.discard(REVIEW_SEAT)
                elif url:
                    nr.add(f"reported {field} failed re-verify, needs a replacement: {url}")
                time.sleep(0.2)
            note = (b.get("notes") or "").strip()
            if note:
                existing = r.get("reviewer_notes") or ""
                if note not in existing:
                    r["reviewer_notes"] = (existing + " | " + note).strip(" |")
            r["needs_review"] = sorted(nr)
            merged += 1

    # Backfill assessor field + re-verify previously recorded GIS/parcel URLs.
    for r in records:
        r.setdefault("assessor_url", None)
        nr = set(r.get("needs_review", []))
        if r["assessor_url"] is None:
            nr.add(REVIEW_ASSESSOR)
        for field in ("gis_portal_url", "gis_parcels_service_url"):
            url = r.get(field)
            if url and not verify(url):
                r[field] = None
                nr.add(f"previously recorded {field} failed re-verify: {url}")
            time.sleep(0.2)
        if r.get("county_seat") and not r.get("city_code_url"):
            nr.add(REVIEW_CITY)
            nr.discard(REVIEW_SEAT)
        r["needs_review"] = sorted(nr)
        # A row is verified only when every review item is cleared.
        r["status"] = "verified" if not r["needs_review"] else "needs_review"

    SOURCES.write_text(json.dumps(records, indent=2) + "\n", encoding="utf-8")
    with CSV_OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["county", "status", "county_seat", "gis_portal_url",
                        "gis_parcels_service_url", "zoning_ordinance_url",
                        "city_code_url", "assessor_url", "needs_review"],
        )
        writer.writeheader()
        for r in records:
            writer.writerow({k: (v if k != "needs_review" else "; ".join(v))
                             for k, v in r.items() if k in writer.fieldnames
                             or k == "needs_review"} | {"needs_review": "; ".join(r["needs_review"])})
    lines = ["# County source review checklist", ""]
    pending = [r for r in records if r["status"] != "verified"]
    lines.append(f"{len(records) - len(pending)}/{len(records)} counties fully verified.")
    lines.append("")
    for r in pending:
        lines.append(f"## {r['county']} County")
        for item in r["needs_review"]:
            lines.append(f"- [ ] {item}")
        lines.append("")
    REVIEW_OUT.write_text("\n".join(lines), encoding="utf-8")

    print(f"merged {merged} batch rows from {len(batch_files)} files")
    print(f"{len(records) - len(pending)}/{len(records)} verified")
    print("county | seat | zoning | citycode | parcels | hub")
    for r in records:
        print(f"{r['county']} | {r.get('county_seat')} | "
              f"{'Y' if r.get('zoning_ordinance_url') else '-'} | "
              f"{'Y' if r.get('city_code_url') else '-'} | "
              f"{'Y' if r.get('gis_parcels_service_url') else '-'} | "
              f"{'Y' if r.get('gis_portal_url') else '-'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
