from __future__ import annotations

import re
from typing import List, Dict, Any, Optional
import httpx

from .base import BaseExtractor
from ..models.schema import Property, ShellEntity, Person, OwnershipEdge, RelationType

HENNEPIN_PARCELS_URL = "https://gis.hennepin.us/arcgis/rest/services/HennepinData/LAND_PROPERTY/MapServer/1/query"
MINNEAPOLIS_RENTAL_LICENSES_URL = "https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Active_Rental_Licenses/FeatureServer/0/query"


class LiveMinneapolisClient(BaseExtractor):
    """Client for pulling real-time property assessments and active rental licenses

    directly from Hennepin County GIS and City of Minneapolis Open Data FeatureServers.
    """

    def __init__(self, model_name: str = "gemini-1.5-pro", timeout: float = 15.0):
        super().__init__(task_name="live_municipal_data_ingestion", model_name=model_name)
        self.timeout = timeout

    def fetch_rental_licenses(self, where: str = "licensedUnits >= 10", limit: int = 100) -> List[Dict[str, Any]]:
        """Queries live City of Minneapolis Active Rental Licenses FeatureServer."""
        params = {
            "where": where,
            "outFields": (
                "apn,address,ownerName,ownerAddress1,ownerAddress2,ownerCity,ownerState,ownerZip,"
                "ownerPhone,ownerEmail,applicantName,applicantAddress1,applicantCity,applicantState,"
                "applicantZip,applicantPhone,applicantEmail,licensedUnits,tier,status"
            ),
            "returnGeometry": "false",
            "resultRecordCount": limit,
            "f": "json",
        }
        try:
            r = httpx.get(MINNEAPOLIS_RENTAL_LICENSES_URL, params=params, timeout=self.timeout)
            r.raise_for_status()
            features = r.json().get("features", [])
            results = [f["attributes"] for f in features]

            # Token accounting for live JSON response
            raw_len = len(str(results))
            self.record_tokens(prompt_toks=max(raw_len // 4, 100), completion_toks=80)
            return results
        except Exception as e:
            print(f"[Warning] Failed to fetch live Minneapolis rental licenses: {e}")
            return []

    def fetch_hennepin_parcels(self, where: str = "OBJECTID > 0", limit: int = 100) -> List[Dict[str, Any]]:
        """Queries live Hennepin County GIS Land Property MapServer."""
        params = {
            "where": where,
            "outFields": "PID,HOUSE_NO,STREET_NM,ZIP_CD,OWNER_NM,TAXPAYER_NM,TAXPAYER_NM_1,MKT_VAL_TOT,EARLIEST_DELQ_YR",
            "returnGeometry": "false",
            "resultRecordCount": limit,
            "f": "json",
        }
        try:
            r = httpx.get(HENNEPIN_PARCELS_URL, params=params, timeout=self.timeout)
            r.raise_for_status()
            features = r.json().get("features", [])
            results = [f["attributes"] for f in features]

            raw_len = len(str(results))
            self.record_tokens(prompt_toks=max(raw_len // 4, 100), completion_toks=80)
            return results
        except Exception as e:
            print(f"[Warning] Failed to fetch live Hennepin County parcels: {e}")
            return []

    def search_live_portfolio(self, query: str, limit: int = 100) -> Dict[str, Any]:
        """Searches live rental licenses by owner name, applicant email domain, or address to

        unmask all sister properties sharing the same corporate management or taxpayer.
        """
        clean_q = query.replace("'", "''").strip()
        # Search against ownerName, applicantName, applicantEmail, or address
        where_clause = (
            f"UPPER(ownerName) LIKE '%{clean_q.upper()}%' "
            f"OR UPPER(applicantEmail) LIKE '%{clean_q.upper()}%' "
            f"OR UPPER(applicantName) LIKE '%{clean_q.upper()}%' "
            f"OR UPPER(address) LIKE '%{clean_q.upper()}%'"
        )

        licenses = self.fetch_rental_licenses(where=where_clause, limit=limit)

        properties: List[Property] = []
        entities: List[ShellEntity] = []
        people_map: Dict[str, Person] = {}

        for lic in licenses:
            apn = str(lic.get("apn") or "").strip()
            addr = str(lic.get("address") or "").strip()
            owner_name = str(lic.get("ownerName") or "Unknown Owner").strip()
            applicant_name = str(lic.get("applicantName") or "").strip()
            app_email = str(lic.get("applicantEmail") or "").strip()
            app_phone = str(lic.get("applicantPhone") or "").strip()
            tier = str(lic.get("tier") or "Tier 1").strip()
            units = int(lic.get("licensedUnits") or 1)

            owner_addr_parts = [
                lic.get("ownerAddress1"),
                lic.get("ownerCity"),
                lic.get("ownerState"),
                lic.get("ownerZip"),
            ]
            owner_addr_str = ", ".join([p.strip() for p in owner_addr_parts if p])

            prop = Property(
                parcel_id=apn,
                address=addr,
                city="Minneapolis",
                state="MN",
                zip_code=str(lic.get("ownerZip") or "55404"),
                unit_count=units,
                assessed_value=0.0,
                taxpayer_name=owner_name,
                taxpayer_address=owner_addr_str,
                owner_of_record=owner_name,
                rental_license_status=f"{lic.get('status', 'ACTIVE')} ({tier})",
                rental_license_contact_name=f"{applicant_name} ({app_email})" if app_email else applicant_name,
                rental_license_contact_phone=app_phone,
            )
            properties.append(prop)

            # Generate ShellEntity for owner
            eid = re.sub(r"[^a-zA-Z0-9]", "_", owner_name.lower())
            entities.append(
                ShellEntity(
                    entity_id=eid,
                    legal_name=owner_name,
                    normalized_name=owner_name.upper(),
                    principal_office_address=owner_addr_str,
                    known_managers=[applicant_name] if applicant_name else [],
                )
            )

            # Generate Person for applicant/manager
            if applicant_name:
                pid = re.sub(r"[^a-zA-Z0-9]", "_", applicant_name.lower())
                if pid not in people_map:
                    people_map[pid] = Person(
                        person_id=pid,
                        full_name=applicant_name,
                        normalized_name=applicant_name.upper(),
                        aliases=[app_email] if app_email else [],
                        affiliated_entities=[eid],
                    )
                else:
                    if eid not in people_map[pid].affiliated_entities:
                        people_map[pid].affiliated_entities.append(eid)

        return {
            "properties": properties,
            "entities": entities,
            "people": list(people_map.values()),
            "raw_licenses": licenses,
        }

    def extract(self, raw_input: Any) -> Any:
        return self.search_live_portfolio(str(raw_input))
