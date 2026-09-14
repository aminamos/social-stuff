from __future__ import annotations

import pytest
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

from src.extractors.metro_client import MetroCountyClient, HENNEPIN_MUNICIPALITIES, RAMSEY_MUNICIPALITIES
from src.engine.local_store import LocalRentalStore
from src.engine.cloudflare_sync import (
    generate_d1_seed_sql,
    generate_d1_parcel_seed_sql,
    export_r2_snapshot,
    export_metro_parcels_r2_snapshot,
)


@pytest.fixture
def temp_metro_store():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test_metro.db"
        store = LocalRentalStore(db_path=db_path)
        yield store


def test_municipalities_lists():
    assert "MINNEAPOLIS" in HENNEPIN_MUNICIPALITIES
    assert "BLOOMINGTON" in HENNEPIN_MUNICIPALITIES
    assert "BROOKLYN PARK" in HENNEPIN_MUNICIPALITIES
    assert "EDINA" in HENNEPIN_MUNICIPALITIES
    assert len(HENNEPIN_MUNICIPALITIES) >= 45

    assert "SAINT PAUL" in RAMSEY_MUNICIPALITIES
    assert "ROSEVILLE" in RAMSEY_MUNICIPALITIES
    assert "MAPLEWOOD" in RAMSEY_MUNICIPALITIES
    assert len(RAMSEY_MUNICIPALITIES) >= 15


def test_insert_and_query_metro_rental_licenses(temp_metro_store):
    # Insert Minneapolis license
    conn = temp_metro_store._get_connection()
    try:
        conn.execute("""
            INSERT INTO rental_licenses (
                apn, address, city, county, owner_name, units, tier, status, synced_at
            ) VALUES ('MPLS-1', '100 Hennepin Ave', 'Minneapolis', 'Hennepin', 'Metro Holdings LLC', 50, 'Tier 1', 'Active', '2026-09-13T00:00:00')
        """)
        conn.execute("""
            INSERT INTO rental_licenses (
                apn, address, city, county, owner_name, units, tier, status, synced_at
            ) VALUES ('STP-1', '200 Summit Ave', 'Saint Paul', 'Ramsey', 'Metro Holdings LLC', 35, 'Grade A', 'Active', '2026-09-13T00:00:00')
        """)
        conn.execute("""
            INSERT INTO rental_licenses (
                apn, address, city, county, owner_name, units, tier, status, synced_at
            ) VALUES ('BP-1', '300 85th Ave N', 'Brooklyn Park', 'Hennepin', 'Suburban Landlord LLC', 12, 'Suburban', 'Active', '2026-09-13T00:00:00')
        """)
        conn.commit()
    finally:
        conn.close()

    assert temp_metro_store.count() == 3


    # Multi-city search
    results = temp_metro_store.search("Metro Holdings")
    assert len(results) == 2
    cities = {r["city"] for r in results}
    assert cities == {"Minneapolis", "Saint Paul"}

    # Search filtered by city
    stp_results = temp_metro_store.search("Metro Holdings", city="Saint Paul")
    assert len(stp_results) == 1
    assert stp_results[0]["address"] == "200 Summit Ave"

    # Summary
    summary = temp_metro_store.get_metro_summary()
    assert summary["total_licenses"] == 3
    assert summary["total_units"] == 97


def test_insert_and_query_county_parcels(temp_metro_store):
    ramsey_parcels = [
        {
            "ParcelID": "RAM-001",
            "SiteCityName": "Saint Paul",
            "SiteAddress": "500 Grand Ave",
            "OwnerName": "Summit Equity Partners",
            "OwnerAddress1": "100 Wall St",
            "OwnerCityStateZIP": "New York NY 10005",
            "TaxName1": "Summit Tax Dept",
            "LivingUnit": 60,
            "EMVTotal": 7500000.0,
            "UseType1": "4A APARTMENT",
            "YearBuilt": 2018,
        },
        {
            "ParcelID": "RAM-002",
            "SiteCityName": "Roseville",
            "SiteAddress": "1200 County Rd B",
            "OwnerName": "Summit Equity Partners",
            "LivingUnit": 40,
            "EMVTotal": 4200000.0,
            "UseType1": "4A APARTMENT",
            "YearBuilt": 2015,
        }
    ]

    hennepin_parcels = [
        {
            "PID": "HEN-001",
            "MUNIC_NM": "BLOOMINGTON",
            "HOUSE_NO": "8100",
            "STREET_NM": "24TH AVE S",
            "OWNER_NM": "Summit Equity Partners",
            "TAXPAYER_NM": "Summit Tax Dept",
            "MKT_VAL_TOT": 12000000.0,
            "PR_TYP_NM1": "APARTMENT",
            "BUILD_YR": 2020,
        }
    ]

    inserted_r = temp_metro_store.insert_county_parcels(ramsey_parcels, "Ramsey")
    assert inserted_r == 2

    inserted_h = temp_metro_store.insert_county_parcels(hennepin_parcels, "Hennepin")
    assert inserted_h == 1

    assert temp_metro_store.parcel_count() == 3

    # Cross-county parcel search
    matches = temp_metro_store.search_parcels("Summit Equity")
    assert len(matches) == 3
    cities = {m["city"] for m in matches}
    assert "Saint Paul" in cities
    assert "Roseville" in cities
    assert "Bloomington" in cities

    # Summary
    summary = temp_metro_store.get_metro_summary()
    assert summary["total_parcels"] == 3


