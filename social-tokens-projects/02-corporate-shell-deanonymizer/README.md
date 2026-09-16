# 02. Corporate Shell Entity & Slumlord De-anonymizer

> **Social Tokens Project #02**: Directing AI inference tokens toward unmasking corporate shell entities, reconstructing beneficial ownership graphs, and empowering multi-building tenant unions.

---

## Live Sites

* **[Landlord De-anonymizer](https://mpls-rental-sync-worker.a-8c6.workers.dev)** — ownership graphs for Twin Cities rental properties, reconstructing corporate landlord networks from tax rolls, SOS filings, violations, and mortgage deeds.
* **[Wage Theft & Labor Standards Registry](https://twin-cities-wage-theft-worker.a-8c6.workers.dev)** — searchable registry of wage theft and labor standards violations across the Twin Cities.
* **[Slumlord & Wage Theft Crossover Matrix](https://twin-cities-slumlord-labor-matrix.a-8c6.workers.dev)** — the matrix/sync layer for both registries: cross-index of corporate syndicates cited for both slumlord code violations and wage theft, with a crossover API and in-browser AI assistant.
* **[Housing & Labor Unified Registry](https://national-housing-labor-registry.a-8c6.workers.dev)** — the national, non-MN-specific site: generic Socrata/ArcGIS/Carto platform adapters scrape rental-registry and violation feeds from cities across the country (NYC, Seattle, Philadelphia, Detroit, Austin, San Francisco, Denver, Nashville, Cincinnati, Buffalo, + Twin Cities; Milwaukee, Pittsburgh, and NJ via ingest scripts) into the same D1 (`social-housing-db`) + R2 (`landlord-directory-data`) store as the three registries above. Adding a city = one adapter file. Unified city browser, `/api/*` endpoints, and the dual-offender crossover join.

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

Worker ingest tests (Vitest, with Allure results in `cloudflare/allure-results/`):
```bash
cd cloudflare && npm install && npm test
```

### 1. Live Municipal Open Data Search (Real-time City of Minneapolis)
Query the City of Minneapolis Open Data FeatureServer directly to de-anonymize real corporate landlord portfolios:
```bash
python -m src.cli live-search --query "Fitterer"
```

Output:
```text
Connecting to Live City of Minneapolis Open Data FeatureServer...
+--------------------- Live Municipal Open Data Results ----------------------+
| Query: Fitterer                                                             |
| Properties Found: 22                                                        |
| Total Residential Units: 970                                                |
+-----------------------------------------------------------------------------+
                  Live Unmasked Rental Properties (Fitterer)                   
+-----------------------------------------------------------------------------+
| Property Address    | APN / Parcel  | Units | Owner of Record  | Tier       |
|---------------------+---------------+-------+------------------+------------|
| 2310 ALDRICH AVE S  | 3302924110... |    28 | Brian Fitterer   | Tier 1     |
| 2119 PILLSBURY AVE  | 3402924210... |    49 | Brian Fitterer   | Tier 3     |
| 2221 BLAISDELL AVE  | 3402924210... |    29 | BLAISDELL LLC    | Tier 2     |
| 2215 BLAISDELL AVE  | 3402924210... |    23 | BLAISDELL LLC    | Tier 2     |
| 2312 BLAISDELL AVE  | 3402924210... |    26 | BLAISDELL LLC    | Tier 3     |
| 2820 BLAISDELL AVE  | 3402924340... |    24 | GREENWAY LLC     | Tier 3     |
| 1117 MARQUETTE AVE  | 2702924130... |   234 | Bolero Flats LLC | Tier 2     |
+-----------------------------------------------------------------------------+
```
*Discovered: 22 properties and 970 units fragmented across disparate LLCs (`BLAISDELL PORTFOLIO LLC`, `GREENWAY APARTMENTS LLC`, `Bolero Flats Apartments LLC`), linked by applicant manager emails (`blaisdell@ipgliving.com`) and Tier 3 habitability citations.*

### 2. Investigate a Property Address (Graph Crossover & Traversal)
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

### 4. Citywide Registry Sync & Ranking (All 23,303 Properties)
Sync the complete public database of every active rental property in Minneapolis to local SQLite in ~11 seconds:
```bash
python -m src.cli sync-all-licenses
```

Rank the largest multi-building corporate landlord syndicates in Minneapolis by unit count:
```bash
python -m src.cli top-syndicates --limit 10
```

### 5. Cloudflare R2 & D1 Pipeline (Zero-Cost Serverless Housing Registry)
Export the entire active rental registry for Cloudflare R2 object storage and Cloudflare D1 serverless SQL:

```bash
# 1. Export compressed JSON snapshot for Cloudflare R2 (1.64 MB)
python -m src.cli export-r2 --output data/minneapolis_rental_licenses_snapshot.json.gz

# 2. Generate Cloudflare D1 batch SQL seed script
python -m src.cli generate-d1-seed --output data/d1_seed.sql

# 3. Deploy seed to remote Cloudflare D1 database
npx wrangler d1 execute mpls-housing-db --file=data/d1_seed.sql --remote
```

### 6. Automated Cloudflare Edge Worker
A turnkey Cloudflare Worker is provided in [`cloudflare/`](file:///E:/Development/social-tokens-projects/02-corporate-shell-deanonymizer/cloudflare):
- **Polite Rate Limiting**: Batches in chunks of 2,000 records with a 350ms delay between calls, completing the full crawl in ~5 seconds without stressing municipal servers.
- **Daily Cron Schedule**: Runs at 4:00 AM UTC (`0 4 * * *`), updates D1, and archives a compressed snapshot to R2.
- **Costs**: **$0.00 / month** (1.64 MB R2 storage vs 10 GB free quota; 23k write rows vs 100k free/day quota).

### 7. Interactive Web Dashboard
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
