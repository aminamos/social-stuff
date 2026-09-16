#!/usr/bin/env python3
"""Extract Michigan property-tax tables from Treasury PDFs into data/*.json.

Requires: pip install -r requirements.txt (pypdf).

Inputs (download to ../reference/ first — URLs in ../reference/SOURCES.md):
  mi-2024-ad-valorem-levy-report.pdf   -> county TV, levies, avg rates; statewide series
  mi-stc-annual-report-2024.pdf        -> county SEV by class (Appendix 3)

Outputs: data/county_2024.json, data/state_series.json
Verified: county SEV sums reproduce the official statewide total exactly
($679,173,427,952), TV reproduces the levy-report county sum ($481,508,518,562).

NOTE: data/class_values.json is NOT generated here. It was transcribed from
STC 2024 Annual Report Appendix 4 (class-level SEV/TV) plus the STC 2025 Annual
Report for the 2025 rows. Cross-checks: 2024 class SEV sums to the county SEV
total exactly ($679,173,427,952); county residential-SEV sums to the class
residential SEV exactly ($497,228,918,165). Class TV sums to $481,424,104,647,
~$84M (0.02%) under the levy-report county TV sum — different table vintage.
"""
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "data"


def parse_county_tv(pdf: Path) -> dict:
    r = PdfReader(str(pdf))
    rows = {}
    for i in (4, 5):
        for line in (r.pages[i].extract_text() or "").split("\n"):
            m = re.match(
                r"\s*([A-Za-z][A-Za-z .'-]+?)\s+([\d,]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)\s+([\d.]+)\s*$",
                line,
            )
            if m and m.group(1).strip() != "STATE TOTALS":
                rows[m.group(1).strip()] = {
                    "tv": int(m.group(2).replace(",", "")),
                    "total_tax": float(m.group(5).replace(",", "")),
                    "avg_rate": float(m.group(6)),
                }
    assert len(rows) == 83, len(rows)
    return rows


def parse_county_sev(pdf: Path) -> dict:
    r = PdfReader(str(pdf))
    rows = {}
    for i in (13, 14, 15):  # Appendix 3
        for line in (r.pages[i].extract_text() or "").split("\n"):
            line = line.strip().replace("$", " ").replace("N/C", " 0 ")
            m = re.match(r"^([A-Za-z][A-Za-z .'-]+?)\s+([\d,\s]+)$", line)
            if not m:
                continue
            name = m.group(1).strip()
            nums = [
                int(n.replace(",", "").replace(" ", ""))
                for n in re.findall(r"([\d,]+)", m.group(2))
                if n.replace(",", "").replace(" ", "").isdigit()
            ]
            if name == "Grand Total":
                assert nums[-1] == 679_173_427_952
                continue
            if name.lower() != "county" and len(nums) >= 8:
                rows[name] = {"sev_res": nums[3], "sev": nums[-1]}
    assert len(rows) == 83, len(rows)
    return rows


def parse_series(pdf: Path) -> list:
    r = PdfReader(str(pdf))
    out = []
    for line in (r.pages[3].extract_text() or "").split("\n"):
        m = re.match(
            r"\s*(20\d\d)\s+([\d,]+)\s+(-?[\d.]+)%\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)",
            line,
        )
        if m:
            sev, tv = int(m.group(9).replace(",", "")), int(m.group(10).replace(",", ""))
            out.append({
                "year": int(m.group(1)), "levy": int(m.group(2).replace(",", "")),
                "avg_rate": float(m.group(4)), "homestead_rate": float(m.group(5)),
                "nonhomestead_rate": float(m.group(6)),
                "sev": sev, "tv": tv, "gap": sev - tv,
            })
    return out


def pdf_path(name: str) -> Path:
    ref = HERE.parent / "reference" / name
    if ref.exists():
        return ref
    local = HERE / name
    if local.exists():
        return local
    raise SystemExit(f"missing {name}: download it to reference/ first (see ../reference/SOURCES.md)")


def main() -> None:
    levy_pdf = pdf_path("mi-2024-ad-valorem-levy-report.pdf")
    stc_pdf = pdf_path("mi-stc-annual-report-2024.pdf")
    tv, sev = parse_county_tv(levy_pdf), parse_county_sev(stc_pdf)
    counties = []
    for name in sorted(sev):
        c = tv[name]
        gap = sev[name]["sev"] - c["tv"]
        counties.append({
            "county": name, "tv": c["tv"], "sev": sev[name]["sev"],
            "sev_res": sev[name]["sev_res"], "gap": gap,
            "total_tax": round(c["total_tax"], 2), "avg_rate": c["avg_rate"],
            "uncap_uplift": round(gap * c["avg_rate"] / 1000.0, 0),
        })
    OUT.mkdir(exist_ok=True)
    (OUT / "county_2024.json").write_text(json.dumps(counties, indent=1))
    (OUT / "state_series.json").write_text(json.dumps(parse_series(levy_pdf), indent=1))
    print(f"wrote {len(counties)} counties; "
          f"SEV sum {sum(c['sev'] for c in counties):,}; "
          f"TV sum {sum(c['tv'] for c in counties):,}")


if __name__ == "__main__":
    sys.exit(main())
