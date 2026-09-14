"""Load swept county sources into D1 (rural-planning-bot).

Reads data/county_sources.json (from scripts/rural_county_sweep.py) and
upserts every row into the `counties` table, then prints the exact wrangler
command to run -- or runs it with --push.

Usage:
    source .venv/bin/activate
    python scripts/load_to_d1.py [--push]

Outputs:
    data/seed_counties.sql   generated INSERT OR REPLACE batch
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "data" / "county_sources.json"
SEED_SQL = ROOT / "data" / "seed_counties.sql"
DB = "rural-planning-bot"


def sql_str(value: object) -> str:
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--push", action="store_true", help="run wrangler d1 execute --remote")
    args = parser.parse_args()

    if not SOURCES.exists():
        print(f"run scripts/rural_county_sweep.py first ({SOURCES} missing)", file=sys.stderr)
        return 1
    records: list[dict] = json.loads(SOURCES.read_text(encoding="utf-8"))

    lines = []
    for r in records:
        lines.append(
            "INSERT OR REPLACE INTO counties "
            "(county, county_seat, gis_portal_url, gis_parcels_service_url, "
            "zoning_ordinance_url, city_code_url, assessor_url, status, notes) VALUES ("
            + ", ".join(
                [
                    sql_str(r["county"]),
                    sql_str(r.get("county_seat")),
                    sql_str(r.get("gis_portal_url")),
                    sql_str(r.get("gis_parcels_service_url")),
                    sql_str(r.get("zoning_ordinance_url")),
                    sql_str(r.get("city_code_url")),
                    sql_str(r.get("assessor_url")),
                    sql_str(r.get("status", "pending")),
                    sql_str("; ".join(r.get("needs_review", [])) or None),
                ]
            )
            + ");"
        )
    SEED_SQL.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {len(records)} statements -> {SEED_SQL.relative_to(ROOT)}")

    cmd = ["wrangler", "d1", "execute", DB, "--remote", "--file", str(SEED_SQL)]
    if args.push:
        subprocess.run(cmd, check=True, cwd=ROOT)
    else:
        print("review, then run: " + " ".join(cmd))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
