from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Dict, Any, List, Optional
import time
from datetime import datetime

from ..models.schema import Property, ShellEntity, Person


def get_default_db_path() -> Path:
    base_dir = Path(__file__).resolve().parent.parent.parent
    data_dir = base_dir / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / "minneapolis_rental_licenses.db"


class LocalRentalStore:
    """Local SQLite database for storing and querying the complete public registry

    of all 23,000+ active rental licenses in Minneapolis for instant, offline de-anonymization.
    """

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or get_default_db_path()
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        conn = self._get_connection()
        try:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS rental_licenses (
                    apn TEXT PRIMARY KEY,
                    address TEXT,
                    owner_name TEXT,
                    owner_address TEXT,
                    owner_city TEXT,
                    owner_state TEXT,
                    owner_zip TEXT,
                    owner_phone TEXT,
                    owner_email TEXT,
                    applicant_name TEXT,
                    applicant_phone TEXT,
                    applicant_email TEXT,
                    units INTEGER DEFAULT 1,
                    tier TEXT,
                    status TEXT,
                    synced_at TIMESTAMP
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_owner_name ON rental_licenses(owner_name);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_applicant_email ON rental_licenses(applicant_email);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_applicant_phone ON rental_licenses(applicant_phone);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_address ON rental_licenses(address);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tier ON rental_licenses(tier);")
            conn.commit()
        finally:
            conn.close()

    def count(self) -> int:
        conn = self._get_connection()
        try:
            cur = conn.execute("SELECT COUNT(*) FROM rental_licenses;")
            return cur.fetchone()[0]
        finally:
            conn.close()

    def sync_all_from_api(self, live_client, batch_size: int = 16000) -> int:
        """Downloads the ENTIRE City of Minneapolis active rental license registry

        (all 23,300+ properties) in fast bulk batches and stores them locally.
        """
        import httpx

        url = "https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Active_Rental_Licenses/FeatureServer/0/query"
        offset = 0
        total_synced = 0
        now = datetime.utcnow().isoformat()

        with self._get_connection() as conn:
            while True:
                params = {
                    "where": "1=1",
                    "outFields": (
                        "apn,address,ownerName,ownerAddress1,ownerCity,ownerState,ownerZip,"
                        "ownerPhone,ownerEmail,applicantName,applicantPhone,applicantEmail,licensedUnits,tier,status"
                    ),
                    "returnGeometry": "false",
                    "resultOffset": offset,
                    "resultRecordCount": batch_size,
                    "f": "json",
                }
                r = httpx.get(url, params=params, timeout=45.0)
                r.raise_for_status()
                data = r.json()
                features = data.get("features", [])
                if not features:
                    break

                batch_rows = []
                for f in features:
                    attr = f.get("attributes", {})
                    apn = str(attr.get("apn") or "").strip()
                    if not apn:
                        continue
                    batch_rows.append((
                        apn,
                        str(attr.get("address") or "").strip(),
                        str(attr.get("ownerName") or "").strip(),
                        str(attr.get("ownerAddress1") or "").strip(),
                        str(attr.get("ownerCity") or "").strip(),
                        str(attr.get("ownerState") or "").strip(),
                        str(attr.get("ownerZip") or "").strip(),
                        str(attr.get("ownerPhone") or "").strip(),
                        str(attr.get("ownerEmail") or "").strip(),
                        str(attr.get("applicantName") or "").strip(),
                        str(attr.get("applicantPhone") or "").strip(),
                        str(attr.get("applicantEmail") or "").strip(),
                        int(attr.get("licensedUnits") or 1),
                        str(attr.get("tier") or "Tier 1").strip(),
                        str(attr.get("status") or "Active").strip(),
                        now,
                    ))

                conn.executemany("""
                    INSERT OR REPLACE INTO rental_licenses (
                        apn, address, owner_name, owner_address, owner_city, owner_state, owner_zip,
                        owner_phone, owner_email, applicant_name, applicant_phone, applicant_email,
                        units, tier, status, synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, batch_rows)
                conn.commit()

                total_synced += len(batch_rows)
                if len(features) < batch_size:
                    break
                offset += batch_size

        return total_synced

    def search(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Instant multi-column search across all stored licenses."""
        pattern = f"%{query.strip()}%"
        conn = self._get_connection()
        try:
            cur = conn.execute("""
                SELECT * FROM rental_licenses
                WHERE owner_name LIKE ?
                   OR applicant_name LIKE ?
                   OR applicant_email LIKE ?
                   OR applicant_phone LIKE ?
                   OR address LIKE ?
                   OR apn LIKE ?
                ORDER BY units DESC
                LIMIT ?;
            """, (pattern, pattern, pattern, pattern, pattern, pattern, limit))
            return [dict(row) for row in cur.fetchall()]
        finally:
            conn.close()

    def get_top_syndicates_by_email(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Groups buildings by applicant email to unmask multi-LLC syndicates."""
        conn = self._get_connection()
        try:
            cur = conn.execute("""
                SELECT 
                    applicant_email,
                    applicant_name,
                    COUNT(DISTINCT apn) AS property_count,
                    COUNT(DISTINCT owner_name) AS shell_count,
                    SUM(units) AS total_units,
                    SUM(CASE WHEN tier = 'Tier 3' THEN 1 ELSE 0 END) AS tier3_count
                FROM rental_licenses
                WHERE applicant_email IS NOT NULL AND applicant_email != ''
                GROUP BY applicant_email
                HAVING property_count > 1
                ORDER BY total_units DESC
                LIMIT ?;
            """, (limit,))
            return [dict(row) for row in cur.fetchall()]
        finally:
            conn.close()

    def get_worst_slumlords_by_tier3(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Finds corporate syndicates with the highest count of Tier 3 (chronic non-compliance) buildings."""
        conn = self._get_connection()
        try:
            cur = conn.execute("""
                SELECT 
                    COALESCE(NULLIF(applicant_email, ''), owner_name) AS identifier,
                    applicant_name,
                    COUNT(DISTINCT apn) AS total_properties,
                    SUM(units) AS total_units,
                    SUM(CASE WHEN tier = 'Tier 3' THEN 1 ELSE 0 END) AS tier3_count
                FROM rental_licenses
                GROUP BY identifier
                HAVING tier3_count > 0
                ORDER BY tier3_count DESC, total_units DESC
                LIMIT ?;
            """, (limit,))
            return [dict(row) for row in cur.fetchall()]
        finally:
            conn.close()
