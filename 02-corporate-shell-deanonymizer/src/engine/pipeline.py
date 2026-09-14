from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Any, List, Optional

from ..models.schema import (
    Property,
    ShellEntity,
    Person,
    Mortgage,
    CodeViolation,
    BeneficialOwnerCluster,
    TokenUsageReport,
)
from ..models.graph import OwnershipGraph
from ..extractors.tax_registry import TaxRegistryExtractor
from ..extractors.sos_filings import SOSFilingsExtractor
from ..extractors.code_violations import CodeViolationsExtractor
from ..extractors.mortgage_liens import MortgageLiensExtractor
from ..extractors.live_minneapolis_client import LiveMinneapolisClient
from ..agents.entity_resolver import EntityResolverAgent
from ..agents.dossier_generator import DossierGeneratorAgent


class DeAnonymizationPipeline:
    """End-to-end ingestion, entity resolution, graph compilation, and campaign synthesis pipeline."""

    def __init__(self, model_name: str = "gemini-1.5-pro"):
        self.model_name = model_name
        self.tax_extractor = TaxRegistryExtractor(model_name=model_name)
        self.sos_extractor = SOSFilingsExtractor(model_name=model_name)
        self.violations_extractor = CodeViolationsExtractor(model_name=model_name)
        self.mortgage_extractor = MortgageLiensExtractor(model_name=model_name)
        self.live_client = LiveMinneapolisClient(model_name=model_name)
        self.resolver_agent = EntityResolverAgent(model_name=model_name)
        self.dossier_agent = DossierGeneratorAgent(model_name=model_name)
        self.graph = OwnershipGraph()

    def ingest_data(
        self,
        tax_records: List[Dict[str, Any]],
        sos_filings: List[Dict[str, Any]],
        code_violations: List[Dict[str, Any]],
        mortgage_records: List[Dict[str, Any]],
    ) -> None:
        """Runs multi-source extractors and constructs the base ownership graph."""
        # 1. Ingest Tax Records
        properties = self.tax_extractor.extract(tax_records)
        for p in properties:
            self.graph.add_property(p)

        # 2. Ingest SOS Filings
        sos_data = self.sos_extractor.extract(sos_filings)
        entities: List[ShellEntity] = sos_data["entities"]
        people: List[Person] = sos_data["people"]

        for e in entities:
            self.graph.add_shell_entity(e)
        for person in people:
            self.graph.add_person(person)

        # 3. Ingest Code Violations
        violations = self.violations_extractor.extract(code_violations)
        for v in violations:
            self.graph.add_violation(v)

        # 4. Ingest Mortgages
        mortgages = self.mortgage_extractor.extract(mortgage_records)
        for m in mortgages:
            self.graph.add_mortgage(m)

        # 5. Run Entity Resolution Agent
        edges = self.resolver_agent.resolve_relationships(
            properties=properties,
            entities=entities,
            people=people,
            mortgages=mortgages,
        )
        for edge in edges:
            self.graph.add_edge(edge)

    def load_from_fixtures(self, fixtures_dir: Path) -> None:
        """Loads and ingests sample JSON fixtures."""
        tax_path = fixtures_dir / "tax_records.json"
        sos_path = fixtures_dir / "sos_filings.json"
        viol_path = fixtures_dir / "code_violations.json"
        mort_path = fixtures_dir / "mortgage_records.json"

        with open(tax_path, "r", encoding="utf-8") as f:
            tax_records = json.load(f)
        with open(sos_path, "r", encoding="utf-8") as f:
            sos_filings = json.load(f)
        with open(viol_path, "r", encoding="utf-8") as f:
            code_violations = json.load(f)
        with open(mort_path, "r", encoding="utf-8") as f:
            mortgage_records = json.load(f)

        self.ingest_data(
            tax_records=tax_records,
            sos_filings=sos_filings,
            code_violations=code_violations,
            mortgage_records=mortgage_records,
        )

    def load_from_live_query(self, query: str, limit: int = 50) -> Dict[str, Any]:
        """Queries live City of Minneapolis Open Data and builds the ownership graph."""
        live_data = self.live_client.search_live_portfolio(query=query, limit=limit)
        properties = live_data["properties"]
        entities = live_data["entities"]
        people = live_data["people"]

        for p in properties:
            self.graph.add_property(p)
        for e in entities:
            self.graph.add_shell_entity(e)
        for person in people:
            self.graph.add_person(person)

        edges = self.resolver_agent.resolve_relationships(
            properties=properties,
            entities=entities,
            people=people,
            mortgages=[],
        )
        for edge in edges:
            self.graph.add_edge(edge)

        return live_data

    def investigate(self, address_or_pin: str) -> Dict[str, Any]:
        """Runs graph traversal and entity de-anonymization for a specific property."""
        return self.graph.find_sister_properties(address_or_pin)

    def generate_dossier(self, address_or_pin: str) -> str:
        """Generates a complete tactical tenant union dossier."""
        investigation = self.investigate(address_or_pin)
        if not investigation.get("found"):
            return f"Error: {investigation.get('message')}"
        return self.dossier_agent.generate_dossier(investigation)

    def get_all_clusters(self) -> List[BeneficialOwnerCluster]:
        """Returns all identified landlord syndicates/clusters."""
        return self.graph.cluster_portfolios()

    def get_total_token_accounting(self) -> Dict[str, Any]:
        """Summarizes token expenditure and estimated costs across all agents and extractors."""
        reports = [
            self.tax_extractor.get_token_report(),
            self.sos_extractor.get_token_report(),
            self.violations_extractor.get_token_report(),
            self.mortgage_extractor.get_token_report(),
            self.live_client.get_token_report(),
            self.resolver_agent.get_token_report(),
            self.dossier_agent.get_token_report(),
        ]
        total_prompt = sum(r.prompt_tokens for r in reports)
        total_completion = sum(r.completion_tokens for r in reports)
        total_tokens = total_prompt + total_completion
        total_cost = sum(r.estimated_cost_usd for r in reports)

        return {
            "total_tokens": total_tokens,
            "total_prompt_tokens": total_prompt,
            "total_completion_tokens": total_completion,
            "total_estimated_cost_usd": round(total_cost, 6),
            "breakdown": [r.model_dump() for r in reports],
        }
