from __future__ import annotations

import re
from typing import List, Dict, Any
from .base import BaseExtractor
from ..models.schema import ShellEntity, Person
from ..models.graph import KNOWN_COMMERCIAL_AGENTS


class SOSFilingsExtractor(BaseExtractor):
    """Parses Secretary of State corporate registration filings and annual reports."""

    def __init__(self, model_name: str = "gemini-1.5-pro"):
        super().__init__(task_name="secretary_of_state_corporate_filing_ingestion", model_name=model_name)

    def extract(self, raw_filings: List[Dict[str, Any]]) -> Dict[str, Any]:
        entities: List[ShellEntity] = []
        people_map: Dict[str, Person] = {}

        for filing in raw_filings:
            # Estimate token usage: legal filing PDFs/JSON usually ~250-400 tokens per record
            raw_text = str(filing)
            sim_prompt = max(len(raw_text) // 4, 80)
            sim_completion = 120
            self.record_tokens(sim_prompt, sim_completion)

            legal_name = filing.get("legal_name", "").strip()
            norm_name = re.sub(r"[,\.]", "", legal_name.upper()).strip()
            eid = filing.get("entity_id", norm_name.replace(" ", "_").lower())

            agent_name = filing.get("registered_agent_name", "").strip()
            agent_addr = filing.get("registered_agent_address", "").strip()
            principal_addr = filing.get("principal_office_address", "").strip()

            governors = filing.get("governors", [])
            managers = filing.get("managers", [])

            entity = ShellEntity(
                entity_id=eid,
                legal_name=legal_name,
                normalized_name=norm_name,
                state_of_formation=filing.get("state_of_formation", "MN"),
                filing_number=filing.get("filing_number"),
                formation_date=filing.get("formation_date"),
                status=filing.get("status", "Active"),
                registered_agent_name=agent_name if agent_name else None,
                registered_agent_address=agent_addr if agent_addr else None,
                principal_office_address=principal_addr if principal_addr else None,
                known_governors=governors,
                known_managers=managers,
            )
            entities.append(entity)

            # Process individuals / governors / managers
            all_individuals = set(governors + managers)
            for ind in all_individuals:
                ind_clean = ind.strip()
                if not ind_clean:
                    continue
                pid = re.sub(r"[^a-zA-Z0-9]", "_", ind_clean.lower())
                
                # Check if this name is an obvious commercial agent
                is_commercial = any(ca in ind_clean.lower() for ca in KNOWN_COMMERCIAL_AGENTS)

                if pid not in people_map:
                    people_map[pid] = Person(
                        person_id=pid,
                        full_name=ind_clean,
                        normalized_name=ind_clean.upper(),
                        aliases=[ind_clean],
                        affiliated_entities=[eid],
                        primary_address=principal_addr,
                        is_commercial_agent_dummy=is_commercial,
                    )
                else:
                    if eid not in people_map[pid].affiliated_entities:
                        people_map[pid].affiliated_entities.append(eid)

        return {"entities": entities, "people": list(people_map.values())}
