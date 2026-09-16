# Civic Tech & Social Impact Open Source Directory

A curated, field-verified roadmap of civic tech groups, non-profits, public data agencies, and community initiatives across **Minnesota (Twin Cities)**, **Seattle**, **New York City**, **SF Bay Area**, **Chicago**, and **Oakland**.

Every organization listed here has been audited for **active maintenance pipelines in 2025–2026** so your pull requests won't sit unreviewed on abandoned forks.

This repo is also where I show how I use AI to help civic tech and social causes — any civic or social cause, across the political spectrum. This work is nonpartisan: if you want help navigating pesky government regulations, or lowering your taxes legally, I'll help.

> **[Read the Complete Executive Summary & Master Roadmap (EXECUTIVE_SUMMARY.md)](EXECUTIVE_SUMMARY.md)** for the full analysis, maintenance gap audit, ranked quick-win action plan, and CDP expansion strategy.

---

## Live Sites

* **[Social Housing Info](https://social-housing-info.a-8c6.workers.dev/)** — public information resource on rent stabilization definitions, the NYC rent freeze, block-by-block housing development, community land trusts, and further reading.
* **[Landlord De-anonymizer](https://mpls-rental-sync-worker.a-8c6.workers.dev)** — ownership graphs for Twin Cities rental properties, reconstructing corporate landlord networks from tax rolls, SOS filings, violations, and mortgage deeds.
* **[Wage Theft & Labor Standards Registry](https://twin-cities-wage-theft-worker.a-8c6.workers.dev)** — searchable registry of wage theft and labor standards violations across the Twin Cities.
* **[Slumlord & Wage Theft Crossover Matrix](https://twin-cities-slumlord-labor-matrix.a-8c6.workers.dev)** — the matrix/sync layer for both registries: cross-index of corporate syndicates cited for both slumlord code violations and wage theft, with a crossover API and in-browser AI assistant.
* **[Housing & Labor Unified Registry](https://national-housing-labor-registry.a-8c6.workers.dev)** — the national, non-MN-specific site: generic Socrata/ArcGIS/Carto platform adapters scrape rental-registry and violation feeds from cities across the country (NYC, Seattle, Philadelphia, Detroit, Austin, San Francisco, Denver, Nashville, Cincinnati, Buffalo, + Twin Cities; Milwaukee, Pittsburgh, and NJ via ingest scripts) into the same D1/R2 store as the three registries above. Adding a city = one adapter file. Unified city browser, `/api/*` endpoints, and the dual-offender crossover join.
* **[Field Notes: AI & Earth](https://field-notes.awdnowusaa.cc/)** ([source](field-notes/)) — evidence-first guide to AI energy, water, materials, and labor impacts, with an estimator converting everyday energy use into inference-token equivalents.
* **[Decarb My State](https://decarb-my-state.a-8c6.workers.dev)** — state-by-state decarbonization progress for all 50 states + DC: emissions through 2022 (EPA), power generation through 2024 (EIA). Source: [aminamos/decarbonize-my-state](https://github.com/aminamos/decarbonize-my-state).
* **[Roseville STR Feasibility Engine](https://roseville-str-feasibility.a-8c6.workers.dev)** ([source](roseville-str-feasibility/)) — models Roseville, MN City Code Ch. 907/908/909 for any address: seasonal STR frequency caps, 500-ft license spacing, occupancy ceilings, and real revenue limits vs. naive Airbnb pro-formas, backed by Ramsey County parcel data.
* **[Rural MN Planning Bot](https://rural-planning-bot.a-8c6.workers.dev)** ([source](workers/planning-bot/)) — "Can I Build / Do This?" source coverage for all 60 nonmetro Minnesota counties: verified GIS portals, parcel services, zoning ordinances, city codes, and assessor links in D1, archived code documents in R2, and a monthly cron that re-checks tracked URLs so ordinance changes get detected. Source material is collected by the [rural county sweep pipeline](#rural-county-data-pipeline-data--scripts).

---

## Repo Map

| Path | What it is |
|---|---|
| [`regions/`](regions/) | Per-region civic tech directories (see below) |
| [`social-tokens-projects/`](social-tokens-projects/README.md) | Agent systems + Cloudflare Workers for eviction defense, landlord de-anonymization, SSDI hearings |
| [`roseville-str-feasibility/`](roseville-str-feasibility/) | Roseville STR feasibility worker (rules engine, D1 rule params, archived ordinances) |
| [`workers/planning-bot/`](workers/planning-bot/) | Rural MN Planning Bot worker (D1 + R2 + scheduled URL re-checks) |
| [`data/`](data/), [`scripts/`](scripts/) | Rural county source discovery pipeline feeding the Planning Bot |
| [`field-notes/`](field-notes/) | Field Notes: AI & Earth site (Vite + Cloudflare) |
| [`.github/workflows/`](.github/workflows/) | Deploys for the de-anonymizer, wage theft, and unified registry workers |

---

## Regional Guides

* **[Minnesota & Twin Cities](regions/minnesota.md)**: Hennepin County Design System, Minneapolis Institute of Art, UMN Mapping Prejudice, Science Museum of MN, Northern Widget, MinnPost.
* **[Seattle & Puget Sound](regions/seattle.md)**: OneBusAway, Puget Sound Regional Council (PSRC), Clearviction.
* **[New York City](regions/nyc.md)**: NYC Planning (Data Engineering, Planning Labs, Equity Tool), BetaNYC, City of New York.
* **[San Francisco Bay Area](regions/sf-bay-area.md)**: Code for San Francisco (SF Brigade), Bay Area Metro (MTC/ABAG).
* **[Chicago & Cook County](regions/chicago.md)**: Chi Hack Night (Govbot), DataMade (usaddress, LA Metro Translations).
* **[Oakland & East Bay](regions/oakland.md)**: Sudo Room, OpenOakland (WOEIP Air Quality), California Digital Library (CDL), Sudo Mesh.

---

## Special Project: [Council Data Project (CDP) Expansion Blueprint](cdp-expansion-blueprint.md)

Strategic and technical expansion roadmap for **[aminamos/cdp](https://github.com/aminamos/cdp)**. Leverages the **Neon PostgreSQL 17 (`pgvector`) + Whisper** architecture to onboard new municipal jurisdictions (Minneapolis, St. Paul, Oakland, San Francisco, Chicago, and NYC) with tested API endpoints and local civic tech tie-ins.

---

## Social Tokens Projects ([`social-tokens-projects/`](social-tokens-projects/README.md))

High-leverage agent systems directing LLM tokens toward structural transparency and collective civic power — now housed in this repo (mirrored from [aminamos/social-tokens-projects](https://github.com/aminamos/social-tokens-projects)):

* **01 — Eviction Defense & Right-to-Counsel Navigator** ([`social-tokens-projects/01-eviction-defense-navigator/`](social-tokens-projects/01-eviction-defense-navigator/README.md)): verified answers, fee waivers, discovery requests.
* **02 — Corporate Shell Entity & Slumlord De-anonymization** ([`social-tokens-projects/02-corporate-shell-deanonymizer/`](social-tokens-projects/02-corporate-shell-deanonymizer/README.md)): ownership graphs from tax rolls, SOS filings, violations, mortgage deeds + 4 Cloudflare Workers (3 standalone + 1 unified registry).
* **06 — SSDI Hearing-Stage Pilot** ([`social-tokens-projects/06-ssdi-hearing-pilot/`](social-tokens-projects/06-ssdi-hearing-pilot/README.md)): 5-step back-office pipeline with attorney sign-off.

---

## Rural County Data Pipeline ([`data/`](data/) + [`scripts/`](scripts/))

Source material for the Planning Bot, built only from URLs that actually return HTTP 200 — nothing guessed:

1. [`scripts/parse_usda_rural.py`](scripts/parse_usda_rural.py) — derives the 60 nonmetro MN counties from the USDA ERS rural definition ([`data/ERS_MN_rural.pdf`](data/ERS_MN_rural.pdf)) and OMB metro delineations → [`data/mn_rural_counties.json`](data/mn_rural_counties.json).
2. [`scripts/rural_county_sweep.py`](scripts/rural_county_sweep.py) — discovers public ArcGIS portal/parcel endpoints per county via the ArcGIS Online search API → [`data/county_sources.csv`](data/county_sources.csv) / [`.json`](data/county_sources.json); anything unverified is left null with `needs_review=true`.
3. [`scripts/merge_review_batches.py`](scripts/merge_review_batches.py) — folds human-researched zoning ordinance, city code, and assessor URLs from [`data/review_batches/`](data/review_batches/) into the source records, re-verifying every URL with an independent request; open gaps are tracked in [`data/county_review.md`](data/county_review.md).
4. [`scripts/archive_city_codes.py`](scripts/archive_city_codes.py) + [`scripts/load_to_d1.py`](scripts/load_to_d1.py) — snapshot code documents to R2 and load county records into the `rural-planning-bot` D1 database ([`data/seed_counties.sql`](data/seed_counties.sql), [`data/city_code_docs.sql`](data/city_code_docs.sql)).

---

## Ideas & Research

* **[Rural Areas: AI Force-Multiplier Ideas](rural-ideas.md)**: solo-build concepts for small towns, farms, rural clinics, and local businesses — Buffalo, Hennepin suburbs, Anoka/Ramsey/Washington counties, Menomonie WI, and Roseville MN. Idea #1 (the Planning Bot) is now live above.
* **[Estimating AI Models' Environmental Footprint Without Lab Disclosures](ai-model-environmental-estimation.md)**: what Meta, OpenAI, Anthropic, and Google actually publish about training/inference energy, carbon, and water; compute → energy → emissions → water estimation methods; per-lab supply-chain anchors; and a BCC-able disclosure-request email. Companion research to [Field Notes: AI & Earth](https://field-notes.awdnowusaa.cc/).
* **[Full Session Notes](FULL_SESSION_NOTES.md)**: the research dossier behind this directory — the Minnesota grassroots nonprofit audit, maintenance-gap findings, and CDP expansion notes.

---

## Top Quick Wins (Ranked by PR Acceptance Probability)

These issues feature active maintainers, isolated diffs, and immediate social or accessibility value:

| # | Organization / Project | Issue | Stack | Why It's a Great First PR |
|---|---|---|---|---|
| **1** | **Hennepin County** | [ed-hcds-components#59](https://github.com/HennepinCounty/ed-hcds-components/issues/59) | CSS / a11y | **Add `:focus` ring to hyperlink elements**: Direct accessibility fix for county digital services. 🔄 **In review — [PR #69](https://github.com/HennepinCounty/ed-hcds-components/pull/69)** (also addresses [#57](https://github.com/HennepinCounty/ed-hcds-components/issues/57)) |
| **2** | **Science Museum of MN** | [laparoscopy-camera#5](https://github.com/scimusmn/laparoscopy-camera/issues/5) | C++ / Arduino | **Invert `digitalRead` logic**: One-line boolean fix (`!digitalRead(button_pin)`) on museum interactive. |
| **3** | **OneBusAway** | [watchdog#147](https://github.com/OneBusAway/watchdog/issues/147) | Python / GTFS | **Precision rounding fix**: Stop treating micro-coordinate shifts as transit stop relocations. (`good first issue`) |
| **4** | **NYC Planning** | [equity-tool#303](https://github.com/NYCPlanning/equity-tool/issues/303) | React / TS | **Remove deprecated props**: Clean up `react-map-gl` deprecation warnings on public zoning tool. |
| **5** | **Chi Hack Night** | [govbot#30](https://github.com/chihacknight/govbot/issues/30) | Python / APIs | **Councilmatic Catalog Entry**: Add Chicago City Council feed to public discovery tool. (`good first issue`) |
| **6** | **Northern Widget** | [Margay_Library#28](https://github.com/NorthernWidget/Margay_Library/issues/28) | Jekyll / Actions | **GitHub Pages API docs**: Setup Doxygen + Jekyll automated doc deployment for civic sensors. |
| **7** | **OpenOakland** | [openoakland.org#295](https://github.com/openoakland/openoakland.org/issues/295) | Jekyll / JS | **Markdown rendering fix**: Convert raw meetup descriptions to formatted HTML. (`good first issue`) |

---

## Finding Issues by Tech Stack

### Frontend & Design Systems (HTML / SCSS / React / Vue)
* **Hennepin County** ([`ed-hcds-components`](https://github.com/HennepinCounty/ed-hcds-components)): Header search button ([#66](https://github.com/HennepinCounty/ed-hcds-components/issues/66)), dark background link styles ([#58](https://github.com/HennepinCounty/ed-hcds-components/issues/58)), grid/flex gap classes ([#61](https://github.com/HennepinCounty/ed-hcds-components/issues/61)).
* **Code for San Francisco** ([`datasci-earthquake`](https://github.com/sfbrigade/datasci-earthquake)): FEMA hazard card ([#1053](https://github.com/sfbrigade/datasci-earthquake/issues/1053)), layer UI ([#1052](https://github.com/sfbrigade/datasci-earthquake/issues/1052)).
* **Sudo Room** ([`MemberMatters`](https://github.com/sudoroom/MemberMatters)): Membership tier CSS styling ([#1](https://github.com/sudoroom/MemberMatters/issues/1)).
* **OpenOakland** ([`woeip`](https://github.com/openoakland/woeip)): Air quality dashboard responsive layout regression ([#508](https://github.com/openoakland/woeip/issues/508)).

### Python, APIs & Civic Data Pipelines
* **DataMade** ([`usaddress`](https://github.com/datamade/usaddress), [`la-metro-translations`](https://github.com/datamade/la-metro-translations)): Regex caching ([#410](https://github.com/datamade/usaddress/issues/410)), document translation API tests ([#92](https://github.com/datamade/la-metro-translations/issues/92)).
* **BetaNYC** ([`New-York-City-Budget`](https://github.com/BetaNYC/New-York-City-Budget)): Sort order consistency ([#50](https://github.com/BetaNYC/New-York-City-Budget/issues/50)), match count reporting ([#49](https://github.com/BetaNYC/New-York-City-Budget/issues/49)).
* **Puget Sound Regional Council** ([`future_land_use`](https://github.com/psrc/future_land_use)): HB 1110 transit stop walkshed wiring ([#3](https://github.com/psrc/future_land_use/issues/3)).
* **UMN Libraries** ([`racial_covenants_processor`](https://github.com/UMNLibraries/racial_covenants_processor)): Multi-workflow parcel count rollup for Mapping Prejudice ([#151](https://github.com/UMNLibraries/racial_covenants_processor/issues/151)).
* **Chi Hack Night** ([`govbot`](https://github.com/chihacknight/govbot)): Scraper organization reference fix ([#78](https://github.com/chihacknight/govbot/issues/78)), executive actions parser ([#28](https://github.com/chihacknight/govbot/issues/28)).

### Mobile & Transit
* **OneBusAway** ([`onebusaway-ios`](https://github.com/OneBusAway/onebusaway-ios), [`onebusaway-android`](https://github.com/OneBusAway/onebusaway-android)): VoiceOver accessibility fix ([#1412](https://github.com/OneBusAway/onebusaway-ios/issues/1412)), offline banner ([#2301](https://github.com/OneBusAway/onebusaway-android/issues/2301)).
* **Code for San Francisco** ([`resource-binder-app`](https://github.com/sfbrigade/resource-binder-app)): Android onboarding screen ([#5](https://github.com/sfbrigade/resource-binder-app/issues/5)).
* **aminamos** ([`transit-alert-mirror`](https://github.com/aminamos/transit-alert-mirror)): Plain-English transit alert, detour, and service advisory enrichment engine.
* **aminamos** ([`transit-mcp`](https://github.com/aminamos/transit-mcp)): Multi-city US public transit MCP server & CLI (MSP, Boston, SF Bay Area, Chicago, Portland).
* **aminamos** ([`transit-operational-data-standard`](https://github.com/aminamos/transit-operational-data-standard)) (fork of [MobilityData/transit-operational-data-standard](https://github.com/MobilityData/transit-operational-data-standard)): open standard for transit schedules used by drivers, dispatchers, and planners.
* **aminamos** ([`la-metro-translations`](https://github.com/aminamos/la-metro-translations)) (fork of [`datamade/la-metro-translations`](https://github.com/datamade/la-metro-translations), see DataMade entry above).
* **aminamos** ([`ghost-bus-tracker`](https://github.com/aminamos/ghost-bus-tracker)): Automated public transit reliability and ghost bus tracker using GTFS & GTFS-RT feeds.
* **aminamos** ([`onebusaway-stopinfo`](https://github.com/aminamos/onebusaway-stopinfo)): Web app that provides and collects detailed bus stop information to/from riders.

### Embedded, Hardware & IoT
* **Science Museum of Minnesota** ([`laparoscopy-camera`](https://github.com/scimusmn/laparoscopy-camera)): Inverted button reading ([#5](https://github.com/scimusmn/laparoscopy-camera/issues/5)).
* **Northern Widget** ([`Margay_Library`](https://github.com/NorthernWidget/Margay_Library), [`Project-Margay`](https://github.com/NorthernWidget/Project-Margay)): Doxygen docs pipeline ([#28](https://github.com/NorthernWidget/Margay_Library/issues/28)), BoM verification ([#47](https://github.com/NorthernWidget/Project-Margay/issues/47)).

---

## The Contributor's Rulebook for Civic Tech

1. **Check Commit Recency First**: If the default branch has not seen commits in the last 6 months, verify with a polite comment on the issue before writing code.
2. **Keep Diffs Surgical**: Volunteer reviewers have limited bandwidth. A 10-line diff solving one exact issue is merged 10x faster than a PR that also formats indentation or bumps 5 unrelated packages.
3. **Respect Test Suites & Linters**: Run `npm test`, `pytest`, or equivalent locally. In public agencies like NYC Planning and Hennepin County, CI checks run automated compliance tests.
4. **Prioritize Accessibility (a11y)**: Government and civic tech projects serve everyone, including individuals with low vision, motor impairments, and screen reader users. Accessible fixes are warmly welcomed by maintainers.

---

## In Review

Opened PRs awaiting maintainer review (all re-checked open as of 2026-09-16). Move to Done once merged.

| Project | Issue | PR | Status |
|---|---|---|---|
| Hennepin County `ed-hcds-components` | [#59](https://github.com/HennepinCounty/ed-hcds-components/issues/59) (also [#57](https://github.com/HennepinCounty/ed-hcds-components/issues/57)) | [#69](https://github.com/HennepinCounty/ed-hcds-components/pull/69) | 🔄 In review |
| Chi Hack Night `govbot` | [#27](https://github.com/chihacknight/govbot/issues/27) | [#143](https://github.com/chihacknight/govbot/pull/143) | 🔄 In review |
| Chi Hack Night `govbot` | [#24](https://github.com/chihacknight/govbot/issues/24) | [#144](https://github.com/chihacknight/govbot/pull/144) | 🔄 In review |
| Chi Hack Night `govbot` | [#25](https://github.com/chihacknight/govbot/issues/25) | [#145](https://github.com/chihacknight/govbot/pull/145) | 🔄 In review |
| Chi Hack Night `govbot` | [#19](https://github.com/chihacknight/govbot/issues/19) | [#146](https://github.com/chihacknight/govbot/pull/146) | 🔄 In review |
| Chi Hack Night `govbot` | [#20](https://github.com/chihacknight/govbot/issues/20) | [#147](https://github.com/chihacknight/govbot/pull/147) | 🔄 In review |
| Chi Hack Night `govbot` | [#26](https://github.com/chihacknight/govbot/issues/26) | [#148](https://github.com/chihacknight/govbot/pull/148) | 🔄 In review |
| DataMade `la-metro-translations` | [#84](https://github.com/datamade/la-metro-translations/issues/84) | [#93](https://github.com/datamade/la-metro-translations/pull/93) | 🔄 In review |
| Mia `collection-elasticsearch` | [#10](https://github.com/artsmia/collection-elasticsearch/issues/10) | [#11](https://github.com/artsmia/collection-elasticsearch/pull/11) | 🔄 In review |
| Mia `collection` | [#10](https://github.com/artsmia/collection/issues/10), [#7](https://github.com/artsmia/collection/issues/7) | [#11](https://github.com/artsmia/collection/pull/11) | 🔄 In review |
| Mia `art` | — | [#109](https://github.com/artsmia/art/pull/109) | 🔄 In review |
| MobilityData `transit-operational-data-standard` | — | [#161](https://github.com/MobilityData/transit-operational-data-standard/pull/161), [#162](https://github.com/MobilityData/transit-operational-data-standard/pull/162), [#163](https://github.com/MobilityData/transit-operational-data-standard/pull/163), [#164](https://github.com/MobilityData/transit-operational-data-standard/pull/164) | 🔄 In review |

---

## Done

Merged PRs.
