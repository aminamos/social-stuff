from __future__ import annotations

import networkx as nx
from typing import Dict, List, Any, Optional, Set, Tuple
from .schema import (
    Property,
    ShellEntity,
    Person,
    Mortgage,
    CodeViolation,
    OwnershipEdge,
    BeneficialOwnerCluster,
    RelationType,
)

# Known mass commercial registered agent providers that must NOT be treated as beneficial owners
KNOWN_COMMERCIAL_AGENTS = {
    "ct corporation system",
    "corporation service company",
    "csc-lawyers incorporating service",
    "national registered agents, inc.",
    "registered agents inc",
    "northwest registered agent llc",
    "inorp services, inc.",
    "parasec",
    "vcorp services, llc",
    "legalinc corporate services inc.",
}


class OwnershipGraph:
    """NetworkX-backed multi-graph engine for corporate shell de-anonymization."""

    def __init__(self):
        self.g = nx.MultiDiGraph()
        self.properties: Dict[str, Property] = {}
        self.entities: Dict[str, ShellEntity] = {}
        self.people: Dict[str, Person] = {}
        self.mortgages: Dict[str, Mortgage] = {}
        self.violations: Dict[str, CodeViolation] = {}

    def add_property(self, prop: Property) -> None:
        self.properties[prop.parcel_id] = prop
        self.g.add_node(
            f"prop:{prop.parcel_id}",
            node_type="Property",
            label=prop.address,
            parcel_id=prop.parcel_id,
            address=prop.address,
            units=prop.unit_count,
            assessed_value=prop.assessed_value,
            taxpayer=prop.taxpayer_name,
        )

    def add_shell_entity(self, entity: ShellEntity) -> None:
        self.entities[entity.entity_id] = entity
        self.g.add_node(
            f"entity:{entity.entity_id}",
            node_type="ShellEntity",
            label=entity.legal_name,
            entity_id=entity.entity_id,
            state=entity.state_of_formation,
            registered_agent=entity.registered_agent_name,
        )

    def add_person(self, person: Person) -> None:
        self.people[person.person_id] = person
        self.g.add_node(
            f"person:{person.person_id}",
            node_type="Person",
            label=person.full_name,
            person_id=person.person_id,
            is_commercial=person.is_commercial_agent_dummy,
        )

    def add_mortgage(self, mortgage: Mortgage) -> None:
        self.mortgages[mortgage.recording_number] = mortgage
        self.g.add_node(
            f"mortgage:{mortgage.recording_number}",
            node_type="Mortgage",
            label=f"Loan ${mortgage.principal_amount:,.0f} ({mortgage.lender_name})",
            amount=mortgage.principal_amount,
            lender=mortgage.lender_name,
        )

    def add_violation(self, violation: CodeViolation) -> None:
        self.violations[violation.violation_id] = violation
        self.g.add_node(
            f"violation:{violation.violation_id}",
            node_type="CodeViolation",
            label=f"Violation {violation.violation_id}: {violation.category}",
            severity=violation.severity.value,
            fine=violation.fine_amount,
        )
        # Link violation to property
        self.add_edge(
            OwnershipEdge(
                source_id=f"prop:{violation.parcel_id}",
                target_id=f"violation:{violation.violation_id}",
                relation=RelationType.CITED_FOR,
                confidence=1.0,
                evidence=[f"Municipal inspection citation {violation.violation_id}"],
            )
        )

    def add_address_node(self, raw_addr: str, normalized_addr: str, is_commercial: bool = False) -> str:
        node_id = f"addr:{normalized_addr}"
        if not self.g.has_node(node_id):
            self.g.add_node(
                node_id,
                node_type="Address",
                label=normalized_addr,
                is_commercial=is_commercial,
            )
        return node_id

    def add_edge(self, edge: OwnershipEdge) -> None:
        self.g.add_edge(
            edge.source_id,
            edge.target_id,
            relation=edge.relation.value,
            weight=edge.weight,
            confidence=edge.confidence,
            evidence=edge.evidence,
        )

    def find_sister_properties(self, query_address_or_pin: str) -> Dict[str, Any]:
        """Given a property address or PIN, traverses the ownership graph to unmask

        all sibling properties, shell entities, controlling officers, and lenders.
        """
        # Locate initial property node
        target_node = None
        for pid, prop in self.properties.items():
            if (
                pid.lower() == query_address_or_pin.lower()
                or query_address_or_pin.lower() in prop.address.lower()
            ):
                target_node = f"prop:{pid}"
                break

        if not target_node:
            return {"found": False, "message": f"No property matching '{query_address_or_pin}' found."}

        origin_prop = self.properties[target_node.replace("prop:", "")]

        # Undirected view for traversal, excluding commercial registered agent hubs
        undirected = nx.Graph()
        for u, v, data in self.g.edges(data=True):
            # Skip traversing through known commercial registered agent hubs
            is_skip = False
            for node in (u, v):
                node_data = self.g.nodes[node]
                if node_data.get("is_commercial"):
                    is_skip = True
                label = str(node_data.get("label", "")).lower()
                if any(ca in label for ca in KNOWN_COMMERCIAL_AGENTS):
                    is_skip = True
            if not is_skip and data.get("relation") != RelationType.CITED_FOR.value:
                undirected.add_edge(u, v, **data)

        if target_node not in undirected:
            # Isolated property with no links
            return {
                "found": True,
                "origin_property": origin_prop.model_dump(),
                "sister_properties": [],
                "shell_entities": [],
                "controlling_principals": [],
                "lenders": [],
                "total_portfolio_units": origin_prop.unit_count,
                "total_open_violations": self.get_property_violation_count(origin_prop.parcel_id),
                "explanation_paths": [],
            }

        component_nodes = nx.node_connected_component(undirected, target_node)

        sister_properties = []
        shell_entities = []
        principals = []
        lenders = set()
        total_units = 0
        total_violations = 0
        total_debt = 0.0

        for node in component_nodes:
            ntype = self.g.nodes[node].get("node_type")
            if ntype == "Property":
                pid = node.replace("prop:", "")
                p = self.properties[pid]
                total_units += p.unit_count
                total_violations += self.get_property_violation_count(pid)
                if pid != origin_prop.parcel_id:
                    sister_properties.append(p.model_dump())
            elif ntype == "ShellEntity":
                eid = node.replace("entity:", "")
                shell_entities.append(self.entities[eid].model_dump())
            elif ntype == "Person":
                person_id = node.replace("person:", "")
                principals.append(self.people[person_id].model_dump())
            elif ntype == "Mortgage":
                mid = node.replace("mortgage:", "")
                m = self.mortgages[mid]
                lenders.add(m.lender_name)
                total_debt += m.principal_amount

        # Calculate explanation paths from origin property to each sister property
        explanation_paths = []
        for sister in sister_properties:
            s_node = f"prop:{sister['parcel_id']}"
            try:
                path = nx.shortest_path(undirected, target_node, s_node)
                readable_steps = []
                for idx in range(len(path) - 1):
                    n1, n2 = path[idx], path[idx + 1]
                    edge_info = undirected.get_edge_data(n1, n2)
                    rel = edge_info.get("relation", "LINKED_TO")
                    label1 = self.g.nodes[n1].get("label", n1)
                    label2 = self.g.nodes[n2].get("label", n2)
                    readable_steps.append(f"[{label1}] --({rel})--> [{label2}]")
                explanation_paths.append({
                    "target_address": sister["address"],
                    "path_length": len(path) - 1,
                    "steps": readable_steps,
                })
            except nx.NetworkXNoPath:
                pass

        return {
            "found": True,
            "origin_property": origin_prop.model_dump(),
            "sister_properties": sister_properties,
            "shell_entities": shell_entities,
            "controlling_principals": principals,
            "primary_lenders": list(lenders),
            "total_portfolio_units": total_units,
            "total_portfolio_properties": len(sister_properties) + 1,
            "total_open_violations": total_violations,
            "total_mortgage_debt": total_debt,
            "explanation_paths": explanation_paths,
        }

    def get_property_violation_count(self, parcel_id: str) -> int:
        count = 0
        prop_node = f"prop:{parcel_id}"
        if self.g.has_node(prop_node):
            for _, target, data in self.g.out_edges(prop_node, data=True):
                if data.get("relation") == RelationType.CITED_FOR.value:
                    count += 1
        return count

    def cluster_portfolios(self) -> List[BeneficialOwnerCluster]:
        """Clusters entire graph into distinct beneficial ownership syndicates/portfolios."""
        undirected = nx.Graph()
        for u, v, data in self.g.edges(data=True):
            # Skip commercial registered agent mega-hubs
            is_skip = False
            for node in (u, v):
                node_data = self.g.nodes[node]
                if node_data.get("is_commercial"):
                    is_skip = True
                label = str(node_data.get("label", "")).lower()
                if any(ca in label for ca in KNOWN_COMMERCIAL_AGENTS):
                    is_skip = True
            if not is_skip and data.get("relation") != RelationType.CITED_FOR.value:
                undirected.add_edge(u, v, **data)

        clusters: List[BeneficialOwnerCluster] = []
        cluster_counter = 1

        for component in nx.connected_components(undirected):
            props = []
            prop_addrs = []
            entities = []
            entity_names = []
            principals = []
            lenders = set()
            total_units = 0
            total_value = 0.0
            total_violations = 0
            critical_violations = 0
            total_debt = 0.0

            for node in component:
                ntype = self.g.nodes[node].get("node_type")
                if ntype == "Property":
                    pid = node.replace("prop:", "")
                    p = self.properties[pid]
                    props.append(pid)
                    prop_addrs.append(p.address)
                    total_units += p.unit_count
                    total_value += p.assessed_value
                    # Count violations
                    for _, vtarget, vdata in self.g.out_edges(node, data=True):
                        if vdata.get("relation") == RelationType.CITED_FOR.value:
                            vid = vtarget.replace("violation:", "")
                            v = self.violations.get(vid)
                            if v:
                                total_violations += 1
                                if v.severity.value == "CRITICAL_LIFE_SAFETY":
                                    critical_violations += 1
                elif ntype == "ShellEntity":
                    eid = node.replace("entity:", "")
                    e = self.entities[eid]
                    entities.append(eid)
                    entity_names.append(e.legal_name)
                elif ntype == "Person":
                    person_id = node.replace("person:", "")
                    p = self.people[person_id]
                    principals.append(p.full_name)
                elif ntype == "Mortgage":
                    mid = node.replace("mortgage:", "")
                    m = self.mortgages[mid]
                    lenders.add(m.lender_name)
                    total_debt += m.principal_amount

            if props:  # Only output clusters that own real properties
                alias_name = (
                    principals[0] + " Real Estate Syndicate"
                    if principals
                    else (entity_names[0] + " Group" if entity_names else f"Portfolio #{cluster_counter}")
                )
                clusters.append(
                    BeneficialOwnerCluster(
                        cluster_id=f"cluster_{cluster_counter:03d}",
                        cluster_alias=alias_name,
                        ultimate_beneficial_owners=principals,
                        confidence_score=0.92,
                        property_parcel_ids=props,
                        property_addresses=prop_addrs,
                        shell_entity_ids=entities,
                        shell_entity_names=entity_names,
                        key_principals=principals,
                        total_units=total_units,
                        total_assessed_value=total_value,
                        open_violations_count=total_violations,
                        critical_violations_count=critical_violations,
                        total_mortgage_debt=total_debt,
                        primary_lenders=list(lenders),
                    )
                )
                cluster_counter += 1

        # Sort clusters by total units descending
        clusters.sort(key=lambda c: c.total_units, reverse=True)
        return clusters

    def to_cytoscape_json(self) -> Dict[str, Any]:
        """Outputs cytoscape / force-graph JSON format for front-end visualization."""
        elements = {"nodes": [], "edges": []}
        for node, data in self.g.nodes(data=True):
            elements["nodes"].append({
                "data": {
                    "id": node,
                    "label": data.get("label", node),
                    "type": data.get("node_type", "Unknown"),
                    **{k: v for k, v in data.items() if k not in ("label", "node_type")},
                }
            })
        edge_id = 0
        for u, v, data in self.g.edges(data=True):
            elements["edges"].append({
                "data": {
                    "id": f"e{edge_id}",
                    "source": u,
                    "target": v,
                    "relation": data.get("relation", ""),
                    "confidence": data.get("confidence", 1.0),
                    "evidence": data.get("evidence", []),
                }
            })
            edge_id += 1
        return elements
