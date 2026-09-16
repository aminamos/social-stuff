#!/usr/bin/env python3
"""One-off ingest: Pittsburgh rental registrations (WPRDC CKAN) -> rental_licenses.

Source: POST https://data.wprdc.org/api/3/action/datastore_search_sql with
  sql = SELECT * FROM "e88c10d5-541d-417f-aef6-25cc5637aeb1"
        WHERE license_type_name='Rental Registration' AND license_state='Active'
(verified live 2026-09-14: success=true; paginate with LIMIT/OFFSET).

Row mapping (rental_licenses columns per schema.sql):
  feed_id 'pa-pittsburgh-rental-registration', jurisdiction_id 'pittsburgh-pa',
  applicant_email <- email_address, applicant_phone <- primary_phone_number,
  apn <- parcel_number, parcel_id 'PA:Allegheny:<parcel_number>'
  (falls back to license_number when parcel_number is empty),
  owner_name <- business_name, address/address fields, city 'Pittsburgh',
  county 'Allegheny', state 'PA', status <- license_state.

Emits a single .sql file runnable by `wrangler d1 execute <db> --remote --file`
(`--remote` required: without it wrangler writes to the local simulator).
Idempotent: INSERT ... ON CONFLICT(parcel_id) DO UPDATE.
"""

import argparse
import json
import os
import urllib.request

CKAN_SQL_URL = "https://data.wprdc.org/api/3/action/datastore_search_sql"
RESOURCE_ID = "e88c10d5-541d-417f-aef6-25cc5637aeb1"
FEED_ID = "pa-pittsburgh-rental-registration"
JURISDICTION_ID = "pittsburgh-pa"
PAGE_SIZE = 1000

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
        return 1


def fetch_page(sql):
    body = json.dumps({"sql": sql}).encode()
    req = urllib.request.Request(
        CKAN_SQL_URL, data=body,
        headers={"Content-Type": "application/json", "User-Agent": "civic-registry-ingest/1.0"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        if resp.status != 200:
            raise RuntimeError(f"CKAN query failed: HTTP {resp.status}")
        payload = json.loads(resp.read().decode())
    if not payload.get("success"):
        raise RuntimeError(f"CKAN query not successful: {payload}")
    return payload["result"]["records"]


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
    ap.add_argument("--limit", type=int, default=0, help="only process first N rows (testing)")
    args = ap.parse_args()
    os.makedirs(args.out_dir, exist_ok=True)

    base_where = (f'FROM "{RESOURCE_ID}" '
                  "WHERE license_type_name='Rental Registration' AND license_state='Active'")
    statements = []
    offset = 0
    while True:
        sql = f"SELECT * {base_where} LIMIT {PAGE_SIZE} OFFSET {offset}"
        records = fetch_page(sql)
        if offset == 0:
            print(f"live query verified: {len(records)} rows on first page; "
                  f"fields: {sorted(records[0].keys()) if records else []}")
        if not records:
            break
        for r in records:
            parcel = (r.get("parcel_number") or "").strip()
            lic = (r.get("license_number") or "").strip()
            key = parcel or lic
            if not key:
                continue
            statements.append(upsert_sql([
                f"PA:Allegheny:{key}", key, FEED_ID, JURISDICTION_ID,
                "Pittsburgh", "Allegheny", "PA",
                (r.get("address") or "").strip() or None,
                to_int(r.get("number_of_units")), (r.get("business_name") or "").strip() or None,
                None, None, None, None, None, None, None,
                (r.get("primary_phone_number") or "").strip() or None,
                (r.get("email_address") or "").strip() or None,
                None, None, (r.get("license_state") or "").strip() or None,
                "ckan", RESOURCE_ID, None,
            ]))
            if args.limit and len(statements) >= args.limit:
                break
        if len(records) < PAGE_SIZE or (args.limit and len(statements) >= args.limit):
            break
        offset += PAGE_SIZE

    path = os.path.join(args.out_dir, "pittsburgh-rental.sql")
    with open(path, "w") as f:
        f.write("\n".join(statements) + "\n")

    print(f"rowcount: {len(statements)} upserts -> 1 file")
    print("wrote", path)


if __name__ == "__main__":
    main()
