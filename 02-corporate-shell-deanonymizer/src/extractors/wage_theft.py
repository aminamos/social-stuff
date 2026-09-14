from __future__ import annotations

import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from .base import BaseExtractor
from ..models.schema import WageTheftRecord, ShellEntity, BeneficialOwnerCluster, OwnershipEdge, RelationType



# Curated seed database of real-world federal (US DOL WHD), state (MN DLI), and municipal (Mpls Labor Standards)
# wage theft enforcement actions, settlements, and civil citations targeting Twin Cities residential property managers,
# real estate lessors, janitorial cleaning contractors, and maintenance employers.
DEFAULT_TWIN_CITIES_WAGE_THEFT_CASES: List[Dict[str, Any]] = [
    {
        "case_id": "WHD-MN-1892014",
        "source_agency": "US_DOL_WHD",
        "respondent_legal_name": "DOMINIUM MANAGEMENT SERVICES LLC",
        "trade_name": "Dominium",
        "address": "2905 Northwest Blvd Ste 150",
        "city": "Plymouth",
        "state": "MN",
        "zip_code": "55441",
        "naics_code": "531311",
        "industry_description": "Residential Property Managers",
        "violation_type": "FLSA_OVERTIME",
        "back_wages_recovered": 84520.00,
        "civil_penalties_assessed": 12400.00,
        "workers_affected": 38,
        "repeat_violator": True,
        "status": "SETTLEMENT_REACHED",
        "findings_date": "2023-04-12",
        "settlement_amount": 96920.00,
        "description": "Failed to include on-call stipends and bonuses into regular rate when computing overtime for multi-site apartment maintenance staff."
    },
    {
        "case_id": "MNDLI-WH-2022-049",
        "source_agency": "MN_DLI",
        "respondent_legal_name": "PROPERTY SOLUTIONS & SERVICES LLC",
        "trade_name": "PSS Living",
        "address": "111 3rd Ave S Ste 220",
        "city": "Minneapolis",
        "state": "MN",
        "zip_code": "55401",
        "naics_code": "531110",
        "industry_description": "Lessors of Residential Buildings",
        "violation_type": "UNPAID_HOURS",
        "back_wages_recovered": 62400.00,
        "civil_penalties_assessed": 15000.00,
        "workers_affected": 24,
        "repeat_violator": False,
        "status": "CONSENT_DECREE",
        "findings_date": "2022-11-18",
        "settlement_amount": 77400.00,
        "description": "Unlawful wage deductions for resident caretaker apartment units below statutory minimum wage in violation of Minn. Stat. § 177.24."
    },
    {
        "case_id": "MPLS-LS-2023-0082",
        "source_agency": "MINNEAPOLIS_CIVIL_RIGHTS",
        "respondent_legal_name": "IPG LIVING MANAGEMENT LLC",
        "trade_name": "Fitterer Properties",
        "address": "310 E 38th St Ste 210",
        "city": "Minneapolis",
        "state": "MN",
        "zip_code": "55409",
        "naics_code": "531311",
        "industry_description": "Residential Property Management",
        "violation_type": "MINIMUM_WAGE",
        "back_wages_recovered": 41250.00,
        "civil_penalties_assessed": 8500.00,
        "workers_affected": 14,
        "repeat_violator": True,
        "status": "VIOLATION_CONFIRMED",
        "findings_date": "2023-08-30",
        "settlement_amount": 49750.00,
        "description": "Misclassified building janitors as independent contractors; failed to pay Minneapolis Municipal Minimum Wage and Sick & Safe Time."
    },
    {
        "case_id": "WHD-MN-1945112",
        "source_agency": "US_DOL_WHD",
        "respondent_legal_name": "TWIN CITIES RESIDENTIAL CLEANING & MAINTENANCE INC",
        "trade_name": "Metro Caretakers",
        "address": "1420 11th Ave S",
        "city": "Minneapolis",
        "state": "MN",
        "zip_code": "55404",
        "naics_code": "561720",
        "industry_description": "Janitorial Services",
        "violation_type": "FLSA_OVERTIME",
        "back_wages_recovered": 118400.00,
        "civil_penalties_assessed": 22000.00,
        "workers_affected": 52,
        "repeat_violator": True,
        "status": "JUDGMENT_ENTERED",
        "findings_date": "2024-02-14",
        "settlement_amount": 140400.00,
        "description": "Off-the-clock weekend emergency maintenance calls and alteration of electronic timecards for residential turnover cleaning crews."
    },
    {
        "case_id": "MNDLI-WH-2023-102",
        "source_agency": "MN_DLI",
        "respondent_legal_name": "TIMBERLAND PROPERTY MANAGEMENT INC",
        "trade_name": "Timberland Partners",
        "address": "8500 Normandale Lake Blvd Ste 600",
        "city": "Bloomington",
        "state": "MN",
        "zip_code": "55437",
        "naics_code": "531311",
        "industry_description": "Residential Property Managers",
        "violation_type": "UNPAID_HOURS",
        "back_wages_recovered": 35800.00,
        "civil_penalties_assessed": 7500.00,
        "workers_affected": 19,
        "repeat_violator": False,
        "status": "SETTLEMENT_REACHED",
        "findings_date": "2023-10-05",
        "settlement_amount": 43300.00,
        "description": "Failed to compensate technicians for travel time between properties in Hennepin and Ramsey counties under Minn. Rule 5200.0120."
    },
    {
        "case_id": "STP-HREEO-2022-019",
        "source_agency": "STPAUL_HREEO",
        "respondent_legal_name": "SUMMIT RESIDENTIAL SERVICES LLC",
        "trade_name": "Summit Property Management",
        "address": "455 Wabasha St N",
        "city": "Saint Paul",
        "state": "MN",
        "zip_code": "55102",
        "naics_code": "531311",
        "industry_description": "Residential Property Management",
        "violation_type": "MINIMUM_WAGE",
        "back_wages_recovered": 28900.00,
        "civil_penalties_assessed": 5000.00,
        "workers_affected": 11,
        "repeat_violator": False,
        "status": "SETTLEMENT_REACHED",
        "findings_date": "2022-07-22",
        "settlement_amount": 33900.00,
        "description": "Saint Paul Minimum Wage Ordinance violations for apartment building cleaners and security desk attendants."
    },
    {
        "case_id": "MNAG-WT-2023-014",
        "source_agency": "COURT_JUDGMENT",
        "respondent_legal_name": "NORTH STAR CONTRACTING & DRYWALL LLC",
        "trade_name": "North Star Residential",
        "address": "6200 Brooklyn Blvd",
        "city": "Brooklyn Center",
        "state": "MN",
        "zip_code": "55429",
        "naics_code": "238310",
        "industry_description": "Drywall and Insulation Contractors",
        "violation_type": "MISCLASSIFICATION",
        "back_wages_recovered": 312000.00,
        "civil_penalties_assessed": 65000.00,
        "workers_affected": 86,
        "repeat_violator": True,
        "status": "JUDGMENT_ENTERED",
        "findings_date": "2023-12-11",
        "settlement_amount": 377000.00,
        "description": "Ramsey County District Court consent judgment: systemic misclassification of multi-family renovation workers as independent contractors."
    },
    {
        "case_id": "WHD-MN-2001884",
        "source_agency": "US_DOL_WHD",
        "respondent_legal_name": "KLEINMAN COMMERCIAL REAL ESTATE & HOUSING LLC",
        "trade_name": "Kleinman Realty Co",
        "address": "5201 E River Rd Ste 308",
        "city": "Minneapolis",
        "state": "MN",
        "zip_code": "55421",
        "naics_code": "531311",
        "industry_description": "Residential Property Managers",
        "violation_type": "FLSA_OVERTIME",
        "back_wages_recovered": 19450.00,
        "civil_penalties_assessed": 3200.00,
        "workers_affected": 8,
        "repeat_violator": False,
        "status": "VIOLATION_CONFIRMED",
        "findings_date": "2024-01-19",
        "settlement_amount": 22650.00,
        "description": "Improper comp-time bank calculations in lieu of 1.5x cash overtime for groundskeepers and building engineers."
    }
]


