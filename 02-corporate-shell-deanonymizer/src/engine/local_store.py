from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Dict, Any, List, Optional
import time
from datetime import datetime, timezone
import httpx


from ..models.schema import Property, ShellEntity, Person


def get_default_db_path() -> Path:
    base_dir = Path(__file__).resolve().parent.parent.parent
    data_dir = base_dir / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / "minneapolis_rental_licenses.db"


class LocalRentalStore:
    """Local SQLite database for storing and querying municipal rental license registries

    and county property tax parcels across all cities in Hennepin and Ramsey counties.
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
                    city TEXT DEFAULT 'Minneapolis',
                    county TEXT DEFAULT 'Hennepin',
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

            # Ensure columns exist if table was created in earlier schema
            cur = conn.execute("PRAGMA table_info(rental_licenses);")
            columns = [row["name"] for row in cur.fetchall()]
            if "city" not in columns:
                conn.execute("ALTER TABLE rental_licenses ADD COLUMN city TEXT DEFAULT 'Minneapolis';")
            if "county" not in columns:
                conn.execute("ALTER TABLE rental_licenses ADD COLUMN county TEXT DEFAULT 'Hennepin';")

            conn.execute("CREATE INDEX IF NOT EXISTS idx_owner_name ON rental_licenses(owner_name);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_applicant_email ON rental_licenses(applicant_email);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_applicant_phone ON rental_licenses(applicant_phone);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_address ON rental_licenses(address);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tier ON rental_licenses(tier);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_city ON rental_licenses(city);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_county ON rental_licenses(county);")

            # Multi-city county property parcel table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS county_parcels (
                    pid TEXT PRIMARY KEY,
                    county TEXT NOT NULL,
                    city TEXT NOT NULL,
                    address TEXT,
                    owner_name TEXT,
                    owner_address TEXT,
                    taxpayer_name TEXT,
                    taxpayer_address TEXT,
                    units INTEGER DEFAULT 1,
                    market_value REAL,
                    property_type TEXT,
                    homestead_status TEXT,
                    delinquent_tax_year TEXT,
                    year_built INTEGER,
                    synced_at TIMESTAMP
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_parcel_owner ON county_parcels(owner_name);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_parcel_taxpayer ON county_parcels(taxpayer_name);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_parcel_city ON county_parcels(city);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_parcel_county ON county_parcels(county);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_parcel_address ON county_parcels(address);")

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

    def parcel_count(self) -> int:
        conn = self._get_connection()
        try:
            cur = conn.execute("SELECT COUNT(*) FROM county_parcels;")
            return cur.fetchone()[0]
        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # 1. SYNC MINNEAPOLIS RENTAL LICENSES
    # --------------------------------------------------------------------------
    def sync_all_from_api(self, live_client=None, batch_size: int = 16000) -> int:
        """Downloads the ENTIRE City of Minneapolis active rental license registry

        (all 22,300+ properties) in fast bulk batches and stores them locally.
        """
        url = "https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Active_Rental_Licenses/FeatureServer/0/query"
        offset = 0
        total_synced = 0
        now = datetime.now(timezone.utc).isoformat()

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
                        "Minneapolis",
                        "Hennepin",
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
                        apn, address, city, county, owner_name, owner_address, owner_city, owner_state, owner_zip,
                        owner_phone, owner_email, applicant_name, applicant_phone, applicant_email,
                        units, tier, status, synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, batch_rows)
                conn.commit()

                total_synced += len(batch_rows)
                if len(features) < batch_size:
                    break
                offset += batch_size

        return total_synced

    # --------------------------------------------------------------------------
    # 2. SYNC SAINT PAUL RESIDENTIAL CERTIFICATES OF OCCUPANCY (12,424 Records)
    # --------------------------------------------------------------------------
    def sync_stpaul_cofo(self, batch_size: int = 2000) -> int:
        """Downloads all active residential rental Certificates of Occupancy for the City of Saint Paul."""
        url = "https://services1.arcgis.com/9meaaHE3uiba0zr8/arcgis/rest/services/Certificate_of_Occupancy_-_Residential/FeatureServer/0/query"
        offset = 0
        total_synced = 0
        now = datetime.now(timezone.utc).isoformat()

        with self._get_connection() as conn:
            while True:
                params = {
                    "where": "1=1",
                    "outFields": "OBJECTID,PROPNAME,UNITS,PRIMOCCTYPE,ADDRESS,SUB_TYPE,STATUS,PIN,GRADE,RENEWAL_DUE",
                    "returnGeometry": "false",
                    "resultOffset": offset,
                    "resultRecordCount": batch_size,
                    "f": "json"
                }
                r = httpx.get(url, params=params, timeout=30.0)
                r.raise_for_status()
                features = r.json().get("features", [])
                if not features:
                    break

                batch_rows = []
                for f in features:
                    attr = f.get("attributes", {})
                    pin = str(attr.get("PIN") or attr.get("OBJECTID") or "").strip()
                    if not pin:
                        continue
                    addr = str(attr.get("ADDRESS") or "").strip()
                    prop_name = str(attr.get("PROPNAME") or "Unknown Landlord").strip()
                    units = int(attr.get("UNITS") or 1)
                    grade = str(attr.get("GRADE") or "Grade A").strip()
                    status = str(attr.get("STATUS") or "Active").strip()
                    occ_type = str(attr.get("PRIMOCCTYPE") or "").strip()

                    batch_rows.append((
                        f"STP-{pin}",
                        addr,
                        "Saint Paul",
                        "Ramsey",
                        prop_name,
                        "",
                        "Saint Paul",
                        "MN",
                        "",
                        "",
                        "",
                        occ_type,
                        "",
                        "",
                        units,
                        f"Grade {grade}" if not grade.startswith("Grade") else grade,
                        status,
                        now
                    ))

                conn.executemany("""
                    INSERT OR REPLACE INTO rental_licenses (
                        apn, address, city, county, owner_name, owner_address, owner_city, owner_state, owner_zip,
                        owner_phone, owner_email, applicant_name, applicant_phone, applicant_email,
                        units, tier, status, synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, batch_rows)
                conn.commit()

                total_synced += len(batch_rows)
                if len(features) < batch_size:
                    break
                offset += batch_size

        return total_synced

    # --------------------------------------------------------------------------
    # 3. SYNC BROOKLYN PARK RENTAL LICENSES (2,081 Records)
    # --------------------------------------------------------------------------
    def sync_brooklyn_park_rentals(self, batch_size: int = 2000) -> int:
        """Downloads all active rental licenses for the City of Brooklyn Park."""
        url = "https://servergis.brooklynpark.org/arcgis/rest/services/Public/Misc/MapServer/6/query"
        offset = 0
        total_synced = 0
        now = datetime.now(timezone.utc).isoformat()

        with self._get_connection() as conn:
            while True:
                params = {
                    "where": "1=1",
                    "outFields": "OBJECTID,FullAddress,LicenseNumber,LicenseTypeCode,LicenseTypeDescription,ParcelNumber",
                    "returnGeometry": "false",
                    "resultOffset": offset,
                    "resultRecordCount": batch_size,
                    "f": "json"
                }
                r = httpx.get(url, params=params, timeout=30.0)
                r.raise_for_status()
                features = r.json().get("features", [])
                if not features:
                    break

                batch_rows = []
                for f in features:
                    attr = f.get("attributes", {})
                    lic_no = str(attr.get("LicenseNumber") or attr.get("OBJECTID") or "").strip()
                    if not lic_no:
                        continue
                    addr = str(attr.get("FullAddress") or "").strip()
                    lic_desc = str(attr.get("LicenseTypeDescription") or "Rental License").strip()
                    pin = str(attr.get("ParcelNumber") or "").strip()

                    batch_rows.append((
                        f"BP-{lic_no}",
                        addr,
                        "Brooklyn Park",
                        "Hennepin",
                        f"Parcel: {pin}" if pin else "Brooklyn Park Landlord",
                        "",
                        "Brooklyn Park",
                        "MN",
                        "",
                        "",
                        "",
                        lic_desc,
                        "",
                        "",
                        1,
                        "Suburban",
                        "Active",
                        now
                    ))

                conn.executemany("""
                    INSERT OR REPLACE INTO rental_licenses (
                        apn, address, city, county, owner_name, owner_address, owner_city, owner_state, owner_zip,
                        owner_phone, owner_email, applicant_name, applicant_phone, applicant_email,
                        units, tier, status, synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, batch_rows)
                conn.commit()

                total_synced += len(batch_rows)
                if len(features) < batch_size:
                    break
                offset += batch_size

        return total_synced

    # --------------------------------------------------------------------------
    # 4. INSERT & QUERY MULTI-CITY COUNTY PARCELS
    # --------------------------------------------------------------------------
    def insert_county_parcels(self, records: List[Dict[str, Any]], county: str) -> int:
        """Upserts property parcels into the county_parcels table."""
        if not records:
            return 0
        now = datetime.now(timezone.utc).isoformat()
        rows = []
        for rec in records:
            if county.upper() == "RAMSEY":
                pid = str(rec.get("ParcelID") or "").strip()
                if not pid:
                    continue
                city = str(rec.get("SiteCityName") or "Saint Paul").strip().title()
                addr = str(rec.get("SiteAddress") or "").strip()
                owner = str(rec.get("OwnerName") or "").strip()
                owner_addr = f"{rec.get('OwnerAddress1') or ''} {rec.get('OwnerCityStateZIP') or ''}".strip()
                taxpayer = str(rec.get("TaxName1") or "").strip()
                taxpayer_addr = f"{rec.get('TaxAddress1') or ''} {rec.get('TaxCityStateZIP') or ''}".strip()
                units = int(rec.get("LivingUnit") or 1)
                val = float(rec.get("EMVTotal") or 0.0)
                ptype = str(rec.get("UseType1") or rec.get("DwellingType") or "").strip()
                delq = ""
                yr = int(rec.get("YearBuilt") or 0)
            else:
                # Hennepin County
                pid = str(rec.get("PID") or "").strip()
                if not pid:
                    continue
                city = str(rec.get("MUNIC_NM") or "Minneapolis").strip().title()
                house = str(rec.get("HOUSE_NO") or "").strip()
                street = str(rec.get("STREET_NM") or "").strip()
                addr = f"{house} {street}".strip()
                owner = str(rec.get("OWNER_NM") or "").strip()
                owner_addr = ""
                taxpayer = str(rec.get("TAXPAYER_NM") or rec.get("TAXPAYER_NM_1") or "").strip()
                taxpayer_addr = ""
                units = 1
                val = float(rec.get("MKT_VAL_TOT") or 0.0)
                ptype = str(rec.get("PR_TYP_NM1") or "").strip()
                delq = str(rec.get("EARLIEST_DELQ_YR") or "").strip()
                yr = int(rec.get("BUILD_YR") or 0)

            rows.append((
                pid,
                county.title(),
                city,
                addr,
                owner,
                owner_addr,
                taxpayer,
                taxpayer_addr,
                units,
                val,
                ptype,
                "",
                delq,
                yr,
                now
            ))

        conn = self._get_connection()
        try:
            conn.executemany("""
                INSERT OR REPLACE INTO county_parcels (
                    pid, county, city, address, owner_name, owner_address,
                    taxpayer_name, taxpayer_address, units, market_value,
                    property_type, homestead_status, delinquent_tax_year, year_built, synced_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, rows)
            conn.commit()
        finally:
            conn.close()
        return len(rows)


    # --------------------------------------------------------------------------
    # 5. SEARCH & AGGREGATION ACROSS ALL CITIES
    # --------------------------------------------------------------------------
    def search(self, query: str, limit: int = 50, city: Optional[str] = None) -> List[Dict[str, Any]]:
        """Instant multi-column search across all stored rental licenses."""
        pattern = f"%{query.strip()}%"
        conn = self._get_connection()
        try:
            if city:
                cur = conn.execute("""
                    SELECT * FROM rental_licenses
                    WHERE UPPER(city) = UPPER(?)
                      AND (owner_name LIKE ?
                           OR applicant_name LIKE ?
                           OR applicant_email LIKE ?
                           OR applicant_phone LIKE ?
                           OR address LIKE ?
                           OR apn LIKE ?)
                    ORDER BY units DESC
                    LIMIT ?;
                """, (city.strip(), pattern, pattern, pattern, pattern, pattern, pattern, limit))
            else:
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

    def search_parcels(self, query: str, limit: int = 50, city: Optional[str] = None) -> List[Dict[str, Any]]:
        """Searches county parcels across Hennepin and Ramsey."""
        pattern = f"%{query.strip()}%"
        conn = self._get_connection()
        try:
            if city:
                cur = conn.execute("""
                    SELECT * FROM county_parcels
                    WHERE UPPER(city) = UPPER(?)
                      AND (owner_name LIKE ? OR taxpayer_name LIKE ? OR address LIKE ? OR pid LIKE ?)
                    ORDER BY market_value DESC
                    LIMIT ?;
                """, (city.strip(), pattern, pattern, pattern, pattern, limit))
            else:
                cur = conn.execute("""
                    SELECT * FROM county_parcels
                    WHERE owner_name LIKE ? OR taxpayer_name LIKE ? OR address LIKE ? OR pid LIKE ?
                    ORDER BY market_value DESC
                    LIMIT ?;
                """, (pattern, pattern, pattern, pattern, limit))
            return [dict(row) for row in cur.fetchall()]
        finally:
            conn.close()

    def get_metro_summary(self) -> Dict[str, Any]:
        """Provides a breakdown of rental licenses and parcels grouped by municipality."""
        conn = self._get_connection()
        try:
            cur_lic = conn.execute("""
                SELECT city, county, COUNT(*) as license_count, SUM(units) as total_units
                FROM rental_licenses
                GROUP BY city, county
                ORDER BY license_count DESC;
            """)
            licenses = [dict(r) for r in cur_lic.fetchall()]

            cur_parcels = conn.execute("""
                SELECT city, county, COUNT(*) as parcel_count, SUM(market_value) as total_market_val
                FROM county_parcels
                GROUP BY city, county
                ORDER BY parcel_count DESC;
            """)
            parcels = [dict(r) for r in cur_parcels.fetchall()]

            return {
                "rental_licenses_by_city": licenses,
                "parcels_by_city": parcels,
                "total_licenses": sum(item["license_count"] for item in licenses),
                "total_units": sum(item["total_units"] or 0 for item in licenses),
                "total_parcels": sum(item["parcel_count"] for item in parcels)
            }
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
