from __future__ import annotations

from typing import List, Dict, Any
from .base import BaseExtractor
from ..models.schema import CodeViolation, ViolationSeverity


class CodeViolationsExtractor(BaseExtractor):
    """Parses municipal housing inspection records, habitability citations, and emergency repair orders."""

    def __init__(self, model_name: str = "gemini-1.5-pro"):
        super().__init__(task_name="housing_code_violations_ingestion", model_name=model_name)

    def extract(self, raw_violations: List[Dict[str, Any]]) -> List[CodeViolation]:
        violations: List[CodeViolation] = []

        for rec in raw_violations:
            raw_text = str(rec)
            sim_prompt = max(len(raw_text) // 4, 40)
            sim_completion = 50
            self.record_tokens(sim_prompt, sim_completion)

            sev_str = str(rec.get("severity", "MEDIUM")).upper()
            try:
                severity = ViolationSeverity(sev_str)
            except ValueError:
                # Infer severity from description keywords
                desc = str(rec.get("description", "")).lower()
                if any(w in desc for w in ["heat", "boiler", "no hot water", "lead", "collapsed", "carbon monoxide", "gas leak"]):
                    severity = ViolationSeverity.CRITICAL_LIFE_SAFETY
                elif any(w in desc for w in ["mold", "infestation", "sewage", "fire door"]):
                    severity = ViolationSeverity.HIGH
                else:
                    severity = ViolationSeverity.MEDIUM

            viol = CodeViolation(
                violation_id=str(rec.get("violation_id", "")).strip(),
                parcel_id=str(rec.get("parcel_id", "")).strip(),
                property_address=str(rec.get("property_address", "")).strip(),
                citation_date=str(rec.get("citation_date", "")).strip(),
                category=str(rec.get("category", "General Housing Maintenance")).strip(),
                description=str(rec.get("description", "")).strip(),
                severity=severity,
                status=str(rec.get("status", "OPEN")).strip(),
                fine_amount=float(rec.get("fine_amount", 0.0)),
            )
            violations.append(viol)

        return violations
