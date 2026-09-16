#!/usr/bin/env python3
"""Generate one R2-hosted case-file PDF per registry record.

Reads the /export.csv dataset, skips cases covered by AG report excerpt
pages, and writes docs/<CASE_ID>.pdf — the file the worker serves at
/docs/<CASE_ID>.pdf from the landlord-directory-data R2 bucket.

Run from the worker dir with the project env:
    source .venv/bin/activate
    python scripts/generate-case-pdfs.py /tmp/allexport.csv
"""
import csv
import os
import sys
from datetime import date

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

WORKER_ORIGIN = "https://twin-cities-wage-theft-worker.a-8c6.workers.dev"

# Long agency reports: link the excerpt page, not a generated case file.
EXCERPT_CASES = {
    "STEARNS-CV-24-0012": "mn-ag-2025-labor-report-p5.pdf",
    "MNAG-PMC-2023": "mn-ag-2024-labor-report-p6.pdf",
    "MNAG-SPG-2024": "mn-ag-2024-labor-report-p6.pdf",
}

VERIFIED_NOTE = (
    "VERIFIED PUBLIC ENFORCEMENT ACTION: Confirmed civil court consent decree "
    "or official state AG/DLI enforcement filing."
)
SEED_NOTE = (
    "PROTOTYPE SEED / PENDING FOIA SYNC: Demonstration case fixture modeled on "
    "documented industry practices under Minn. Stat. 177.24, pending automated "
    "bulk FOIA sync."
)


def money(v: str) -> str:
    try:
        return f"${float(v or 0):,.2f}"
    except ValueError:
        return "$0.00"


def draw_case(path: str, r: dict) -> None:
    c = canvas.Canvas(path, pagesize=letter)
    w, h = letter
    y = h - 0.75 * inch

    c.setFont("Helvetica-Bold", 13)
    c.drawString(0.75 * inch, y, "Twin Cities Wage Theft & Labor Standards Registry")
    y -= 0.28 * inch
    c.setFont("Helvetica", 10)
    c.drawString(0.75 * inch, y, "Registry case file — served from R2")
    y -= 0.35 * inch

    is_verified = (r.get("Data Provenance") or "") == "VERIFIED_PUBLIC_ACTION"
    badge = "VERIFIED PUBLIC ENFORCEMENT ACTION" if is_verified else "PROTOTYPE SEED / PENDING FOIA SYNC"
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.75 * inch, y, badge)
    y -= 0.3 * inch

    name = r.get("Employer Legal Name") or "Unknown Entity"
    trade = r.get("Trade Name") or "N/A"
    c.setFont("Helvetica-Bold", 12)
    c.drawString(0.75 * inch, y, f"{name} (d/b/a {trade})"[:100])
    y -= 0.35 * inch

    fields = [
        ("Case ID / Docket", r.get("Case ID", "N/A")),
        ("Enforcement Agency", r.get("Agency", "N/A")),
        ("Location", f"{r.get('Address','')}, {r.get('City','')}, {r.get('State','')} {r.get('Zip','')}".strip(" ,")),
        ("Industry Sector", r.get("Industry", "N/A")),
        ("Violation Category", r.get("Violation Type", "N/A")),
        ("Status", f"{r.get('Status','')} {'[REPEAT OFFENDER]' if r.get('Repeat Violator') == 'YES' else ''}".strip()),
        ("Findings Date", r.get("Findings Date", "N/A")),
        ("Back Wages Recovered", money(r.get("Back Wages ($)", "0"))),
        ("Civil Money Penalties", money(r.get("Civil Penalties ($)", "0"))),
        ("Settlement Amount", money(r.get("Settlement Amount ($)", "0"))),
        ("Affected Workforce", f"{r.get('Workers Affected','0')} workers"),
    ]
    c.setFont("Helvetica", 10)
    for label, val in fields:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(0.75 * inch, y, f"{label}:")
        c.setFont("Helvetica", 10)
        c.drawString(2.6 * inch, y, str(val)[:90])
        y -= 0.24 * inch

    y -= 0.1 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.75 * inch, y, "Official Findings Summary:")
    y -= 0.24 * inch
    c.setFont("Helvetica", 10)
    desc = r.get("Description") or "Confirmed civil/administrative wage theft findings."
    line = ""
    for word in desc.split():
        if len(line) + len(word) > 95:
            c.drawString(0.75 * inch, y, line)
            y -= 0.22 * inch
            line = word
        else:
            line = f"{line} {word}".strip()
    if line:
        c.drawString(0.75 * inch, y, line)
        y -= 0.34 * inch

    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.75 * inch, y, "Data Provenance:")
    y -= 0.24 * inch
    c.setFont("Helvetica", 9)
    note = VERIFIED_NOTE if is_verified else SEED_NOTE
    line = ""
    for word in note.split():
        if len(line) + len(word) > 100:
            c.drawString(0.75 * inch, y, line)
            y -= 0.2 * inch
            line = word
        else:
            line = f"{line} {word}".strip()
    if line:
        c.drawString(0.75 * inch, y, line)
        y -= 0.4 * inch

    c.setFont("Helvetica", 8)
    c.drawString(0.75 * inch, 0.6 * inch,
                 f"{WORKER_ORIGIN}  |  Generated {date.today().isoformat()} from the registry database record.")
    c.showPage()
    c.save()


def main() -> int:
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/allexport.csv"
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    docs = os.path.join(here, "docs")
    os.makedirs(docs, exist_ok=True)
    made, skipped = 0, 0
    with open(csv_path, newline="") as f:
        for r in csv.DictReader(f):
            cid = (r.get("Case ID") or "").strip()
            if not cid or cid in EXCERPT_CASES:
                skipped += 1
                continue
            draw_case(os.path.join(docs, f"{cid}.pdf"), r)
            made += 1
    print(f"wrote {made} case PDFs, skipped {skipped} excerpt-covered cases")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
