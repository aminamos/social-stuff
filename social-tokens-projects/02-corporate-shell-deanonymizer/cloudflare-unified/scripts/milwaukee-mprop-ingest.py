#!/usr/bin/env python3
"""One-off ingest: Milwaukee MPROP assessment extract -> rental_licenses.

Source: https://data.milwaukee.gov/dataset/562ab824-48a5-42cd-b714-87e205e489ba/resource/0a2c7f31-cd15-4151-8222-09dd57d5f16d/download/mprop.csv
(verified: follows a 302 to a signed S3 URL — download with redirect-following,
i.e. curl -L / urllib; header row verified to contain TAXKEY, OWNER_NAME_1,
NR_UNITS, OWN_OCPD).

Row mapping (rental_licenses columns per schema.sql):
  parcel TAXKEY as apn, parcel_id 'WI:Milwaukee:<TAXKEY>', owner OWNER_NAME_1,
  units NR_UNITS, feed_id 'wi-milwaukee-mprop', jurisdiction_id 'milwaukee-wi',
  city 'Milwaukee', county 'Milwaukee', state 'WI'.
Filter: non-owner-occupied AND NR_UNITS>=1. NOTE: the live file contains no
'N' value in OWN_OCPD — its values are 'O' (owner-occupied, 97k rows) or ''
(62k rows). Non-owner-occupied is therefore implemented as OWN_OCPD<>'O'
(which also keeps a literal 'N' if one ever appears).
Address is composed from HOUSE_NR_LO/HI + SDIR + STREET + STTYPE (+ GEO_ZIP_CODE).
Owner mailing address from OWNER_MAIL_ADDR / OWNER_CITY_STATE / OWNER_ZIP.

Emits chunked .sql files (<=5000 upserts each) runnable by
`wrangler d1 execute --file`. Idempotent: INSERT ... ON CONFLICT(parcel_id) DO UPDATE.
"""

import argparse
import csv
import os
import sys
import urllib.request

MPROP_URL = ("https://data.milwaukee.gov/dataset/562ab824-48a5-42cd-b714-87e205e489ba"
             "/resource/0a2c7f31-cd15-4151-8222-09dd57d5f16d/download/mprop.csv")
FEED_ID = "wi-milwaukee-mprop"
JURISDICTION_ID = "milwaukee-wi"
CHUNK_SIZE = 5000

REQUIRED_HEADER_COLS = ["TAXKEY", "OWNER_NAME_1", "NR_UNITS", "OWN_OCPD"]

RL_COLS = [
    "parcel_id", "apn", "feed_id", "jurisdiction_id", "city", "county", "state",
    "address", "units", "owner_name", "owner_address", "owner_city",
    "owner_state", "owner_zip", "owner_phone", "owner_email", "applicant_name",
    "applicant_phone", "applicant_email", "severity_class", "tier", "status",
    "source_platform", "source_dataset", "link_key",
]


def sql_lit(v):
    if v is None or v == "":
        return "NULL"
    if isinstance(v, float):
        return repr(float(v))
    if isinstance(v, int):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def to_int(v):
    try:
        return int(float(str(v).strip()))
    except (TypeError, ValueError):
        return 0


def build_address(r):
    parts = []
    lo = (r.get("HOUSE_NR_LO") or "").strip()
    hi = (r.get("HOUSE_NR_HI") or "").strip()
    if lo:
        parts.append(lo if lo == hi or not hi else f"{lo}-{hi}")
    for k in ("SDIR", "STREET", "STTYPE"):
        v = (r.get(k) or "").strip()
        if v:
            parts.append(v)
    addr = " ".join(parts)
    zipc = (r.get("GEO_ZIP_CODE") or "").strip()
    if zipc and zipc != "0":
        addr = f"{addr} {zipc}".strip()
    return addr


def split_city_state(raw):
    # OWNER_CITY_STATE looks like "MILWAUKEE, WI" / "CHICAGO, IL"
    toks = (raw or "").strip().replace(",", " ").split()
    if len(toks) >= 2 and len(toks[-1]) == 2 and toks[-1].isalpha():
        return " ".join(toks[:-1]).title(), toks[-1].upper()
    return " ".join(toks).title(), ""


def upsert_sql(vals):
    cols = ", ".join(RL_COLS)
    vs = ", ".join(sql_lit(v) for v in vals)
    sets = ", ".join(f"{c}=excluded.{c}" for c in RL_COLS if c != "parcel_id")
    return (
        f"INSERT INTO rental_licenses ({cols}) VALUES ({vs}) "
        f"ON CONFLICT(parcel_id) DO UPDATE SET {sets}, synced_at=CURRENT_TIMESTAMP;"
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "out"))
    ap.add_argument("--limit", type=int, default=0, help="only process first N matching rows (testing)")
    ap.add_argument("--csv", default="", help="reuse a local csv instead of downloading")
    args = ap.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)
    csv_path = args.csv or os.path.join(args.out_dir, "mprop.csv")
    if not args.csv:
        req = urllib.request.Request(MPROP_URL, headers={"User-Agent": "civic-registry-ingest/1.0"})
        with urllib.request.urlopen(req, timeout=300) as resp, open(csv_path, "wb") as f:
            # urllib follows the 302 to the signed S3 URL automatically
            if resp.status != 200:
                raise RuntimeError(f"download failed: HTTP {resp.status} for {MPROP_URL}")
            while True:
                buf = resp.read(1024 * 1024)
                if not buf:
                    break
                f.write(buf)
        print(f"downloaded -> {csv_path} ({os.path.getsize(csv_path)} bytes)")

    statements = []
    seen = 0
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        missing = [c for c in REQUIRED_HEADER_COLS if c not in (reader.fieldnames or [])]
        if missing:
            raise RuntimeError(f"header verification failed: missing {missing}")
        print(f"header verified ({len(reader.fieldnames)} cols)")
        for r in reader:
            seen += 1
            if (r.get("OWN_OCPD") or "").strip().upper() == "O":
                continue  # owner-occupied; keep 'N'/'' (live file has no 'N', only 'O' vs '')
            units = to_int(r.get("NR_UNITS"))
            if units < 1:
                continue
            taxkey = (r.get("TAXKEY") or "").strip()
            if not taxkey:
                continue
            owner_city, owner_state = split_city_state(r.get("OWNER_CITY_STATE"))
            statements.append(upsert_sql([
                f"WI:Milwaukee:{taxkey}", taxkey, FEED_ID, JURISDICTION_ID,
                "Milwaukee", "Milwaukee", "WI",
                build_address(r), units, (r.get("OWNER_NAME_1") or "").strip(),
                (r.get("OWNER_MAIL_ADDR") or "").strip(), owner_city or None,
                owner_state or None, (r.get("OWNER_ZIP") or "").strip() or None,
                None, None, None, None, None, None, None, None,
                "ckan", "mprop", None,
            ]))
            if args.limit and len(statements) >= args.limit:
                break

    files = []
    for i in range(0, len(statements), CHUNK_SIZE):
        chunk = statements[i:i + CHUNK_SIZE]
        path = os.path.join(args.out_dir, f"milwaukee-mprop-{i // CHUNK_SIZE + 1:02d}.sql")
        with open(path, "w") as f:
            f.write("\n".join(chunk) + "\n")
        files.append(path)

    print(f"scanned {seen} rows; rowcount: {len(statements)} upserts -> {len(files)} file(s)")
    for p in files:
        print("wrote", p)


if __name__ == "__main__":
    main()
