# 02. Corporate Shell Entity & Slumlord De-anonymizer

> **Social Tokens Project #02**: Directing AI inference tokens toward unmasking corporate shell entities, reconstructing beneficial ownership graphs, and empowering multi-building tenant unions.

---

## 1. The Material Problem

Corporate landlords, predatory syndicates, and private equity platforms deliberately fragment property ownership across dozens or hundreds of discrete, single-property LLCs:

- **Liability Ring-Fencing**: If Building A suffers a catastrophic boiler failure or collapse, the LLC is abandoned or claimed to be insolvent, insulating the parent syndicate's broader balance sheet.
- **Evading Code Enforcement**: Municipal inspectors issue citations to isolated LLCs, hiding systemic patterns of habitability violations across the city.
- **Suppression of Collective Tenant Power**: Renters in Building A typically have no idea that the same landlord owns Building B, C, and D across town. Tenant organizing remains atomized, allowing landlords to pick off single-building disputes one by one.

---

## 2. Where Tokens Go: Computational & Agentic Workflow

Instead of generating commercial copy or chatbot chatter, **tokens in this system perform rigorous public-interest data unmasking**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                           DATA INGESTION                               │
 ├─────────────────┬─────────────────┬──────────────────┬─────────────────┤
 │ Municipal Tax   │ Secretary of    │ Housing Code     │ County Recorder │
 │ Rolls / PINs    │ State Filings   │ Violations       │ Mortgage Deeds  │
 └────────┬────────┴────────┬────────┴─────────┬────────┴────────┬────────┘
          │                 │                  │                 │
          ▼                 ▼                  ▼                 ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      TOKEN ALLOCATION ENGINE                           │
 │                                                                        │
 │  1. Unstructured Document Parsing & Normalization                      │
 │     - Extract PINs, taxpayers, legal entities, governors               │
 │                                                                        │
 │  2. Agentic Entity Resolution & Commercial Agent Stripping             │
 │     - Filter mass commercial registered agent hubs (CT Corp, CSC)      │
 │     - Canonicalize private operating suites & tax mailing addresses    │
 │     - Detect corporate officer crossovers (Governors / Managers)       │
 │                                                                        │
 │  3. Mortgage Cross-Collateralization Linkage                           │
 │     - Extract blanket master credit facilities & personal guarantors   │
 └────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      OWNERSHIP MULTI-GRAPH                             │
 │    [Properties] ──(OWNS)── [Shell LLCs] ──(OFFICER)── [Beneficial UBO] │
 │         │                                                   │          │
 │         └──(CROSS_COLLATERALIZED)── [Master Mortgage] ──────┘          │
 └────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                    TENANT ACTION & STRIKE DOSSIER                      │
 │  - Unmask all sister properties & total residential unit count         │
 │  - Aggregate open habitability violations across entire portfolio      │
 │  - Identify lender debt-service pressure points for rent strikes       │
 └────────────────────────────────────────────────────────────────────────┘
```

### Token Budget & Cost Profile (Sample 5-Property Ingestion Run)
- **Ingestion & Parsing**: ~3,000 prompt tokens
- **Agentic Entity Resolution & Crossover**: ~2,000 prompt tokens, ~1,200 completion tokens
- **Strategic Dossier Synthesis**: ~850 completion tokens
- **Total Expenditure**: **~6,348 Tokens (~$0.016 USD)** to unmask an entire 120-unit corporate syndicate.

---

## 3. Architecture & Code Structure

```
02-corporate-shell-deanonymizer/
├── src/
│   ├── models/
│   │   ├── schema.py        # Pydantic models (Property, ShellEntity, Person, Mortgage, Violation)
│   │   └── graph.py         # NetworkX OwnershipGraph with multi-hop traversal & community clustering
│   ├── extractors/
│   │   ├── base.py          # Token accounting base class
│   │   ├── tax_registry.py  # Municipal assessor roll parser
│   │   ├── sos_filings.py   # Secretary of State corporate registration parser
│   │   ├── code_violations.py # Habitability citations & life-safety parser
│   │   └── mortgage_liens.py # Master credit facility & cross-collateralization parser
│   ├── agents/
│   │   ├── entity_resolver.py   # Address canonicalization & crossover scoring agent
│   │   └── dossier_generator.py # Tactical tenant union strike dossier generator
│   ├── engine/
│   │   └── pipeline.py      # End-to-end orchestrator
│   └── cli.py               # Rich interactive command-line interface
├── data/
│   └── sample_fixtures/     # Realistic municipal records modeled on Hennepin County
├── tests/
│   └── test_deanonymizer.py # Comprehensive pytest test suite
└── web/
    └── index.html           # Standalone interactive force-directed graph dashboard
```

---

## 4. Getting Started

### Installation
```bash
cd 02-corporate-shell-deanonymizer
python -m pip install -r requirements.txt
```

### Run Tests
```bash
python -m pytest
```

### 1. Investigate a Property Address
Unmask the real beneficial owners and find all sister properties across town:
```bash
python -m src.cli investigate --address "1420 11th Ave S"
```

Output:
```text
+--------------------- SLUMLORD DE-ANONYMIZATION REPORT ----------------------+
| TARGET PROPERTY: 1420 11th Ave S (PIN: 26-029-24-12-0045)                   |
| PAPER LLC: 1420 ELEVENTH AVE LLC                                            |
| UNMASKED BENEFICIAL OWNERS: Eleanor Vance, Marcus Vance                     |
| TOTAL KNOWN PORTFOLIO: 4 Properties | 120 Units                             |
| TOTAL OPEN CODE VIOLATIONS: 5                                               |
| MASTER MORTGAGE ENCUMBRANCE: $14,800,000.00 (Arbor Commercial Mortgage LLC) |
+-----------------------------------------------------------------------------+
```

### 2. Scan All Portfolios Across the City
Cluster and rank corporate landlord networks:
```bash
python -m src.cli clusters
```

### 3. Generate a Tactical Tenant Union Action Dossier
Generate a comprehensive markdown dossier for organizers, city council testimony, or press releases:
```bash
python -m src.cli dossier --address "1420 11th Ave S" --output dossier.md
```

### 4. Interactive Web Dashboard
Open `web/index.html` in any web browser to explore the interactive canvas force-directed graph, click through nodes, and copy action dossiers directly.

---

## 5. Strategic Organizer Insights

1. **The Cross-Collateralization Lever**: 
   When multiple buildings are pledged as collateral under a single blanket mortgage, the landlord cannot compartmentalize defaults. Coordinated rent escrow in 2 or 3 buildings disrupts the debt-service coverage ratio (DSCR) required by the lender, forcing the master syndicate to negotiate.
2. **Commercial Registered Agent Filtering**: 
   Naïve graph algorithms link thousands of unrelated LLCs because they all list "CT Corporation" as their registered agent. This system strips commercial registered agent clearinghouses and focuses on:
   - Operating executive officers & governors
   - Private taxpayer mailing addresses & headquarters suites
   - Blanket mortgage notes and personal guarantors
   - Shared emergency maintenance contact numbers on rental licenses.
