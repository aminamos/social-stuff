from __future__ import annotations

import pytest
from src.extractors.live_minneapolis_client import LiveMinneapolisClient
from src.engine.pipeline import DeAnonymizationPipeline


def test_live_minneapolis_client_search():
    client = LiveMinneapolisClient(timeout=15.0)
    # Search for a known management network
    result = client.search_live_portfolio("Fitterer", limit=5)
    
    assert "properties" in result
    assert "entities" in result
    assert "people" in result
    
    if result["properties"]:  # If network is reachable
        assert len(result["properties"]) > 0
        p = result["properties"][0]
        assert p.city == "Minneapolis"
        assert p.unit_count >= 1
        assert p.parcel_id != ""


def test_live_query_pipeline_integration():
    pipeline = DeAnonymizationPipeline()
    live_data = pipeline.load_from_live_query("Fitterer", limit=5)
    
    if live_data["properties"]:
        assert len(pipeline.graph.properties) > 0
        # Verify token accounting recorded live tokens
        accounting = pipeline.get_total_token_accounting()
        assert accounting["total_tokens"] > 0
