# Rural Areas: AI Force-Multiplier Ideas

Rural communities and exurbs like Buffalo, Minnesota face distinct structural technology bottlenecks. Unlike urban cores with dense IT departments, dedicated GIS teams, and specialized consulting pipelines, smaller jurisdictions and agricultural operations deal with limited technical staff, vast physical footprints, fragmented institutional knowledge, and expensive enterprise vendor lock-in.

Large language models with massive context windows ("enough tokens" to ingest entire town codebases, decades of equipment logs, or farm data histories) can act as an asynchronous, zero-headcount force multiplier across several critical areas:

> Sorted best-to-least by what one person can build solo with just an LLM, easiest first. Ideas that are impossible solo (they require institutional access, e.g. hospital EHRs or payer contracts) have been removed.

---

### 1. Agriculture & Equipment Fleet Telemetry

While modern agriculture in Wright County and Greater Minnesota uses high-tech telemetry (RTK GPS, variable-rate planters, yield monitors), small and mid-sized operators face significant data bottlenecks.

* **Legacy Machinery Diagnostics & "Right to Repair":** When equipment breaks in the field, waiting days for a certified technician from a distant dealership is costly. Operators can dump entire 1,500-page legacy service manuals, schematics, and sensor error code dumps into a model to obtain step-by-step diagnostic paths without needing an expensive proprietary portal.
* **Long-Horizon Multi-Season Field Analysis:** Precision ag generates vast amounts of unstructured and semi-structured data: multi-year soil sample lab results, yield maps, rainfall logs, and fertilizer application sheets. An LLM with million-token capacity can ingest a decade of unstructured field logs alongside agronomic literature to synthesize why specific plots consistently underperform or draft custom soil amendment schedules.

---

### 2. Small Business & Regional IT Scarcity

Local businesses—from independent grain elevators and manufacturing job shops to regional trades—rarely have dedicated software engineering or IT staff.

* **On-Demand Domain Triage:** For local accounting, legal, and environmental compliance (e.g., runoff compliance, feedlot permits, local tax incentives), long-token LLMs serve as a tier-1 sanity check, digesting convoluted state statutes and helping business owners prepare specific, high-efficiency questions for paid professionals.
* **Ad-Hoc Systems Integration:** Small rural companies often run on bespoke access databases, legacy ERPs, or paper invoices that don't speak to modern logistics systems. An LLM capable of holding massive codebases and data schemas can generate reliable migration scripts, build automated middleware, or parse non-standard supplier PDFs into structured inventory feeds without requiring custom vendor software.

---

### 3. Municipal Administration & Regulatory Burden

Small local governments operate with lean staff where city administrators, zoning officials, and clerks wear multiple hats. Solo-buildable as tools, but deploying them needs a town willing to adopt them.

* **Massive Municipal Archive & Code Retrieval:** Towns maintain decades of disjointed PDF records—city council minutes, zoning ordinances, easements, and state compliance statutes (e.g., Minnesota Pollution Control Agency or DNR guidelines). An LLM with an expansive context window can digest the entire 40-year town ledger and municipal code to answer complex resident queries instantly (e.g., *"Can I build an accessory dwelling unit or pole barn on parcel X given wetland buffer rules passed in 1998 and amended in 2017?"*).
* **State & Federal Grant Discovery and Drafting:** Small towns frequently miss out on state infrastructure programs (such as Minnesota Border-to-Border broadband or clean water grants) simply because they lack dedicated grant writers. An LLM can ingest 200-page federal Notice of Funding Opportunities (NOFOs), evaluate town master plan documents against the rubric, and generate draft applications.

---

## Solo-Build Paths Around Buffalo, Minnesota

If you want to build high-impact tech independently without dealing with City Hall bureaucracy, city council approval, or RFP red tape, you can target **public data consumers, local small businesses, landholders, and community infrastructure**.

