from __future__ import annotations

import json
from pathlib import Path
import pytest

from src.models.schema import Property, ShellEntity, Person, Mortgage, CodeViolation
from src.models.graph import OwnershipGraph
from src.engine.pipeline import DeAnonymizationPipeline


@pytest.fixture
def fixtures_dir():
    return Path(__file__).resolve().parent.parent / "data" / "sample_fixtures"


def test_pipeline_fixture_loading(fixtures_dir):
    pipeline = DeAnonymizationPipeline()
    pipeline.load_from_fixtures(fixtures_dir)

    assert len(pipeline.graph.properties) == 5
    assert len(pipeline.graph.entities) == 5
    assert len(pipeline.graph.mortgages) == 2
    assert len(pipeline.graph.violations) == 6


def test_investigate_sister_properties_unmasking(fixtures_dir):
    pipeline = DeAnonymizationPipeline()
    pipeline.load_from_fixtures(fixtures_dir)

    # Investigate 1420 11th Ave S
    result = pipeline.investigate("1420 11th Ave S")
    assert result["found"] is True

    # Check unmasked beneficial owners
    principal_names = {p["full_name"] for p in result["controlling_principals"]}
    assert "Marcus Vance" in principal_names
    assert "Eleanor Vance" in principal_names

    # Check sister properties unmasked
    sister_addresses = {s["address"] for s in result["sister_properties"]}
    assert "2815 Grand Ave S" in sister_addresses
    assert "712 E 15th St" in sister_addresses
    assert "3104 Cedar Ave S" in sister_addresses

    # Verify that unrelated property (415 6th Ave SE) is NOT in this portfolio
    assert "415 6th Ave SE" not in sister_addresses

    # Total portfolio metrics
    assert result["total_portfolio_properties"] == 4
    # Units: 24 (1420 11th) + 36 (2815 Grand) + 18 (712 E 15th) + 42 (3104 Cedar) = 120 units
    assert result["total_portfolio_units"] == 120
    assert result["total_mortgage_debt"] == 14800000.0

    # Ensure explanation paths exist
    paths = result["explanation_paths"]
    assert len(paths) == 3


def test_cluster_separation(fixtures_dir):
    pipeline = DeAnonymizationPipeline()
    pipeline.load_from_fixtures(fixtures_dir)

    clusters = pipeline.get_all_clusters()
    # Expect 2 distinct clusters: Vance Syndicate (4 properties) and Jenkins/Dinkytown (1 property)
    assert len(clusters) == 2

    # First cluster is the largest
    vance_cluster = clusters[0]
    assert vance_cluster.total_units == 120
    assert len(vance_cluster.property_parcel_ids) == 4
    assert "Marcus Vance" in vance_cluster.ultimate_beneficial_owners

    second_cluster = clusters[1]
    assert second_cluster.total_units == 12
    assert len(second_cluster.property_parcel_ids) == 1
    assert "Sarah Jenkins" in second_cluster.ultimate_beneficial_owners


def test_dossier_generation(fixtures_dir):
    pipeline = DeAnonymizationPipeline()
    pipeline.load_from_fixtures(fixtures_dir)

    dossier = pipeline.generate_dossier("1420 11th Ave S")
    assert "# TENANT UNION ACTION DOSSIER" in dossier
    assert "Marcus Vance" in dossier
    assert "Eleanor Vance" in dossier
    assert "Arbor Commercial Mortgage LLC" in dossier
    assert "$14,800,000" in dossier
    assert "120 Total Residential Units" in dossier


def test_token_accounting(fixtures_dir):
    pipeline = DeAnonymizationPipeline()
    pipeline.load_from_fixtures(fixtures_dir)
    pipeline.generate_dossier("1420 11th Ave S")

    accounting = pipeline.get_total_token_accounting()
    assert accounting["total_tokens"] > 0
    assert accounting["total_prompt_tokens"] > 0
    assert accounting["total_completion_tokens"] > 0
    assert accounting["total_estimated_cost_usd"] > 0.0