def test_d1_parcel_seed_sql_generation(temp_metro_store):
    sample_parcels = [
        {
            "ParcelID": "TEST-PARCEL-1",
            "SiteCityName": "Saint Paul",
            "SiteAddress": "123 Test Rd",
            "OwnerName": "Big Landlord Corp",
            "LivingUnit": 20,
            "EMVTotal": 3500000.0,
            "UseType1": "APARTMENT",
            "YearBuilt": 2010,
        }
    ]
    temp_metro_store.insert_county_parcels(sample_parcels, "Ramsey")

    with tempfile.TemporaryDirectory() as tmpdir:
        out_sql = Path(tmpdir) / "parcels_seed.sql"
        generate_d1_parcel_seed_sql(temp_metro_store, out_sql)

        assert out_sql.exists()
        content = out_sql.read_text(encoding="utf-8")
        assert "INSERT OR REPLACE INTO county_parcels" in content
        assert "'TEST-PARCEL-1'" in content
        assert "'Big Landlord Corp'" in content
        assert "'Saint Paul'" in content


def test_export_parcels_r2_snapshot(temp_metro_store):
    sample_parcels = [
        {
            "ParcelID": "TEST-PARCEL-2",
            "SiteCityName": "Edina",
            "SiteAddress": "456 France Ave",
            "OwnerName": "Luxury Living LLC",
            "LivingUnit": 100,
            "EMVTotal": 15000000.0,
            "UseType1": "APARTMENT",
            "YearBuilt": 2022,
        }
    ]
    temp_metro_store.insert_county_parcels(sample_parcels, "Hennepin")

    with tempfile.TemporaryDirectory() as tmpdir:
        out_gz = Path(tmpdir) / "parcels.json.gz"
        export_metro_parcels_r2_snapshot(temp_metro_store, out_gz)
        assert out_gz.exists()
        assert out_gz.stat().st_size > 0


def test_metro_client_search_aggregation():
    client = MetroCountyClient()

    # Mock all API calls to verify aggregation logic
    with patch.object(client, "fetch_stpaul_cofo") as mock_stp, \
         patch.object(client, "fetch_brooklyn_park_rentals") as mock_bp, \
         patch.object(client, "fetch_ramsey_parcels") as mock_rc, \
         patch.object(client, "fetch_hennepin_parcels") as mock_hc, \
         patch("httpx.get") as mock_get:

        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "features": [{
                "attributes": {
                    "apn": "0102924",
                    "address": "100 1st Ave",
                    "ownerName": "Alpha Landlord LLC",
                    "licensedUnits": 25,
                    "tier": "Tier 1",
                    "status": "Active"
                }
            }]
        }

        mock_stp.return_value = [{
            "PIN": "987654",
            "PROPNAME": "Alpha Tower",
            "ADDRESS": "200 2nd St",
            "UNITS": 50,
            "GRADE": "A",
            "STATUS": "Active"
        }]

        mock_bp.return_value = [{
            "FullAddress": "300 Brooklyn Blvd",
            "LicenseTypeDescription": "Apartment",
            "ParcelNumber": "555111"
        }]

        mock_rc.return_value = [{
            "ParcelID": "987654",
            "SiteCityName": "SAINT PAUL",
            "SiteAddress": "200 2nd St",
            "OwnerName": "Alpha Landlord LLC",
            "TaxName1": "Alpha Tax LLC",
            "LivingUnit": 50,
            "EMVTotal": 6000000.0
        }]

        mock_hc.return_value = [{
            "PID": "0102924",
            "MUNIC_NM": "BLOOMINGTON",
            "HOUSE_NO": "400",
            "STREET_NM": "Normandale Blvd",
            "OWNER_NM": "Alpha Landlord LLC",
            "TAXPAYER_NM": "Alpha Tax LLC",
            "MKT_VAL_TOT": 8000000.0
        }]

        res = client.search_metro_syndicate("Alpha")

        assert res["summary"]["total_records"] == 5
        assert "Minneapolis" in res["summary"]["jurisdictions"]
        assert "Saint Paul" in res["summary"]["jurisdictions"]
        assert "Brooklyn Park" in res["summary"]["jurisdictions"]
        assert "Bloomington" in res["summary"]["jurisdictions"]
        assert res["summary"]["total_units"] >= 125
        assert res["summary"]["total_market_value"] == 14000000.0
