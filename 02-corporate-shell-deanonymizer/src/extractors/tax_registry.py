from __future__ import annotations

import re
from typing import List, Dict, Any
from .base import BaseExtractor
from ..models.schema import Property


class TaxRegistryExtractor(BaseExtractor):
    """Parses municipal property tax records and assessor rolls."""

    def __init__(self, model_name: str = "gemini-1.5-pro"):
        super().__init__(task_name="municipal_tax_registry_ingestion", model_name=model_name)

    def extract(self, raw_records: List[Dict[str, Any]]) -> List[Property]:
        properties: List[Property] = []
        for record in raw_records:
            # Estimate token cost: raw tax roll string ~80-120 tokens per record
            raw_text = str(record)
            simulated_prompt_tokens = max(len(raw_text) // 4, 30)
            simulated_completion_tokens = 45
            self.record_tokens(simulated_prompt_tokens, simulated_completion_tokens)

            # Clean and normalize address
            raw_addr = record.get("property_address", "").strip()
            city = record.get("city", "Minneapolis")
            state = record.get("state", "MN")
            zip_code = record.get("zip_code", "55404")

            # Clean taxpayer
            raw_taxpayer = record.get("taxpayer_name", "").strip()
            owner_of_record = record.get("owner_of_record", raw_taxpayer).strip()

            prop = Property(
                parcel_id=str(record.get("parcel_id", "")).strip(),
                address=raw_addr,
                city=city,
                state=state,
                zip_code=zip_code,
                unit_count=int(record.get("unit_count", 1)),
                assessed_value=float(record.get("assessed_value", 0.0)),
                taxpayer_name=raw_taxpayer,
                taxpayer_address=str(record.get("taxpayer_address", "")).strip(),
                owner_of_record=owner_of_record,
                rental_license_status=record.get("rental_license_status", "ACTIVE"),
                rental_license_contact_name=record.get("rental_license_contact_name"),
                rental_license_contact_phone=record.get("rental_license_contact_phone"),
            )
            properties.append(prop)

        return properties
