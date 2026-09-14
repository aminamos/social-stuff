from __future__ import annotations

import json
import gzip
from pathlib import Path
from typing import Dict, Any, List, Optional
import httpx

from .local_store import LocalRentalStore


def export_r2_snapshot(store: LocalRentalStore, output_path: Path) -> Path:
    """Exports all local rental license records into a compressed Gzip JSON snapshot

    suitable for upload to Cloudflare R2.
    """
    conn = store._get_connection()
    try:
        cur = conn.execute("SELECT * FROM rental_licenses;")
        rows = [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

    json_bytes = json.dumps(rows, indent=2).encode("utf-8")
    with gzip.open(output_path, "wb") as f:
        f.write(json_bytes)

    return output_path


def export_metro_parcels_r2_snapshot(store: LocalRentalStore, output_path: Path) -> Path:
    """Exports all local county parcel records into a compressed Gzip JSON snapshot

    suitable for upload to Cloudflare R2.
    """
    conn = store._get_connection()
    try:
        cur = conn.execute("SELECT * FROM county_parcels;")
        rows = [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

    json_bytes = json.dumps(rows, indent=2).encode("utf-8")
    with gzip.open(output_path, "wb") as f:
        f.write(json_bytes)

    return output_path


def generate_d1_seed_sql(store: LocalRentalStore, output_path: Path) -> Path:
    """Generates a batch SQL seed file formatted for Cloudflare D1 execution

    via `npx wrangler d1 execute social-housing-db --file=seed.sql`.
    """
    conn = store._get_connection()
    try:
        cur = conn.execute("SELECT * FROM rental_licenses;")
        rows = cur.fetchall()
    finally:
        conn.close()

    lines = [
        "-- Cloudflare D1 Seed Script generated from Twin Cities Metro Rental Housing Registries",
    ]

    for r in rows:
        def escape_sql(val):
            if val is None:
                return "NULL"
            return "'" + str(val).replace("'", "''") + "'"

        city_val = escape_sql(r['city']) if 'city' in r.keys() else "'Minneapolis'"
        county_val = escape_sql(r['county']) if 'county' in r.keys() else "'Hennepin'"

        stmt = (
            f"INSERT OR REPLACE INTO rental_licenses ("
            f"apn, address, city, county, owner_name, owner_address, owner_city, owner_state, owner_zip, "
            f"owner_phone, owner_email, applicant_name, applicant_phone, applicant_email, "
            f"units, tier, status, synced_at"
            f") VALUES ("
            f"{escape_sql(r['apn'])}, {escape_sql(r['address'])}, {city_val}, {county_val}, {escape_sql(r['owner_name'])}, "
            f"{escape_sql(r['owner_address'])}, {escape_sql(r['owner_city'])}, {escape_sql(r['owner_state'])}, "
            f"{escape_sql(r['owner_zip'])}, {escape_sql(r['owner_phone'])}, {escape_sql(r['owner_email'])}, "
            f"{escape_sql(r['applicant_name'])}, {escape_sql(r['applicant_phone'])}, {escape_sql(r['applicant_email'])}, "
            f"{int(r['units'] or 1)}, {escape_sql(r['tier'])}, {escape_sql(r['status'])}, {escape_sql(r['synced_at'])}"
            f");"
        )
        lines.append(stmt)
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def generate_d1_parcel_seed_sql(store: LocalRentalStore, output_path: Path) -> Path:
    """Generates a batch SQL seed file for county_parcels formatted for Cloudflare D1."""
    conn = store._get_connection()
    try:
        cur = conn.execute("SELECT * FROM county_parcels;")
        rows = cur.fetchall()
    finally:
        conn.close()

    lines = [
        "-- Cloudflare D1 Seed Script generated from Twin Cities County Parcels",
    ]

    for r in rows:
        def escape_sql(val):
            if val is None:
                return "NULL"
            return "'" + str(val).replace("'", "''") + "'"

        stmt = (
            f"INSERT OR REPLACE INTO county_parcels ("
            f"pid, county, city, address, owner_name, owner_address, taxpayer_name, taxpayer_address, "
            f"units, market_value, property_type, homestead_status, delinquent_tax_year, year_built, synced_at"
            f") VALUES ("
            f"{escape_sql(r['pid'])}, {escape_sql(r['county'])}, {escape_sql(r['city'])}, {escape_sql(r['address'])}, "
            f"{escape_sql(r['owner_name'])}, {escape_sql(r['owner_address'])}, {escape_sql(r['taxpayer_name'])}, {escape_sql(r['taxpayer_address'])}, "
            f"{int(r['units'] or 1)}, {float(r['market_value'] or 0.0)}, {escape_sql(r['property_type'])}, {escape_sql(r['homestead_status'])}, "
            f"{escape_sql(r['delinquent_tax_year'])}, {int(r['year_built'] or 0)}, {escape_sql(r['synced_at'])}"
            f");"
        )
        lines.append(stmt)
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


class CloudflareAPIClient:
    """Client for pushing data directly to Cloudflare D1 and R2 via Cloudflare REST API."""

    def __init__(self, account_id: str, api_token: str):
        self.account_id = account_id
        self.api_token = api_token
        self.base_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}"

    def execute_d1_query(self, database_id: str, sql: str, params: Optional[List[Any]] = None) -> Dict[str, Any]:
        """Executes a SQL query against Cloudflare D1 serverless database."""
        url = f"{self.base_url}/d1/database/{database_id}/query"
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }
        payload = {"sql": sql, "params": params or []}

        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            return resp.json()