Because Minnesota has strong public records rules and open county-level spatial data, you can build client-side, community-facing tools using publicly accessible datasets and on-device/API-driven LLMs.

---

### 1. The Citizen "Can I Build / Do This?" Planning Bot

Instead of selling software to the city to answer resident questions, you build a public tool that residents, contractors, and prospective homebuyers use before they ever contact the zoning desk.

* **The Problem:** Residents and local deck/shed builders regularly get stuck parsing complex PDF ordinances—setbacks, accessory dwelling unit rules, max impervious surface limits, shoreline buffer rules around Buffalo Lake or Lake Pulaski, and fence height maximums.
* **How to Build It Solo:**
1. Scrape the public Buffalo City Code and [Wright County Planning & Zoning](https://www.wrightcountymn.gov/184/Wright-County-Land-Use-Plan) ordinances (available publicly as text and PDF).
2. Pull public parcel boundaries and zoning classifications from the [Wright County GIS Open Data portal](https://wright-county-gis-wrightgis.hub.arcgis.com/pages/open-data).
3. Load the parcel geometry and town code into a vector database or massive context window. A resident enters their address and asks: *"Can I put a 20x24 detached shop 5 feet off my east property line?"* The LLM cross-references the zoning district, setback rules, and parcel dimensions to give a clear plain-English breakdown of requirements and needed permit forms.

---

### 2. Local Council & School Board Accountability Digest

Small-town civic engagement suffers because local newspapers have consolidated or vanished, leaving 100-page meeting packets largely unread.

* **The Problem:** The City of Buffalo City Council, the Buffalo Township Board, and the Buffalo-Hanover-Montrose (BHM) School District publish monthly meeting packets, audio/video recordings, and approved minutes as public PDFs. Almost nobody has time to read 200 pages of routine expenditures to find the three controversial line items.
* **How to Build It Solo:**
1. Set up an automated scheduled scraper on the [City of Buffalo Agenda Center](https://ci.buffalo.mn.us/AgendaCenter/ViewFile/ArchivedMinutes/_08052024-1652), township sites, and the [BHM School Board portal](https://www.bhmschools.org/school-board-minutes-and-reports).
2. Pipe the entire PDF packet into a long-context model to extract votes, contract awards, tax assessments, zoning variances, and budget anomalies.
3. Publish an automated, hyper-local weekly Substack, RSS feed, or simple dashboard called something like *Buffalo Civic Watch* that breaks down what was actually decided in 3-minute summaries.

---

### 3. Equipment Repair Assistant for Local Farmers & Trades

You do not need city permission to solve one of the biggest headaches for regional independent tradespeople, landscapers, and farmers: troubleshooting specialized machinery.

* **The Problem:** Independent mechanics, local contractors, and farmers frequently work on 15–30 year old skid steers, tractors, hydraulic presses, and HVAC equipment where official dealer service is an hour away or backlogged for weeks.
* **How to Build It Solo:**
1. Ingest scanned technical shop manuals, wiring schematics, and hydraulic diagrams (many are hundreds of pages long and available as public or community PDFs).
2. Build a multimodal diagnostic interface where a local mechanic or operator can upload an error code or an image of an unlabelled hydraulic block and ask: *"What pressure should relief valve B be set to on a 2004 Bobcat T190, and which hose runs to the auxiliary port?"*
3. The model pulls the exact page schematic, translates circuit symbols, and guides the diagnostic procedure step-by-step.

---

### 4. Rural Well, Septic, and Property Dossier Generator

Around Buffalo and nearby townships (Chatham, Buffalo Township, Marysville), many parcels rely on private wells and individual sewage treatment systems (subsurface septic).

* **The Problem:** When buyers evaluate rural properties, finding environmental context—soil percolation quality, Minnesota Department of Health (MDH) Well Index logs, DNR wetland designations, and flood risk—requires digging across four separate state and county databases.
* **How to Build It Solo:**
1. Connect public APIs/dumps: the MDH County Well Index (free public well records/drilling logs), DNR protected waters data, and Wright County parcel records.
2. Ingest the data into a pipeline that generates a comprehensive "Rural Due Diligence Report" for any parcel ID or rural address.
3. Package it into a pay-per-report tool or free community resource for local realtors, home buyers, and rural property owners.

---

### Quick Comparison of Solo Paths

| Project Idea | Core Public Data Source | Target User | Friction to Launch |
| --- | --- | --- | --- |
| **Permit & Zoning Query Tool** | City Code PDF + Wright County GIS | Homeowners, deck/pole-barn builders | Low; zero credentials needed |
| **Civic Packet Summarizer** | AgendaCenter PDFs & meeting minutes | Local residents, local reporters | Low; purely a batch processing script |
| **Machinery Diagnostic Assistant** | Open-source/uploaded equipment service manuals | Farmers, diesel mechanics, landscapers | Medium; needs OCR for older technical diagrams |
| **Parcel Well & Soil Profiler** | MDH Well Index + Wright County GIS | Rural buyers, real estate agents | Medium; requires simple geospatial lookups |

None of these require city IT integration, administrative approval, or data rights negotiations—the data is already public under state transparency laws and open GIS frameworks.

---

### Related Builds

Solo-built transit tools in the same spirit (public feeds, no bureaucracy required):

* [`aminamos/ghost-bus-tracker`](https://github.com/aminamos/ghost-bus-tracker): Automated public transit reliability and ghost bus tracker using GTFS & GTFS-RT feeds.
* [`aminamos/onebusaway-stopinfo`](https://github.com/aminamos/onebusaway-stopinfo): Web app that provides and collects detailed bus stop information to/from riders.

---

## Solo-Build Paths in Hennepin County Western Suburbs (Robbinsdale, New Hope, Plymouth)

Unlike Wright County and Buffalo, these inner-ring and second-ring western suburbs in Hennepin County (Robbinsdale, New Hope, Plymouth) deal with mature housing stock, dense infill redevelopment, strict rental inspection regimens, and rapid commercial turnarounds.

Because Hennepin County maintains one of the cleanest open GIS and property datasets in the state, you can build high-utility, solo products completely client-side without talking to a single municipal official.

---

### 1. Infill & ADU Pre-Check Engine for Homeowners & Contractors

* **The Local Context:** Robbinsdale and New Hope are dense post-war first-ring suburbs full of 1950s ramblers, while Plymouth is a larger second-ring suburb balancing tear-downs with commercial expansion. Residents constantly want to know if they can build detached accessory dwelling units (ADUs), detached garages, dormers, or home additions.
* **The Data:**
* Download the raw parcel dataset from the [Hennepin GIS Open Data Hub](https://gis-hennepin.hub.arcgis.com/) (geometry, lot lines, square footage, building footprint).
* Scrape municipal zoning codes for New Hope, Robbinsdale, and Plymouth (max lot coverage, side/rear setbacks, height caps).
* **The Product:** A standalone web app where a resident or remodeling contractor types in an address. The script grabs the lot geometry from Hennepin GIS and feeds it alongside local zoning constraints into an LLM. The model outputs:
* Maximum allowable building footprint vs. current building coverage.
* Required setbacks for their specific zoning classification (e.g., R-1 vs. R-2).
* Exact city permit checklist with pre-filled dimensions.

---

### 2. Rental Inspection Compliance Auditor

* **The Local Context:** Cities like Robbinsdale and New Hope require mandatory biennial (every two years) or point-of-sale rental license inspections, complete with strict checklists, conversion fees, and re-inspection penalties for deficiencies. Landlords frequently fail initial walk-throughs over nitpicky building maintenance items.
* **The Data:**
* City-specific inspection checklists (e.g., the [Robbinsdale Rental Dwelling License Application & Checklist](https://www.robbinsdalemn.gov/DocumentCenter/View/503/2026-Through-2027-Rental-License-Application-PDF) and New Hope inspection forms).
* **The Product:** A mobile-first photo auditor. A small mom-and-pop landlord or tenant walks through an apartment taking photos of handrails, electrical outlets, egress windows, water heater discharge pipes, and smoke alarms. A multimodal model cross-references the photos directly against city-specific housing code checklists and generates a prioritized remediation punch list before the city housing inspector arrives.

---

### 3. Plymouth Commercial Development & Planning Docket Radar

* **The Local Context:** Plymouth handles a high volume of multi-family, logistics, and retail development applications along Highway 55, I-494, and Northwest Blvd. Surrounding neighborhood associations, commercial real estate brokers, and retail business owners rarely have time to track the city's 300-page Planning Commission packets.
* **The Data:**
* Publicly accessible [City of Plymouth Planning Commission Agenda Packets](https://www.plymouthmn.gov/services/planning) and the city's Development Docket.
* **The Product:** An automated scraper that downloads meeting packets monthly, runs a long-context LLM across the site plans and traffic studies, and produces a spatial alert dashboard. Nearby residents and commercial tenants get pinged: *"A variance request has been submitted 0.4 miles from you for an 80-unit townhome plat and a new drive-thru coffee shop—here is the traffic impact summary and the public hearing date."*

---

### 4. Contractor "Bid Specs to City Code" Sanity Checker

* **The Local Context:** Residential plumbers, electricians, and HVAC contractors working across Hennepin County deal with subtle municipal differences. What passes in Robbinsdale might trigger a citation or revision in Plymouth or Minneapolis.
* **The Data:**
* Supplemental city amendments to the Minnesota State Building, Plumbing, and Mechanical Codes published by each city's building department.
* **The Product:** An asynchronous CLI or web tool for local trades. A contractor pastes in their quote/scope of work (e.g., *"Installing 50-gallon power vent water heater, running 2-inch PVC through rim joist, adding dedicated 15A circuit"*). The LLM checks it against local city permit requirements, fees, and municipal amendments, telling the contractor exactly what extra documentation the local inspector will ask for when they pull the permit.

---

### Comparison of Independent Projects

| Idea | Core Inputs | Target Users | Monetization / Value |
| --- | --- | --- | --- |
| **Lot Infill / ADU Checker** | [Hennepin GIS](https://gis-hennepin.hub.arcgis.com/) + City Zoning Ordinances | Homeowners, deck builders, architects | Free lead-gen for contractors or $10 report |
| **Rental Inspector Prep** | City Housing Codes + Multimodal Vision API | Small landlords, property managers | Monthly subscription ($15–$30/mo) |
| **Plymouth Planning Radar** | [Plymouth Agenda Packets](https://www.plymouthmn.gov/services/planning) | Commercial brokers, neighborhood groups | Sponsored newsletter or local alert fee |
| **Contractor Code Cross-Check** | MN State Code + City municipal supplements | Regional trade contractors | Pro SaaS for independent trade fleets |

Because Hennepin County centralizes property GIS and all three cities publish public code portals and PDF packets, you can pull the raw data programmatically without needing administrative keys or permission.

---

## More Solo Paths: Anoka, Ramsey & Washington Counties

Each of these areas represents a very different geographic profile—from dense urban Ramsey County to exurban lake cabins in Coon Lake (East Bethel), fast-growing northern suburbs like Blaine (Anoka County), and master-planned HOA communities in Woodbury (Washington County).

Because each of these counties publishes open GIS REST feature services and machine-readable public meeting materials, you can build high-value software completely on your own without touching municipal procurement.

### 1. Coon Lake Beach / East Bethel: The Shoreland & Septic "Pre-Purchase" Auditor

* **The Local Bottleneck:** Coon Lake Beach (located in East Bethel/Columbus) consists of dense, small historic cabin lots platted in the mid-1900s that have slowly transitioned into year-round homes. Because it sits within the Minnesota DNR's strict Shoreland Overlay District (within 1,000 feet of ordinary high water), homeowners constantly run into major legal hurdles: non-conforming lot sizes, failing legacy subsurface septic systems (SSTS), and tough impervious surface limits (often capped at 25%).
* **The Public Data:**
  * Property boundaries and tax info from the Anoka County Parcel Viewer and GIS Hub.
  * East Bethel Chapter 78 zoning and DNR Shoreland rules.
  * Minnesota Department of Health (MDH) County Well Index and public septic permit history.
* **What You Can Build Solo:** A "Lake Lot Permitting Feasibility Tool." A buyer or cabin owner drops an address near Coon Lake. The tool pulls parcel dimensions, calculates distance to the lake shoreline, checks the lot size against current non-conforming minimums, and prompts the user with an LLM-generated punch list: "Because your lot is under 20,000 sq ft and within 300 ft of Coon Lake, any footprint expansion requires a Type IV septic variance and a DNR buffer mitigation plan."

### 2. Blaine: Commercial Infill & Highway 65 Development Radar

* **The Local Bottleneck:** Blaine is rapidly expanding along the Highway 65 corridor and around the National Sports Center. It receives hundreds of commercial zoning variance requests, strip-mall outlot builds, and industrial park rezoning applications. Small contractors, delivery hubs, and local business owners struggle to track the 200+ page bi-weekly council and planning packets to know what is being built next door.
* **The Public Data:**
  * City of Blaine Planning Commission and City Council agenda packets (published publicly as PDFs).
  * Anoka County GIS property records.
* **What You Can Build Solo:** A hyper-local commercial radar. You script a crawler to grab Blaine's meeting packets, pipe them into a long-context LLM to extract conditional use permits (CUPs), sign variances, and environmental assessments, and map them. Business owners or commercial tenants subscribe for automated alerts: "New drive-thru variance requested 500 feet from your storefront on Central Ave."

### 3. Ramsey County (St. Paul, Roseville, Maplewood): Lead Water Lines & Rental Housing Compliance

* **The Local Bottleneck:** Ramsey County is dense, historic, and heavily urbanized. Cities like Saint Paul and inner-ring suburbs have aging housing stock (pre-1978 lead risks, clay sewer pipes) and enforce strict tenant-protection and rental licensing ordinances. Landlords and property buyers spend thousands navigating lead abatement rules, truth-in-sale housing reports, and rental certification tiers.
* **The Public Data:**
  * Ramsey County Open GIS Hub, which provides free ArcGIS REST endpoints for Attributed Parcels and building footprints.
  * Public municipal rental license registries, St. Paul SPRWS lead service line lookup maps, and county assessor build years.
* **What You Can Build Solo:** A "Ramsey Property Risk Dossier." Enter any Ramsey County Parcel ID (PID). The tool pulls building age, structure footprints, and municipal inspection history, feeding it through an LLM to generate an investment diligence sheet highlighting lead paint liabilities, point-of-sale inspection mandates, and local tenant notification requirements.

### 4. Woodbury: HOA Restriction & Architectural Review Assistant

* **The Local Bottleneck:** Woodbury is defined by large-scale master-planned unit developments (PUDs) and stringent architectural control committees (ACCs). Homeowners who want to put in solar panels, EV charging circuits, sheds, detached patios, or fences face a two-front battle: the city building department and their private HOA declaration.
* **The Public Data:**
  * Publicly posted City of Woodbury Council and Planning Agenda Packets (which publish complete PUD development agreements and architectural guidelines).
  * Washington County open GIS parcel endpoints.
  * Public Covenants, Conditions, and Restrictions (CC&Rs) filed with county land records.
* **What You Can Build Solo:** A "Woodbury Architectural Submittal Assistant." Homeowners or solar/fence installers upload their proposed project dimensions and material specs. The LLM checks city setback rules against the specific neighborhood's PUD agreement (e.g., Wedgewood, Colby Lake, or Stonemill Farms) and drafts an HOA Architectural Review Board approval packet, highlighting common rejection triggers like fence material restrictions or roofline setbacks.

### Comparison Matrix for Solo Deployment

| Area / Focus | Core Public Datasets | Solo Product Concept | Revenue / Utility Model |
| --- | --- | --- | --- |
| Coon Lake (East Bethel) | Anoka County GIS + DNR Shoreland Codes | Shoreland/Septic Expansion Checker | $15–$25 per parcel buyer report |
| Blaine | AgendaCenter Packets + Anoka GIS | Highway 65 Commercial Build Tracker | Monthly B2B alert subscription |
| Ramsey County | Ramsey Open GIS API + Municipal Housing Code | Rental/Aging Property Risk Auditor | Lead gen for local trades & landlords |
| Woodbury | Woodbury Agenda Center + Neighborhood PUDs | HOA/PUD Architectural Review Drafter | Flat fee per submittal packet |

All four of these target distinct customer pain points that depend entirely on published public data—zero city contracts, vendor certifications, or council approvals required.

---

## Menomonie, WI & Roseville, MN

Both of these locations feature distinct, non-overlapping pressures driven by their demographics and land use: **Menomonie, WI** is an independent college town (UW–Stout) and county seat (Dunn County) navigating student rental tension and rural agricultural buffers. **Roseville, MN** is a dense, fully built-out first-ring suburb situated between Minneapolis and St. Paul with complex commercial corridors (Rosedale/Snelling/County Rd B) and strict multi-tier rental and short-term licensing regimes.

Because both jurisdictions publish machine-readable parcel data, municipal codes, and planning packets, you can build self-contained, high-utility tools targeting landlords, college students, contractors, and local business owners without municipal sign-off.

---

### 1. Menomonie, WI: Student Off-Campus Lease & Habitability Checker

* **The Local Problem:** Menomonie has a high student rental population surrounding the UW–Stout campus. The City recently introduced proactive rental inspections and established designated Neighborhood Stabilization and Enhancement Districts (NSED) south/east of campus, enforcing strict habitability rules, maximum unrelated occupancy caps, fire extinguisher ratings (3A40BC), and egress rules. Under-resourced students and first-time off-campus renters rarely know their rights or whether a unit is compliant.
* **The Public Data:**
* City of Menomonie Municipal Code (Title 9, Chapter 2 - Residential Rental Properties).
* Wisconsin State Statute 66.0104 (Habitability Violations).
* Public parcel boundaries from the Dunn County GIS Viewer and tax roll.
* **What You Can Build Solo:** A client-side web application for UW–Stout students.
1. A student uploads photos of their unit (e.g., basement bedrooms, heating vents, smoke detectors) and enters their address.
2. The tool checks whether the property falls within the NSED #1 boundary and runs multimodal checks against the City's Chapter 9-2 safety standards (e.g., measuring window egress clearance, checking 75-foot extinguisher access, and reviewing lease terms for illegal clauses like prohibited retaliation).
3. The LLM auto-generates a formal 30-day "Cure or File Complaint" letter citing specific City of Menomonie code provisions.

---

### 2. Menomonie, WI: Dunn County Ag/Shoreland Runoff & Buffer Compliance Assistant

* **The Local Problem:** Surrounding the city are Lake Menomin, the Red Cedar River, and sprawling agricultural acreage that drains into impaired waterways. Local farmers and rural property owners regularly run up against Dunn County and Wisconsin DNR non-point source pollution rules, shoreline setback buffers, and manure management restrictions before undertaking site grading or outbuilding construction.
* **The Public Data:**
* Free spatial data via the [Wisconsin DNR Open Data Portal](https://data-wi-dnr.opendata.arcgis.com/) (hydrography, wetlands, surface water impairments).
* Dunn County zoning ordinances and farmland preservation maps.
* **What You Can Build Solo:** An agronomy and parcel due diligence tool. A landowner enters their parcel ID. The tool queries DNR hydrography endpoints to measure distances from protected riverbeds or Lake Menomin, checks soil survey layers, and generates an LLM summary specifying whether an intended project (such as a gravel pad, hoop house, or livestock fence) triggers a DNR permit or falls under standard agricultural exemptions.

---

### 3. Roseville, MN: Short-Term Rental (STR) & Duplex Regulatory Engine

* **The Local Problem:** Roseville enforces Chapter 909 of the City Code, which sets rigid, unusual operational restrictions on short-term rentals: non-owner-occupied properties cannot be rented more often than once every 7 days (Oct 1–May 1) or once every 10 days (May 1–Oct 1), with strict occupancy limits (max 4 unrelated adults). Prospective real estate investors and hosts frequently miscalculate projected returns because they don't account for these mandatory gap periods and licensing conditions.
* **The Public Data:**
* Roseville City Code (Chapter 907 Rental Registration, Chapter 908 Multifamily, and Chapter 909 STRs).
* Free parcel GIS layers via the [Ramsey County Open Data Hub](https://data-ramseygis.opendata.arcgis.com/search?collection=dataset).
* **What You Can Build Solo:** A "Roseville Rental Feasibility Calculator." An investor enters a Roseville property address. The tool verifies parcel zoning, pulls building classification details from Ramsey County tax records, and uses an LLM-guided workflow to model exact regulatory constraints (maximum calendar booking windows, registration fees, and license tiering requirements), telling the buyer whether the property is legally viable as an STR or mid-term rental.

---

### 4. Roseville, MN: Commercial Corridor Redevelopment & Variance Monitor

* **The Local Problem:** Roseville has very little undeveloped raw land. Most economic activity consists of tear-downs, strip mall retrofits, and high-density redevelopments along Snelling Avenue, Highway 36, and the Rosedale Center perimeter. Surrounding commercial tenants, small office leaseholders, and neighborhood groups struggle to track large-scale conditional use permits (CUPs) and zoning variances that alter local traffic, parking minimums, and signage allowances.
* **The Public Data:**
* [City of Roseville Planning Commission Agendas and Minutes](http://www.ci.roseville.mn.us/77/Planning) (published regularly as comprehensive PDF packets).
* City of Roseville GIS maps and Ramsey County parcel datasets.
* **What You Can Build Solo:** A commercial planning intelligence feed. A scheduled cron job scrapes the Planning Commission agendas, extracts all proposed rezoning petitions, traffic impact assessments, and sign variances, and runs a spatial lookup against nearby business addresses. You package this as an automated monthly brief for commercial real estate brokers and local business operators who need early warning on corridor shifts.

---

### Implementation Snapshot

| Project | Location | Target End User | Key Data Dependency |
| --- | --- | --- | --- |
| **Off-Campus Tenant Audit** | Menomonie, WI | UW–Stout students, student landlords | AmLegal City Code 9-2 + Dunn County GIS |
| **Watershed & Ag Buffer Tool** | Menomonie / Dunn County | Rural landholders, excavators | [WI DNR Open Data](https://data-wi-dnr.opendata.arcgis.com/) + County GIS |
| **Roseville STR/Rental Checker** | Roseville, MN | Real estate buyers, hosts, landlords | Roseville City Code Ch. 907–909 + Ramsey GIS |
| **Retail Corridor Planning Alert** | Roseville, MN | CRE brokers, shop owners, neighborhood orgs | [Roseville Planning Agendas](http://www.ci.roseville.mn.us/77/Planning) + PDF parser |

All four solutions leverage unauthenticated public records, public APIs, and static city codes—allowing you to deploy fully functional tools without needing municipal partnerships or administrative credentials.
