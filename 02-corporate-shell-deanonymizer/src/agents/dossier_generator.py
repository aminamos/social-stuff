from __future__ import annotations

from typing import Dict, Any, List
from ..models.schema import TokenUsageReport


class DossierGeneratorAgent:
    """Agent that synthesizes unmasked ownership graphs, code citations, and mortgage debt

    into tactical Tenant Union Dossiers and Citywide Strike Target Reports.
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
            task_name="agent_tenant_union_dossier_synthesis",
            prompt_tokens=self.prompt_tokens,
            completion_tokens=self.completion_tokens,
            total_tokens=self.prompt_tokens + self.completion_tokens,
            estimated_cost_usd=round(cost, 6),
        )

    def generate_dossier(self, investigation_result: Dict[str, Any]) -> str:
        """Generates a comprehensive Markdown campaign dossier from an investigation result."""
        # Record tokens for generating the strategic document
        input_len = len(str(investigation_result))
        prompt_toks = max(input_len // 4, 300)
        completion_toks = 850
        self.record_tokens(prompt_toks, completion_toks)

        origin = investigation_result.get("origin_property", {})
        sisters = investigation_result.get("sister_properties", [])
        entities = investigation_result.get("shell_entities", [])
        principals = investigation_result.get("controlling_principals", [])
        lenders = investigation_result.get("primary_lenders", [])
        total_units = investigation_result.get("total_portfolio_units", 0)
        total_props = investigation_result.get("total_portfolio_properties", 1)
        total_violations = investigation_result.get("total_open_violations", 0)
        total_debt = investigation_result.get("total_mortgage_debt", 0.0)
        paths = investigation_result.get("explanation_paths", [])

        principal_names = [p.get("full_name") for p in principals] if principals else ["Undisclosed Principals"]
        principal_display = ", ".join(principal_names)

        lines = [
            "# TENANT UNION ACTION DOSSIER & SLUMLORD UNMASKING REPORT",
            "**Classification: PUBLIC RECORD / CIVIC ORGANIZING INVESTIGATION**",
            "",
            "---",
            "",
            "## 1. Executive Summary: The Real Owner Behind the Shells",
            "",
            f"- **Target Property**: `{origin.get('address')}` (Parcel PIN: `{origin.get('parcel_id')}`)",
            f"- **Nominal Paper Owner**: `{origin.get('owner_of_record')}`",
            f"- **Unmasked Beneficial Owner(s)**: **{principal_display}**",
            f"- **Aggregate Portfolio Size**: **{total_props} Properties** across the city (**{total_units} Total Residential Units**)",
            f"- **Aggregate Open Code Violations**: **{total_violations} Citations** (habitability, structural, safety)",
            f"- **Estimated Master Debt Encumbrance**: **${total_debt:,.2f}** (Cross-collateralized)",
            f"- **Primary Financial Backers**: {', '.join(lenders) if lenders else 'Private Note Holders'}",
            "",
            "---",
            "",
            "## 2. Unmasked Sister Properties (Tenant Union Organizing Network)",
            "",
            "Tenants in these buildings are subject to the same central ownership and property management:",
            "",
            "| Property Address | PIN / Parcel | Units | Assessed Value | Legal Shell Entity |",
            "| :--- | :--- | :--- | :--- | :--- |",
            f"| **{origin.get('address')}** *(Target)* | `{origin.get('parcel_id')}` | {origin.get('unit_count')} | ${origin.get('assessed_value', 0):,.0f} | `{origin.get('owner_of_record')}` |",
        ]

        for s in sisters:
            lines.append(
                f"| {s.get('address')} | `{s.get('parcel_id')}` | {s.get('unit_count')} | ${s.get('assessed_value', 0):,.0f} | `{s.get('owner_of_record')}` |"
            )

        lines.extend([
            "",
            "---",
            "",
            "## 3. The Shell Company Architecture",
            "",
            "Corporate landlords fragment ownership into single-purpose LLCs to evade joint liability and isolate tenant rent strikes. Below is the operational network of corporate vehicles:",
            "",
        ])

        for ent in entities:
            lines.append(f"### `{ent.get('legal_name')}`")
            lines.append(f"- **State & Status**: {ent.get('state_of_formation')} ({ent.get('status')})")
            lines.append(f"- **Registered Agent**: {ent.get('registered_agent_name') or 'N/A'} — `{ent.get('registered_agent_address') or 'N/A'}`")
            lines.append(f"- **Principal Office**: `{ent.get('principal_office_address') or 'N/A'}`")
            lines.append(f"- **Identified Governors/Managers**: {', '.join(ent.get('known_governors') + ent.get('known_managers')) or 'None Listed'}")
            lines.append("")

        lines.extend([
            "---",
            "",
            "## 4. Financial Pressure Points & Master Mortgage Leverage",
            "",
            f"The identified properties are not financially isolated. They are bound together by **master credit facilities and cross-collateralized commercial mortgages totaling ${total_debt:,.2f}**.",
            "",
            "### Vulnerability Analysis:",
            f"1. **Debt Service Dependency**: A master mortgage requires prompt monthly debt service across all pledged properties. A coordinated rent withholding campaign across just **2 to 3 key sister buildings** creates immediate cash-flow default pressure on the entire syndicate.",
            "2. **Lender Covenants**: Commercial loan agreements frequently contain habitability and regulatory compliance covenants. Notifying the primary lenders of chronic uncured code violations and municipal license revocation threats places the borrower in technical default under their mortgage deeds.",
            "",
            "---",
            "",
            "## 5. De-anonymization Evidence Chains",
            "",
            "How this ownership graph was reconstructed through public records crossover:",
            "",
        ])

        if paths:
            for p in paths:
                lines.append(f"#### Link to `{p['target_address']}`:")
                for step in p["steps"]:
                    lines.append(f"- {step}")
                lines.append("")
        else:
            lines.append("- Matched via shared taxpayer mailing addresses and registered officers on corporate filings.")
            lines.append("")

        lines.extend([
            "---",
            "",
            "## 6. Coordinated Tenant Action Recommendations",
            "",
            "1. **Multi-Building Outreach**: Deploy canvassers with this dossier to every sister property identified above. Knock doors and unite tenants around shared repair grievances.",
            "2. **Escrow Rent Withholding**: Establish a joint rent escrow account across buildings. Under statutory rent escrow provisions, withhold rent collectively until life-safety code violations are remediated.",
            "3. **Joint City Council & Inspection Demand**: File a consolidated petition with the Department of Regulatory Services demanding portfolio-wide inspection audits, rather than treating each building as an isolated one-off landlord.",
            "4. **Lender Notification Campaign**: Send formal certified notices of hazardous housing code violations to the master mortgage servicers and trustees.",
            "",
            "*Generated by Social Tokens Project #2: Corporate Shell Entity & Slumlord De-anonymizer*",
        ])

        return "\n".join(lines)
