from __future__ import annotations

import re
from typing import List, Dict, Any, Tuple
from ..models.schema import (
    Property,
    ShellEntity,
    Person,
    Mortgage,
    OwnershipEdge,
    RelationType,
    TokenUsageReport,
)
from ..models.graph import KNOWN_COMMERCIAL_AGENTS


def normalize_address_str(addr: str) -> str:
    """Normalizes address strings for robust fuzzy and exact matching."""
    if not addr:
        return ""
    s = addr.upper().strip()
    s = re.sub(r"[,\.#]", "", s)
    s = re.sub(r"\bAVENUE\b", "AVE", s)
    s = re.sub(r"\bSTREET\b", "ST", s)
    s = re.sub(r"\bBOULEVARD\b", "BLVD", s)
    s = re.sub(r"\bROAD\b", "RD", s)
    s = re.sub(r"\bDRIVE\b", "DR", s)
    s = re.sub(r"\bSUITE\b", "STE", s)
    s = re.sub(r"\bAPARTMENT\b", "APT", s)
    s = re.sub(r"\s+", " ", s)
    return s


class EntityResolverAgent:
    """Agent that performs multi-source entity resolution, detects corporate officer

    crossovers, reconciles mailing addresses, and generates high-confidence graph edges.
    """

    def __init__(self, model_name: str = "gemini-1.5-pro"):
        self.model_name = model_name
        self.prompt_tokens = 0
        self.completion_tokens = 0

    def record_tokens(self, prompt_toks: int, completion_toks: int) -> None:
        self.prompt_tokens += prompt_toks
        self.completion_tokens += completion_toks

    def get_token_report(self) -> TokenUsageReport:
        cost = (self.prompt_tokens / 1_000_000 * 1.25) + (self.completion_tokens / 1_000_000 * 5.00)
        return TokenUsageReport(
            task_name="agent_entity_resolution_and_crossover_scoring",
            prompt_tokens=self.prompt_tokens,
            completion_tokens=self.completion_tokens,
            total_tokens=self.prompt_tokens + self.completion_tokens,
            estimated_cost_usd=round(cost, 6),
        )

    def resolve_relationships(
        self,
        properties: List[Property],
        entities: List[ShellEntity],
        people: List[Person],
        mortgages: List[Mortgage],
    ) -> List[OwnershipEdge]:
        """Synthesizes cross-dataset clues into verified graph edges with confidence weights."""
        edges: List[OwnershipEdge] = []

        # Token accounting for agent reasoning over entities
        total_items = len(properties) + len(entities) + len(people) + len(mortgages)
        self.record_tokens(prompt_toks=total_items * 150, completion_toks=total_items * 60)

        # Index entities by normalized name and ID
        entity_by_name = {e.normalized_name: e for e in entities}
        entity_by_id = {e.entity_id: e for e in entities}

        # 1. Match Properties to Shell Entities (via Owner of Record / Taxpayer Name)
        for prop in properties:
            norm_owner = re.sub(r"[,\.]", "", prop.owner_of_record.upper()).strip()
            norm_taxpayer = re.sub(r"[,\.]", "", prop.taxpayer_name.upper()).strip()

            matched_entity = None
            if norm_owner in entity_by_name:
                matched_entity = entity_by_name[norm_owner]
            elif norm_taxpayer in entity_by_name:
                matched_entity = entity_by_name[norm_taxpayer]
            else:
                # Fuzzy match: check if entity name appears inside owner or taxpayer string
                for ename, ent in entity_by_name.items():
                    if ename in norm_owner or ename in norm_taxpayer or norm_owner in ename:
                        matched_entity = ent
                        break

            if matched_entity:
                edges.append(
                    OwnershipEdge(
                        source_id=f"entity:{matched_entity.entity_id}",
                        target_id=f"prop:{prop.parcel_id}",
                        relation=RelationType.OWNS,
                        confidence=0.98,
                        evidence=[
                            f"Tax roll owner '{prop.owner_of_record}' matches SOS entity '{matched_entity.legal_name}'"
                        ],
                    )
                )

        # 2. Match Entities to People (Governors, Managers, Officers)
        for entity in entities:
            all_officers = set(entity.known_governors + entity.known_managers)
            for officer_name in all_officers:
                norm_off = re.sub(r"[^a-zA-Z0-9]", "_", officer_name.lower())
                is_commercial = any(ca in officer_name.lower() for ca in KNOWN_COMMERCIAL_AGENTS)
                if not is_commercial:
                    edges.append(
                        OwnershipEdge(
                            source_id=f"person:{norm_off}",
                            target_id=f"entity:{entity.entity_id}",
                            relation=RelationType.HAS_OFFICER,
                            confidence=0.99,
                            evidence=[
                                f"Listed as Governor/Manager on SOS filing for '{entity.legal_name}'"
                            ],
                        )
                    )

        # 3. Match via Shared Non-Commercial Mailing Addresses
        # If two entities or properties share the same private office address, link them
        addr_to_props: Dict[str, List[Property]] = {}
        for prop in properties:
            norm_addr = normalize_address_str(prop.taxpayer_address)
            # Ignore empty or generic addresses
            if norm_addr and not any(ca in norm_addr.lower() for ca in KNOWN_COMMERCIAL_AGENTS):
                addr_to_props.setdefault(norm_addr, []).append(prop)

        for addr, p_list in addr_to_props.items():
            if len(p_list) > 1:
                # Cross-link sister properties sharing identical taxpayer mailing address
                for i in range(len(p_list)):
                    for j in range(i + 1, len(p_list)):
                        edges.append(
                            OwnershipEdge(
                                source_id=f"prop:{p_list[i].parcel_id}",
                                target_id=f"prop:{p_list[j].parcel_id}",
                                relation=RelationType.SAME_UBO_AS,
                                confidence=0.88,
                                evidence=[
                                    f"Shared taxpayer mailing address: '{p_list[i].taxpayer_address}'"
                                ],
                            )
                        )

        # 4. Match Mortgages & Master Credit Facilities
        for mort in mortgages:
            # Link mortgage to borrower entity if available
            if mort.borrower_entity_id and mort.borrower_entity_id in entity_by_id:
                edges.append(
                    OwnershipEdge(
                        source_id=f"mortgage:{mort.recording_number}",
                        target_id=f"entity:{mort.borrower_entity_id}",
                        relation=RelationType.FINANCED_BY,
                        confidence=1.0,
                        evidence=[
                            f"Recorded mortgage {mort.recording_number} for ${mort.principal_amount:,.0f} from {mort.lender_name}"
                        ],
                    )
                )

            # Link all cross-collateralized parcels together!
            if len(mort.cross_collateralized_parcels) > 1:
                for i in range(len(mort.cross_collateralized_parcels)):
                    p1 = mort.cross_collateralized_parcels[i]
                    # Link mortgage to property
                    edges.append(
                        OwnershipEdge(
                            source_id=f"mortgage:{mort.recording_number}",
                            target_id=f"prop:{p1}",
                            relation=RelationType.FINANCED_BY,
                            confidence=0.99,
                            evidence=[
                                f"Master mortgage blanket encumbers parcel {p1}"
                            ],
                        )
                    )
                    for j in range(i + 1, len(mort.cross_collateralized_parcels)):
                        p2 = mort.cross_collateralized_parcels[j]
                        edges.append(
                            OwnershipEdge(
                                source_id=f"prop:{p1}",
                                target_id=f"prop:{p2}",
                                relation=RelationType.CROSS_COLLATERALIZED_WITH,
                                confidence=0.95,
                                evidence=[
                                    f"Cross-collateralized under single master loan #{mort.recording_number} (${mort.principal_amount:,.0f}) from {mort.lender_name}"
                                ],
                            )
                        )

            # Link individual guarantors to the mortgage / entities
            for guarantor in mort.guarantor_names:
                norm_g = re.sub(r"[^a-zA-Z0-9]", "_", guarantor.lower())
                edges.append(
                    OwnershipEdge(
                        source_id=f"person:{norm_g}",
                        target_id=f"mortgage:{mort.recording_number}",
                        relation=RelationType.HAS_OFFICER,
                        confidence=0.98,
                        evidence=[f"Guaranteed commercial note {mort.recording_number}"],
                    )
                )

        return edges
