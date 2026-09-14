from __future__ import annotations

import tempfile
import gzip
import json
from pathlib import Path
import pytest

from src.engine.local_store import LocalRentalStore
from src.engine.cloudflare_sync import export_r2_snapshot, generate_d1_seed_sql


@pytest.fixture
def populated_store():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test_sync.db"
        store = LocalRentalStore(db_path=db_path)
        conn = store._get_connection()
        try:
            conn.execute("""
                INSERT INTO rental_licenses (
                    apn, address, owner_name, owner_address, owner_city, owner_state, owner_zip,
                    owner_phone, owner_email, applicant_name, applicant_phone, applicant_email,
                    units, tier, status, synced_at
                ) VALUES (
                    'APN-TEST-1', '500 Nicollet Mall', 'Test Landlord LLC', '100 1st St', 'Minneapolis', 'MN', '55401',
                    '612-555-0123', 'owner@test.com', 'Manager Mark', '612-555-0999', 'manager@test.com',
                    100, 'Tier 1', 'Active', '2026-09-13T00:00:00'
                )
            """)
            conn.commit()
        finally:
            conn.close()
        yield store


def test_export_r2_snapshot(populated_store):
    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = Path(tmpdir) / "test_snapshot.json.gz"
        export_r2_snapshot(populated_store, out_path)

        assert out_path.exists()
        with gzip.open(out_path, "rt", encoding="utf-8") as f:
            data = json.load(f)
            assert len(data) == 1
            assert data[0]["apn"] == "APN-TEST-1"
            assert data[0]["units"] == 100


def test_generate_d1_seed_sql(populated_store):
    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = Path(tmpdir) / "test_seed.sql"
        generate_d1_seed_sql(populated_store, out_path)

        assert out_path.exists()
        content = out_path.read_text(encoding="utf-8")
        assert "BEGIN TRANSACTION;" in content
        assert "INSERT OR REPLACE INTO rental_licenses" in content
        assert "'APN-TEST-1'" in content
        assert "'Test Landlord LLC'" in content
        assert "COMMIT;" in content