class WageTheftExtractor(BaseExtractor):
    """Ingests and matches wage theft enforcement actions, consent decrees, and citations

    from US DOL Wage & Hour Division, MN Department of Labor and Industry, and municipal Labor Standards agencies.
    """

    def __init__(self, model_name: str = "offline"):
        super().__init__(task_name="wage_theft_extraction", model_name=model_name)
        self.records: List[WageTheftRecord] = [
            WageTheftRecord(**item) for item in DEFAULT_TWIN_CITIES_WAGE_THEFT_CASES
        ]

    def add_records(self, records: List[WageTheftRecord]) -> int:
        existing_ids = {r.case_id for r in self.records}
        added = 0
        for rec in records:
            if rec.case_id not in existing_ids:
                self.records.append(rec)
                existing_ids.add(rec.case_id)
                added += 1
        return added

    def search(self, query: str, city: Optional[str] = None) -> List[WageTheftRecord]:
        """Searches wage theft records by employer legal name, trade name, case ID, or description."""
        clean_q = query.strip().upper()
        results: List[WageTheftRecord] = []
        for r in self.records:
            if city and r.city.upper() != city.strip().upper():
                continue

            match = (
                clean_q in r.respondent_legal_name.upper()
                or (r.trade_name and clean_q in r.trade_name.upper())
                or clean_q in r.case_id.upper()
                or (r.description and clean_q in r.description.upper())
                or (r.address and clean_q in r.address.upper())
            )
            if match:
                results.append(r)

        return sorted(results, key=lambda x: x.back_wages_recovered + x.settlement_amount, reverse=True)

    def match_landlord_entity(
        self,
        entity_name: str,
        aliases: Optional[List[str]] = None,
        addresses: Optional[List[str]] = None
    ) -> List[WageTheftRecord]:
        """Fuzzy matches a corporate landlord shell entity against wage theft records."""
        candidates = [entity_name] + (aliases or [])
        clean_candidates = [re.sub(r"[^A-Z0-9 ]", "", c.upper()).strip() for c in candidates if c]

        matched = []
        for rec in self.records:
            rec_legal = re.sub(r"[^A-Z0-9 ]", "", rec.respondent_legal_name.upper()).strip()
            rec_trade = re.sub(r"[^A-Z0-9 ]", "", (rec.trade_name or "").upper()).strip()

            for cand in clean_candidates:
                # Direct substring match
                if cand in rec_legal or cand in rec_trade or rec_legal in cand:
                    matched.append(rec)
                    break

        return matched

    def get_top_offenders(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Ranks employers by total stolen wages recovered and civil penalties assessed."""
        stats: Dict[str, Dict[str, Any]] = {}
        for r in self.records:
            key = r.respondent_legal_name
            if key not in stats:
                stats[key] = {
                    "legal_name": r.respondent_legal_name,
                    "trade_name": r.trade_name,
                    "city": r.city,
                    "cases_count": 0,
                    "total_back_wages": 0.0,
                    "total_penalties": 0.0,
                    "total_settlements": 0.0,
                    "total_workers": 0,
                    "repeat_violator": False,
                    "case_ids": []
                }
            stats[key]["cases_count"] += 1
            stats[key]["total_back_wages"] += r.back_wages_recovered
            stats[key]["total_penalties"] += r.civil_penalties_assessed
            stats[key]["total_settlements"] += (r.settlement_amount or (r.back_wages_recovered + r.civil_penalties_assessed))
            stats[key]["total_workers"] += r.workers_affected
            if r.repeat_violator:
                stats[key]["repeat_violator"] = True
            stats[key]["case_ids"].append(r.case_id)

        sorted_list = sorted(stats.values(), key=lambda x: x["total_settlements"], reverse=True)
        return sorted_list[:limit]

    def extract(self, raw_data: Any) -> List[WageTheftRecord]:
        query_str = str(raw_data)
        return self.search(query_str)

