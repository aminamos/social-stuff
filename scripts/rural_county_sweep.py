"""Sweep rural MN counties collecting Planning Bot source material.

Reads data/mn_rural_counties.json (from scripts/parse_usda_rural.py) and, for
each county, discovers publicly accessible GIS/parcel endpoints via the
public ArcGIS Online search API (no key required). Only URLs that return
HTTP 200 are recorded -- nothing is guessed or fabricated. Anything the
script cannot verify is left null with needs_review=true for a human pass.

Known-good seeds (already verified in rural-ideas.md) are included so the
pipeline has working examples from day one:
  - Wright County GIS Open Data portal
  - Wright County Planning & Zoning ordinances page

Usage:
    source .venv/bin/activate
    python scripts/rural_county_sweep.py [--limit N] [--sleep SECONDS]

Outputs:
    data/county_sources.json   full records, one per county
    data/county_sources.csv    flat summary for review
    data/county_review.md      human checklist of unverified items

Next stage (scripts/load_to_d1.py) moves verified rows into D1 and fetched
PDFs into R2 for the single frontend worker.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import time
import urllib.parse
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
COUNTIES_PATH = ROOT / "data" / "mn_rural_counties.json"
JSON_OUT = ROOT / "data" / "county_sources.json"
CSV_OUT = ROOT / "data" / "county_sources.csv"
REVIEW_OUT = ROOT / "data" / "county_review.md"

ARCGIS_SEARCH = "https://www.arcgis.com/sharing/rest/search"
TIMEOUT = 20

# Statewide/generic hosts: never record these as a *county's own* source.
EXCLUDE_HOSTS = ("gisdata.mn.gov", "mngeo", "datamn", "geocommons")


def is_county_specific(url: str) -> bool:
    host = urllib.parse.urlparse(url).netloc.lower()
    return not any(h in host for h in EXCLUDE_HOSTS)

# Already-verified seeds. county -> {field: url}
SEEDS: dict[str, dict[str, str]] = {
    "Wright": {
        "gis_portal_url": "https://wright-county-gis-wrightgis.hub.arcgis.com/pages/open-data",
        "zoning_ordinance_url": "https://www.wrightcountymn.gov/184/Wright-County-Land-Use-Plan",
    },
}


def check_url(url: str) -> bool:
    """True only if the URL answers HTTP 200."""
    try:
        resp = requests.head(url, timeout=TIMEOUT, allow_redirects=True)
        if resp.status_code == 405:  # HEAD not allowed; fall back to GET
            resp = requests.get(url, timeout=TIMEOUT, allow_redirects=True, stream=True)
        return resp.status_code == 200
    except requests.RequestException:
        return False


def arcgis_search(query: str, num: int = 10) -> list[dict]:
    """Public ArcGIS Online search; returns raw result dicts (may be empty)."""
    try:
        resp = requests.get(
            ARCGIS_SEARCH,
            params={"q": query, "f": "json", "num": num, "sortField": "numViews", "sortOrder": "desc"},
            timeout=TIMEOUT,
        )
        if resp.status_code != 200:
            return []
        return resp.json().get("results", [])
    except (requests.RequestException, ValueError):
        return []


def discover_gis(county: str) -> dict[str, str | None]:
    """Find the county's open GIS hub + parcel feature service, verified."""
    found: dict[str, str | None] = {"gis_portal_url": None, "gis_parcels_service_url": None}

    # 1. ArcGIS Hub site for the county.
    for item in arcgis_search(f'title:"{county} County" Minnesota GIS', num=10):
        url = item.get("url")
        if url and "hub.arcgis.com" in url and is_county_specific(url) and check_url(url):
            found["gis_portal_url"] = url
            break

    # 2. Parcel feature service for the county.
    for item in arcgis_search(f'title:parcels "{county} County" Minnesota', num=20):
        if item.get("type") != "Feature Service":
            continue
        url = item.get("url")
        if url and is_county_specific(url) and check_url(url.rstrip("/") + "?f=json"):
            found["gis_parcels_service_url"] = url
            break

    return found


def sweep(county: str, sleep: float) -> dict:
    record: dict = {
        "county": county,
        "county_seat": None,
        "gis_portal_url": None,
        "gis_parcels_service_url": None,
        "zoning_ordinance_url": None,
        "city_code_url": None,
        "assessor_url": None,
        "status": "pending",
        "needs_review": [],
    }
    seeds = SEEDS.get(county, {})
    for field, url in seeds.items():
        record[field] = url if check_url(url) else None
        if record[field] is None:
            record["needs_review"].append(f"seed {field} no longer 200: {url}")

    gis = discover_gis(county)
    for field in ("gis_portal_url", "gis_parcels_service_url"):
        if record[field] is None and gis[field]:
            record[field] = gis[field]

    if record["county_seat"] is None:
        record["needs_review"].append("county seat + city code URL not yet researched")
    if record["zoning_ordinance_url"] is None:
        record["needs_review"].append("county zoning ordinance URL not yet found")
    if record["assessor_url"] is None:
        record["needs_review"].append("county assessor / property-tax URL not yet found")
    if record["gis_portal_url"] is None:
        record["needs_review"].append("no verified ArcGIS Hub GIS portal")

    record["status"] = "verified" if not record["needs_review"] else "needs_review"
    time.sleep(sleep)
    return record


def write_review(records: list[dict]) -> None:
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


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="only process first N counties (0 = all)")
    parser.add_argument("--sleep", type=float, default=1.0, help="seconds between counties")
    args = parser.parse_args()

    if not COUNTIES_PATH.exists():
        print(f"run scripts/parse_usda_rural.py first ({COUNTIES_PATH} missing)", file=sys.stderr)
        return 1
    counties: list[str] = json.loads(COUNTIES_PATH.read_text(encoding="utf-8"))["rural_counties"]
    if args.limit:
        counties = counties[: args.limit]

    records = []
    for i, county in enumerate(counties, 1):
        print(f"[{i}/{len(counties)}] {county} County...", flush=True)
        records.append(sweep(county, args.sleep))

    JSON_OUT.write_text(json.dumps(records, indent=2) + "\n", encoding="utf-8")
    with CSV_OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["county", "status", "county_seat", "gis_portal_url",
                        "gis_parcels_service_url", "zoning_ordinance_url",
                        "city_code_url", "assessor_url", "needs_review"],
        )
        writer.writeheader()
        for r in records:
            writer.writerow({**r, "needs_review": "; ".join(r["needs_review"])})
    write_review(records)
    verified = sum(1 for r in records if r["status"] == "verified")
    print(f"done: {verified}/{len(records)} verified -> {JSON_OUT.name}, {CSV_OUT.name}, {REVIEW_OUT.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
