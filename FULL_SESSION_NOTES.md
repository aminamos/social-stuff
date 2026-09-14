# Complete Civic Tech & CDP Expansion Session Notes

*Exported session notes & research dossier for `aminamos/social-stuff`.*

---

## 1. Initial Inquiry: Minnesota Grassroots Nonprofits Audit

The initial investigation examined four Minnesota-based initiatives frequently cited in civic tech roundups:

1. **Open Twin Cities (`OpenTwinCities`)**:
   - **Focus**: Minneapolis / St. Paul civic tech, open government data, municipal scrapers.
   - **Reality Check**: Dormant since ~2021. Issue #49 on `mnpay` requested a banner stating the project is unmaintained. `adopt-a-tree` issues (#491, #420) have sat without triage for years.
2. **Twin Cities Maker (`tcmaker`)**:
   - **Focus**: The Hack Factory community workshop in Minneapolis.
   - **Reality Check**: Inactive since late 2022. Issues on `clubhouse` (#55 Stripe discounts, #48 HTTP 500 error) have no active maintainers.
3. **Twin Cities Mutual Aid Project (`Twin-Cities-Mutual-Aid`)**:
   - **Focus**: Mutual aid distribution sites during 2020.
   - **Reality Check**: Officially sunsetted. Primary repositories (`tcmap-api`, `twin-cities-aid-distribution-locations`) are archived and read-only.
4. **Minnesota Explained (`minnesotaexplained`)**:
   - **Focus**: Legislative and public data explainers.
   - **Reality Check**: Single repository (`minnesotaexplained.github.io`) updated September 2026, but maintains 0 issues.

---

## 2. Multi-City Field Audit: Real Active Civic Tech (2025–2026)

We audited active municipal and non-profit GitHub organizations with live issue trackers across 6 metro areas:

### Minnesota
- **Hennepin County (`HennepinCounty/ed-hcds-components`)**: Accessible design system. Target issues: #59 (link `:focus` ring), #66 (header search button), #58 (dark background links), #61 (gap utilities).
- **Minneapolis Institute of Art (`artsmia/collection-elasticsearch`)**: #10 (403 image rendition errors on public domain items).
- **University of Minnesota Libraries (`UMNLibraries/racial_covenants_processor`)**: Mapping Prejudice pipeline; #151 (child workflow parcel rollups).
- **Science Museum of Minnesota (`scimusmn/laparoscopy-camera`)**: #5 (one-line boolean inversion `!digitalRead`).
- **Northern Widget (`NorthernWidget/Margay_Library`)**: #28 (Doxygen/Jekyll GitHub Pages documentation pipeline).
- **MinnPost (`MinnPost/object-sync-for-salesforce`)**: #554 (documentation bugs), #546 (mapping error messages).

### Seattle & Puget Sound
- **OneBusAway (`OneBusAway`)**: Extremely active daily commits. Target issues: `watchdog#147` (GTFS coordinate precision rounding, `good first issue`), `onebusaway-ios#1412` (VoiceOver button narration fix), `onebusaway-android#2301` (offline status banner).
- **Puget Sound Regional Council (`psrc/future_land_use`)**: #3 (HB 1110 middle-housing transit stop walksheds), `network_builder#65` (transit speed adjustments).
- **Clearviction (`clearviction-devs/clearviction-wa`)**: Criminal record vacation tool for WA state courts.

### New York City
- **NYC Planning (`NYCPlanning`)**: `data-engineering#2627` (MinIO download URL fix), `equity-tool#303` (deprecated `react-map-gl` props), `ae-cp-map#559` (housing growth borough visualizations).
- **BetaNYC (`BetaNYC/New-York-City-Budget`)**: FastMCP & SQLite budget tools; #50 (EIN award sorting consistency), #49 (search match count disclosure).
- **City of New York (`CityOfNewYork/nyc-geo-metadata`)**: #114 (address point ZIP details, `help wanted`).

### SF Bay Area
- **Code for San Francisco (`sfbrigade`)**: `resource-binder-app#5` (Android onboarding flow), `datasci-earthquake#1053` (FEMA seismic hazard card UI).
- **Bay Area Metro (`BayAreaMetro/travel-model-one`)**: #113 (variable typo in truck trip distribution formula).

### Chicago & Cook County
- **Chi Hack Night (`chihacknight/govbot`)**: #30 (Chicago City Council Councilmatic catalog, `good first issue`), #28 (executive actions data item, `good first issue`), #78 (scraper organization reference fix).
- **DataMade (`datamade/usaddress`)**: #410 (regex precompilation caching), `la-metro-translations#84` (accessible download link text).
- **Bike Lane Uprising (BLU)**: Honorary spotlight on Christina Whiteley's crowdsourced obstruction mapping platform, presented at Chi Hack Night #277, influencing municipal bike infrastructure across 100+ cities.

### Oakland & East Bay
- **Sudo Room (`sudoroom/MemberMatters`)**: #1 (membership tier styling), #9 (donation link routing).
- **OpenOakland (`openoakland`)**: `openoakland.org#295` (meetup markdown-to-HTML parser, `good first issue`), `woeip#508` (air quality dashboard mobile responsiveness).
- **California Digital Library (`cdlib/cdl-github-mgmt`)**: #6 (GitHub Pages best practice documentation).
- **Sudo Mesh (`sudomesh/disaster-radio-website`)**: #18 (disaster radio web UI).

---

## 3. Council Data Project (`aminamos/cdp`) City Expansion Blueprint

The user's private workspace snapshot **`aminamos/cdp`** contains an architecture revival replacing legacy GCP/Firestore/CML dependencies with:
- **Neon PostgreSQL 17** with `pgvector` and `pg_trgm`
- **Local Faster-Whisper** (`large-v3-turbo` in `int8` mode)
- **Node.js HTTP API** (`neon/api/server.mjs`)

### Live Municipal API Probe Results
- **Minneapolis, MN**: `webapi.legistar.com/v1/minneapolismn` (16 active bodies, open API without auth, YouTube video streams).
- **Saint Paul, MN**: `webapi.legistar.com/v1/stpaul` (18 active bodies, open API without auth, Cable 19 / Granicus MP4s).
- **Oakland, CA**: `webapi.legistar.com/v1/oakland` (150 active bodies, open API without auth, already scaffolded in `oakland/`).
- **San Francisco, CA**: `webapi.legistar.com/v1/sfgov` (151 active bodies, open API without auth, SFGovTV YouTube streams).
- **Chicago, IL**: InSite calendar is open. Directly solves **Chi Hack Night issue [#30](https://github.com/chihacknight/govbot/issues/30)**.
- **New York City, NY**: InSite calendar is open; Web API requires token.

---

## 4. Local Workspace & Remote Repository Mapping

- **GitHub Repository**: [https://github.com/aminamos/social-stuff](https://github.com/aminamos/social-stuff)
- **Local Path**: `E:\Development\social-stuff`
- **Branch**: `main`
