from __future__ import annotations

import pytest
import tempfile
from pathlib import Path

from src.models.schema import WageTheftRecord
from src.extractors.wage_theft import WageTheftExtractor, DEFAULT_TWIN_CITIES_WAGE_THEFT_CASES
from src.engine.local_store import LocalRentalStore
from src.engine.cloudflare_sync import generate_d1_wage_theft_seed_sql
from src.agents.dossier_generator import DossierGeneratorAgent


@pytest.fixture
def temp_store():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test_wage.db"
        store = LocalRentalStore(db_path=db_path)
        yield store


def test_wage_theft_extractor_search():
    extractor = WageTheftExtractor()
    assert len(extractor.records) >= 8

    # Search by legal name
    dominium_cases = extractor.search("Dominium")
    assert len(dominium_cases) >= 1
    assert "DOMINIUM" in dominium_cases[0].respondent_legal_name.upper()
    assert dominium_cases[0].back_wages_recovered > 0

    # Search by city
    mpls_cases = extractor.search("Minneapolis", city="Minneapolis")
    assert len(mpls_cases) >= 1

    # Match landlord entity fuzzy
    matched = extractor.match_landlord_entity("Dominium Management", aliases=["Dominium"])
    assert len(matched) >= 1
    assert matched[0].case_id == "WHD-MN-1892014"


def test_wage_theft_top_offenders():
    extractor = WageTheftExtractor()
    top = extractor.get_top_offenders(limit=5)
    assert len(top) == 5
    assert top[0]["total_settlements"] >= top[1]["total_settlements"]
    assert top[0]["total_workers"] > 0


def test_local_store_wage_theft_crud(temp_store):
    assert temp_store.wage_theft_count() == 0

    seeded = temp_store.seed_default_wage_theft_records()
    assert seeded >= 8
    assert temp_store.wage_theft_count() == seeded

    # Search
    results = temp_store.search_wage_theft("Fitterer")
    assert len(results) >= 1
    assert "IPG LIVING" in results[0]["respondent_legal_name"]

    # Top offenders
    top = temp_store.get_top_wage_theft_offenders(limit=3)
    assert len(top) == 3
    assert top[0]["total_recovered"] > 0


def test_generate_d1_wage_theft_seed_sql(temp_store):
    temp_store.seed_default_wage_theft_records()

    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = Path(tmpdir) / "wage_theft_seed.sql"
        generate_d1_wage_theft_seed_sql(temp_store, out_path)

        assert out_path.exists()
        content = out_path.read_text(encoding="utf-8")
        assert "INSERT OR REPLACE INTO wage_theft_records" in content
        assert "DOMINIUM MANAGEMENT SERVICES LLC" in content
        assert "WHD-MN-1892014" in content
        assert "BEGIN TRANSACTION;" not in content


def test_dossier_generator_with_wage_theft():
    agent = DossierGeneratorAgent()
    investigation = {
        "origin_property": {
            "address": "1420 11th Ave S",
            "parcel_id": "2602924420011",
            "owner_of_record": "1420 Eleventh Ave LLC",
            "unit_count": 24,
            "assessed_value": 2400000.0,
        },
        "sister_properties": [],
        "shell_entities": [],
        "controlling_principals": [{"full_name": "Marcus Vance"}],
        "primary_lenders": ["Midwest Commercial Capital"],
        "total_portfolio_properties": 1,
        "total_portfolio_units": 24,
        "total_open_violations": 8,
        "total_mortgage_debt": 1500000.0,
        "wage_theft_records": [
            {
                "respondent_legal_name": "TWIN CITIES RESIDENTIAL CLEANING & MAINTENANCE INC",
                "source_agency": "US_DOL_WHD",
                "violation_type": "FLSA_OVERTIME",
                "back_wages_recovered": 118400.0,
                "civil_penalties_assessed": 22000.0,
                "workers_affected": 52,
                "status": "JUDGMENT_ENTERED"
            }
        ]
    }

    dossier = agent.generate_dossier(investigation)
    assert "Labor Exploitation & Wage Theft Crossover" in dossier
    assert "TWIN CITIES RESIDENTIAL CLEANING & MAINTENANCE INC" in dossier
    assert "$118,400.00" in dossier
    assert "Joint Worker-Tenant Pickets" in dossier


def test_wage_theft_cloudflare_worker_files():
    base_path = Path(__file__).resolve().parent.parent / "cloudflare-wage-theft"
    assert (base_path / "wrangler.toml").exists()
    assert (base_path / "package.json").exists()
    assert (base_path / "src" / "index.ts").exists()
    assert (base_path / "src" / "ui.ts").exists()
    assert (base_path / "src" / "data.ts").exists()

    wrangler_content = (base_path / "wrangler.toml").read_text(encoding="utf-8")
    assert 'name = "twin-cities-wage-theft-worker"' in wrangler_content
    assert 'database_name = "social-housing-db"' in wrangler_content


def test_crossover_cloudflare_worker_files():
    base_path = Path(__file__).resolve().parent.parent / "cloudflare-crossover"
    assert (base_path / "wrangler.toml").exists()
    assert (base_path / "package.json").exists()
    assert (base_path / "src" / "index.ts").exists()
    assert (base_path / "src" / "ui.ts").exists()

    wrangler_content = (base_path / "wrangler.toml").read_text(encoding="utf-8")
    assert 'name = "twin-cities-slumlord-labor-matrix"' in wrangler_content
    assert 'database_name = "social-housing-db"' in wrangler_content


