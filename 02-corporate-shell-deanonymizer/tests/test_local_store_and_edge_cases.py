from __future__ import annotations

import tempfile
from pathlib import Path
import pytest

from src.engine.local_store import LocalRentalStore
from src.models.graph import OwnershipGraph
from src.models.schema import Property, ShellEntity, Person, OwnershipEdge, RelationType
from src.llm.client import OpenAICompatibleClient, OfflineRuleBasedClient
from src.extractors.live_sos_scraper import LiveSOSScraper


@pytest.fixture
def temp_store():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test_licenses.db"
        store = LocalRentalStore(db_path=db_path)
        yield store


def test_local_store_schema_and_empty(temp_store):
    assert temp_store.count() == 0
    results = temp_store.search("Nonexistent LLC")
    assert results == []


def test_local_store_insert_and_search(temp_store):
    conn = temp_store._get_connection()
    try:
        conn.execute("""
            INSERT INTO rental_licenses (
                apn, address, owner_name, owner_address, owner_city, owner_state, owner_zip,
                owner_phone, owner_email, applicant_name, applicant_phone, applicant_email,
                units, tier, status, synced_at
            ) VALUES (
                '123456789', '100 Main St', 'Apex Holdings LLC', '7400 Metro Blvd', 'Edina', 'MN', '55439',
                '612-555-0100', 'apex@corp.com', 'Jane Doe', '612-555-0199', 'manager@apexcorp.com',
                45, 'Tier 1', 'Active', '2026-09-13T00:00:00'
            )
        """)
        conn.commit()
    finally:
        conn.close()

    assert temp_store.count() == 1

    # Search by owner
    res = temp_store.search("Apex Holdings")
    assert len(res) == 1
    assert res[0]["apn"] == "123456789"
    assert res[0]["units"] == 45

    # Search by applicant email
    res2 = temp_store.search("manager@apexcorp.com")
    assert len(res2) == 1

    # Search by address
    res3 = temp_store.search("100 Main")
    assert len(res3) == 1


def test_local_store_syndicate_grouping(temp_store):
    conn = temp_store._get_connection()
    try:
        conn.executemany("""
            INSERT INTO rental_licenses (
                apn, address, owner_name, applicant_name, applicant_email, units, tier, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ('APN1', '100 Main St', 'LLC One', 'Bob Smith', 'bob@syndicate.com', 20, 'Tier 1', 'Active'),
            ('APN2', '200 Elm St', 'LLC Two', 'Bob Smith', 'bob@syndicate.com', 30, 'Tier 3', 'Active'),
            ('APN3', '300 Oak St', 'Solo Owner', 'Alice Solo', 'alice@solo.com', 5, 'Tier 1', 'Active'),
        ])
        conn.commit()
    finally:
        conn.close()

    syndicates = temp_store.get_top_syndicates_by_email(limit=10)
    assert len(syndicates) == 1
    s = syndicates[0]
    assert s["applicant_email"] == "bob@syndicate.com"
    assert s["property_count"] == 2
    assert s["shell_count"] == 2
    assert s["total_units"] == 50
    assert s["tier3_count"] == 1


def test_local_store_tier3_ranking(temp_store):
    conn = temp_store._get_connection()
    try:
        conn.executemany("""
            INSERT INTO rental_licenses (
                apn, address, owner_name, applicant_name, applicant_email, units, tier, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ('APN1', '100 Main St', 'Neglect LLC', 'Bad Landlord', 'bad@landlord.com', 15, 'Tier 3', 'Active'),
            ('APN2', '200 Elm St', 'Neglect LLC', 'Bad Landlord', 'bad@landlord.com', 25, 'Tier 3', 'Active'),
            ('APN3', '300 Oak St', 'Good LLC', 'Good Landlord', 'good@landlord.com', 50, 'Tier 1', 'Active'),
        ])
        conn.commit()
    finally:
        conn.close()

    worst = temp_store.get_worst_slumlords_by_tier3(limit=10)
    assert len(worst) == 1
    assert worst[0]["tier3_count"] == 2
    assert worst[0]["total_units"] == 40


def test_graph_isolated_and_missing_properties():
    graph = OwnershipGraph()
    # Query an address that doesn't exist
    res = graph.find_sister_properties("99999 Imaginary Way")
    assert res["found"] is False

    # Add an isolated property with no edges
    prop = Property(
        parcel_id="99-999-99",
        address="100 Isolated Lane",
        zip_code="55401",
        unit_count=8,
        taxpayer_name="Lone Owner",
        taxpayer_address="100 Isolated Lane",
        owner_of_record="Lone Owner",
    )
    graph.add_property(prop)
    res_iso = graph.find_sister_properties("100 Isolated Lane")
    assert res_iso["found"] is True
    assert res_iso["sister_properties"] == []
    assert res_iso["total_portfolio_units"] == 8


def test_sos_scraper_html_parsing():
    scraper = LiveSOSScraper()
    sample_html = """
    <table>
        <tr><th>Filing</th><th>Name</th><th>Type</th><th>Status</th></tr>
        <tr><td>123456</td><td>TEST RENTALS LLC</td><td>LLC</td><td>Active</td></tr>
        <tr><td>789012</td><td>MIDTOWN ASSETS LLC</td><td>LLC</td><td>Inactive</td></tr>
    </table>
    """
    records = scraper._parse_search_html(sample_html, "TEST RENTALS")
    assert len(records) == 2
    assert records[0]["legal_name"] == "TEST RENTALS LLC"
    assert records[0]["status"] == "Active"
    assert records[1]["status"] == "Inactive"


def test_llm_json_markdown_cleaning():
    client = OpenAICompatibleClient(base_url="http://localhost:11434/v1", model="test-model")
    # Test stripping markdown json codeblock fences
    raw_markdown = "```json\n{\"entity_id\": \"test_llc\", \"legal_name\": \"TEST LLC\", \"normalized_name\": \"TEST LLC\"}\n```"
    text = raw_markdown.split("```json")[1].split("```")[0].strip()
    entity = ShellEntity.model_validate_json(text)
    assert entity.entity_id == "test_llc"
    assert entity.legal_name == "TEST LLC"
