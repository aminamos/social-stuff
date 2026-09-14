from __future__ import annotations

from typing import List, Dict, Any
from .base import BaseExtractor
from ..models.schema import Mortgage


class MortgageLiensExtractor(BaseExtractor):
    """Parses county recorder mortgage liens, master credit facilities, and cross-collateralized deeds."""

    def __init__(self, model_name: str = "gemini-1.5-pro"):
        super().__init__(task_name="recorder_mortgage_lien_ingestion", model_name=model_name)

    def extract(self, raw_mortgages: List[Dict[str, Any]]) -> List[Mortgage]:
        mortgages: List[Mortgage] = []

        for rec in raw_mortgages:
            raw_text = str(rec)
            sim_prompt = max(len(raw_text) // 4, 60)
            sim_completion = 80
            self.record_tokens(sim_prompt, sim_completion)

            m = Mortgage(
                recording_number=str(rec.get("recording_number", "")).strip(),
                lender_name=str(rec.get("lender_name", "")).strip(),
                borrower_name=str(rec.get("borrower_name", "")).strip(),
                borrower_entity_id=rec.get("borrower_entity_id"),
                principal_amount=float(rec.get("principal_amount", 0.0)),
                recording_date=str(rec.get("recording_date", "")).strip(),
                cross_collateralized_parcels=[str(p).strip() for p in rec.get("cross_collateralized_parcels", [])],
                guarantor_names=[str(g).strip() for g in rec.get("guarantor_names", [])],
                master_credit_facility_name=rec.get("master_credit_facility_name"),
            )
            mortgages.append(m)

        return mortgages
