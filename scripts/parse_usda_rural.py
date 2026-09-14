"""Parse the USDA ERS Minnesota rural-definitions PDF and build the county list.

The PDF (data/ERS_MN_rural.pdf) is a map/methods document, NOT a data table:
  - pages 1-5: MN maps shaded under different rural definitions
  - pages 6-9: national/state indicator tables (no county rows)
  - pages 10-15: methods documentation

The operative county-level rule is on page 3:
    Rural = Nonmetro county / Urban = OMB metro county.

So this script:
  1. Verifies the PDF parses and records the definition as provenance.
  2. Extracts map-label county names (audit trail only -- labels also cover
     neighboring states, so they are NOT the county list).
  3. Loads the OMB metro county list for MN from data/omb_metro_mn.json
     (researched separately from official OMB bulletins; see that file's
     `sources` for provenance) and emits the rural (= nonmetro) county list.

Usage:
    source .venv/bin/activate
    python scripts/parse_usda_rural.py

Outputs:
    data/usda_rural_definition.json  (provenance + definition text)
    data/mn_rural_counties.json      (rural county list for the sweep script)
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "data" / "ERS_MN_rural.pdf"
OMB_PATH = ROOT / "data" / "omb_metro_mn.json"
DEF_OUT = ROOT / "data" / "usda_rural_definition.json"
COUNTIES_OUT = ROOT / "data" / "mn_rural_counties.json"

# MN has exactly 87 counties; sanity bound for the audit extraction.
MN_COUNTY_TOTAL = 87


def extract_pages(pdf_path: Path) -> list[str]:
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    return [page.extract_text() or "" for page in reader.pages]


def find_definition_text(pages: list[str]) -> dict:
    """Locate the OMB metro/nonmetro rule (expected on page 3)."""
    for i, text in enumerate(pages):
        if "Rural: Nonmetro county" in text and "Urban: OMB metro county" in text:
            return {"page": i + 1, "rural": "Nonmetro county", "urban": "OMB metro county"}
    raise ValueError("OMB metro/nonmetro definition not found in PDF text")


def extract_map_labels(pages: list[str]) -> list[str]:
    """Pull map-label county names from the map pages (audit trail only)."""
    labels: list[str] = []
    seen: set[str] = set()
    for text in pages[:5]:  # map pages only
        for line in text.splitlines():
            line = line.strip()
            if not line or len(line) > 30:
                continue
            if re.search(r"[0-9:>=]", line):
                continue
            if any(k in line for k in ("Rural", "Urban", "definition", "Census", "information", "Minnesota", "documentation", "three", "Three")):
                continue
            # Split labels the PDF renderer glued together: "BeckerCass",
            # "FillmoreMower", "OlmstedMoody" (camel-case joins, no space).
            parts = re.findall(r"[A-Z][a-z'’]*(?: [a-z][a-z'’]*| [A-Z][a-z'’]*)*", line)
            for part in parts:
                part = " ".join(part.split())
                # Re-split interior glues like "Lac qui Parle Chippewa"
                # (kept as-is; audit only, not the county list).
                if part and part not in seen:
                    seen.add(part)
                    labels.append(part)
    return labels


def main() -> int:
    if not PDF_PATH.exists():
        print(f"missing source PDF: {PDF_PATH}", file=sys.stderr)
        return 1
    if not OMB_PATH.exists():
        print(
            f"missing OMB metro list: {OMB_PATH}\n"
            "Create it from official OMB delineation bulletins with fields:\n"
            '  {"vintage": "...", "sources": [...], "metro_counties": [...]}',
            file=sys.stderr,
        )
        return 1

    pages = extract_pages(PDF_PATH)
    definition = find_definition_text(pages)
    labels = extract_map_labels(pages)

    omb = json.loads(OMB_PATH.read_text(encoding="utf-8"))
    metro = sorted(set(omb["metro_counties"]))

    DEF_OUT.write_text(
        json.dumps(
            {
                "source_pdf": str(PDF_PATH.relative_to(ROOT)),
                "pages": len(pages),
                "county_definition": definition,
                "map_label_audit_count": len(labels),
                "map_labels_sample": labels[:20],
                "note": (
                    "Map labels span MN + neighboring states and carry no "
                    "metro/nonmetro values; they are an audit trail only. "
                    "The county list below derives from the OMB file."
                ),
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    # Rural = every MN county not classified OMB metro. The OMB file must
    # enumerate all 87 MN counties across metro + nonmetro for this to close.
    nonmetro = sorted(set(omb.get("nonmetro_counties", [])))
    if len(metro) + len(nonmetro) != MN_COUNTY_TOTAL:
        print(
            f"warning: metro ({len(metro)}) + nonmetro ({len(nonmetro)}) != "
            f"{MN_COUNTY_TOTAL}; check {OMB_PATH}",
            file=sys.stderr,
        )
    overlap = set(metro) & set(nonmetro)
    if overlap:
        print(f"error: counties in both lists: {sorted(overlap)}", file=sys.stderr)
        return 1

    COUNTIES_OUT.write_text(
        json.dumps(
            {
                "definition": "nonmetro county (USDA ERS MN rural definitions PDF, p.3)",
                "omb_vintage": omb.get("vintage"),
                "omb_sources": omb.get("sources", []),
                "rural_county_count": len(nonmetro),
                "rural_counties": nonmetro,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"definition -> {DEF_OUT.relative_to(ROOT)}")
    print(f"{len(nonmetro)} rural counties -> {COUNTIES_OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
