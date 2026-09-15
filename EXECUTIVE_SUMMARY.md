# Executive Summary: Civic Tech Ecosystem & Action Roadmap

This document unifies the findings across six major US metropolitan hubs (**Minnesota / Twin Cities**, **Seattle**, **New York City**, **SF Bay Area**, **Chicago**, and **Oakland**), audits the health of grassroots vs. institutional civic open-source projects, outlines top quick-win pull request targets, and blueprints the expansion of the **Council Data Project (CDP)**.

---

## 1. The Civic Tech Maintenance Reality

A common pitfall in civic tech is investing effort into dormant repositories where pull requests sit unmerged indefinitely. Across our audits, we identified a clear divergence:

* **The Maintenance Gap in Grassroots Groups**:
  * **Open Twin Cities (`OpenTwinCities`)**: Effectively dormant since 2021–2022. Issues like `mnpay#49` explicitly requested a banner stating the project is unmaintained.
  * **Twin Cities Mutual Aid Project (`Twin-Cities-Mutual-Aid`)**: Officially sunsetted; all primary repositories (`tcmap-api`, `twin-cities-aid-distribution-locations`) are archived and read-only.
  * **Twin Cities Maker (`tcmaker`)**: Makerspace tools (`clubhouse`, `tcmaker-theme`) have seen no commits since late 2022.
  * **Open Seattle (`openseattle`)**: Historical brigade repos are archived; active projects spun out into independent non-profits.
* **Where High-Velocity Activity Lives**:
  * **Public Sector Digital Teams**: Hennepin County Digital Services (`HennepinCounty`), NYC Planning (`NYCPlanning`), Puget Sound Regional Council (`psrc`), Bay Area Metro (`BayAreaMetro`).
  * **Institutional Nonprofits & Museums**: Minneapolis Institute of Art (`artsmia`), Science Museum of Minnesota (`scimusmn`), University of Minnesota Libraries (`UMNLibraries`), California Digital Library (`cdlib`).
  * **Resilient Community Collectives**: Chi Hack Night (`chihacknight`), OneBusAway (`OneBusAway`), DataMade (`datamade`), Code for San Francisco (`sfbrigade`), Sudo Room (`sudoroom`).

---

## 2. Regional Directory & Active Organizations

### 🌲 Minnesota (Twin Cities)
* **Hennepin County (`HennepinCounty/ed-hcds-components`)**: HTML/SCSS/JS. Actively maintained Design System used across county public services. Target issues include focus ring accessibility ([#59](https://github.com/HennepinCounty/ed-hcds-components/issues/59)), mobile header search button ([#66](https://github.com/HennepinCounty/ed-hcds-components/issues/66)), and flex/grid gap utility classes ([#61](https://github.com/HennepinCounty/ed-hcds-components/issues/61)).
* **Minneapolis Institute of Art (`artsmia/collection-elasticsearch`)**: Python/Elasticsearch. 403 rendition error on public domain records ([#10](https://github.com/artsmia/collection-elasticsearch/issues/10) - 🔄 [PR #11](https://github.com/artsmia/collection-elasticsearch/pull/11) in review).
* **UMN Libraries (`UMNLibraries/racial_covenants_processor`)**: Python/Django. Data pipeline for the Mapping Prejudice project; parcel count rollups across child workflows ([#151](https://github.com/UMNLibraries/racial_covenants_processor/issues/151)).
* **Science Museum of Minnesota (`scimusmn/laparoscopy-camera`)**: C++/Arduino. Interactive hardware inverted digitalRead bug ([#5](https://github.com/scimusmn/laparoscopy-camera/issues/5)).
* **Northern Widget (`NorthernWidget/Margay_Library`)**: C++/Jekyll. Environmental sensor documentation pipeline via GitHub Actions ([#28](https://github.com/NorthernWidget/Margay_Library/issues/28)).

### ☕ Seattle & Puget Sound
* **OneBusAway (`OneBusAway`)**: Swift/Kotlin/Python. Daily commits. GTFS coordinate precision handling ([watchdog#147](https://github.com/OneBusAway/watchdog/issues/147) - `good first issue`), SwiftUI VoiceOver accessibility fix ([onebusaway-ios#1412](https://github.com/OneBusAway/onebusaway-ios/issues/1412)), and realtime offline banner ([onebusaway-android#2301](https://github.com/OneBusAway/onebusaway-android/issues/2301)).
* **Puget Sound Regional Council (`psrc/future_land_use`)**: Python/GeoPandas. Washington HB 1110 middle-housing transit stop walkshed wiring ([#3](https://github.com/psrc/future_land_use/issues/3)).
* **Clearviction (`clearviction-devs/clearviction-wa`)**: TypeScript/Next.js. Criminal record vacation calculator for Washington courts.

### 🗽 New York City (NYC)
* **NYC Planning (`NYCPlanning`)**: Daily activity across data engineering and frontend mapping. MinIO client deprecation ([data-engineering#2627](https://github.com/NYCPlanning/data-engineering/issues/2627)), React map-gl props cleanup ([equity-tool#303](https://github.com/NYCPlanning/equity-tool/issues/303)), housing growth aggregation ([ae-cp-map#559](https://github.com/NYCPlanning/ae-cp-map/issues/559)).
* **BetaNYC (`BetaNYC/New-York-City-Budget`)**: Python/SQLite. Council awards sorting discrepancy ([#50](https://github.com/BetaNYC/New-York-City-Budget/issues/50)), search total disclosure ([#49](https://github.com/BetaNYC/New-York-City-Budget/issues/49)).
* **City of New York (`CityOfNewYork/nyc-geo-metadata`)**: Markdown/GIS. Address point ZIP documentation ([#114](https://github.com/CityOfNewYork/nyc-geo-metadata/issues/114) - `help wanted`).

### 🌉 San Francisco Bay Area
* **Code for San Francisco (`sfbrigade`)**: React/Mobile. Android onboarding flow ([resource-binder-app#5](https://github.com/sfbrigade/resource-binder-app/issues/5)), FEMA seismic hazard card ([datasci-earthquake#1053](https://github.com/sfbrigade/datasci-earthquake/issues/1053)).
* **Bay Area Metro (`BayAreaMetro/travel-model-one`)**: Python. Typo in truck trip distribution formula ([#113](https://github.com/BayAreaMetro/travel-model-one/issues/113)), joint tour weighting ([travel-diary-survey-tools#99](https://github.com/BayAreaMetro/travel-diary-survey-tools/issues/99)).

### 🏙️ Chicago & Cook County
* **Chi Hack Night (`chihacknight/govbot`)**: Python/FastAPI. Chicago City Council Councilmatic catalog ([#30](https://github.com/chihacknight/govbot/issues/30) - `good first issue`), executive actions data item ([#28](https://github.com/chihacknight/govbot/issues/28) - `good first issue`), scraper regression ([#78](https://github.com/chihacknight/govbot/issues/78)).
* **DataMade (`datamade`)**: Python/Django. Regex compilation caching on `usaddress` ([#410](https://github.com/datamade/usaddress/issues/410)), accessible language download links ([la-metro-translations#84](https://github.com/datamade/la-metro-translations/issues/84) - 🔄 [PR #93](https://github.com/datamade/la-metro-translations/pull/93) in review).
* **Bike Lane Uprising (BLU)**: Chicago-born benchmark of crowdsourced spatial data influencing municipal protected bike infrastructure across 100+ cities.

### 🌳 Oakland & East Bay
* **Sudo Room (`sudoroom/MemberMatters`)**: Python/Vue/CSS. Membership tier styling ([#1](https://github.com/sudoroom/MemberMatters/issues/1)), donation link routing ([#9](https://github.com/sudoroom/MemberMatters/issues/9)).
* **OpenOakland (`openoakland`)**: Liquid/JS/CSS. Meetup markdown parser ([openoakland.org#295](https://github.com/openoakland/openoakland.org/issues/295) - `good first issue`), air quality dashboard responsiveness ([woeip#508](https://github.com/openoakland/woeip/issues/508)).
* **California Digital Library (`cdlib/cdl-github-mgmt`)**: Documentation/Actions. GitHub Pages best practices ([#6](https://github.com/cdlib/cdl-github-mgmt/issues/6)).

---

## 3. Ranked "Quick Win" PR Targets

| Rank | Organization | Repo & Issue | Technology | Effort | Impact |
|:---:|:---|:---|:---:|:---:|:---|
| **1** | Hennepin County | [`ed-hcds-components#59`](https://github.com/HennepinCounty/ed-hcds-components/issues/59) | CSS / a11y | 15 mins | Adds `:focus` visible indicator to hyperlinks across all Hennepin County web apps. 🔄 **In review: [PR #69](https://github.com/HennepinCounty/ed-hcds-components/pull/69)** |
| **2** | Science Museum of MN | [`laparoscopy-camera#5`](https://github.com/scimusmn/laparoscopy-camera/issues/5) | C++ / Arduino | 5 mins | Inverts `digitalRead` boolean logic (`!digitalRead`) for kiosk controller. |
| **3** | OneBusAway | [`watchdog#147`](https://github.com/OneBusAway/watchdog/issues/147) | Python / GTFS | 30 mins | Prevents floating-point coordinate precision rounding from triggering false stop moves. |
| **4** | NYC Planning | [`equity-tool#303`](https://github.com/NYCPlanning/equity-tool/issues/303) | React / TS | 20 mins | Removes deprecated `react-map-gl` properties on public planning dashboard. |
| **5** | Chi Hack Night | [`govbot#30`](https://github.com/chihacknight/govbot/issues/30) | Python / APIs | 45 mins | Connects Chicago City Council legislative feeds into Govbot discovery catalog. |
| **6** | Northern Widget | [`Margay_Library#28`](https://github.com/NorthernWidget/Margay_Library/issues/28) | Jekyll / Actions | 45 mins | Establishes automated Doxygen-to-GitHub-Pages pipeline for open civic sensors. |
| **7** | OpenOakland | [`openoakland.org#295`](https://github.com/openoakland/openoakland.org/issues/295) | Jekyll / Liquid | 20 mins | Fixes markdown rendering for community meetup descriptions. |

---

## 4. Council Data Project (CDP) Expansion Roadmap

The **[aminamos/cdp](https://github.com/aminamos/cdp)** workspace solves the legacy cloud bottlenecks that stalled CDP in 2023. By replacing per-city GCP projects, Firebase rules, and cloud GPU runners with:
1. **Neon PostgreSQL 17** with `pgvector` and `pg_trgm`
2. **Local / Serverless Faster-Whisper** (`large-v3-turbo` in `int8` mode)
3. **Single Node.js HTTP API** (`neon/api/server.mjs`)

A single database cluster can now host multiple municipal deployments concurrently.

### Live Municipal API Status
* 🟢 **Minneapolis, MN**: `webapi.legistar.com/v1/minneapolismn` — 16 active bodies, open without auth. YouTube video streams available.
* 🟢 **Saint Paul, MN**: `webapi.legistar.com/v1/stpaul` — 18 active bodies, open without auth. Cable 19 / Granicus MP4s.
* 🟢 **Oakland, CA**: `webapi.legistar.com/v1/oakland` — 150 active bodies, open without auth. Already scaffolded in `oakland/`.
* 🟢 **San Francisco, CA**: `webapi.legistar.com/v1/sfgov` — 151 active bodies, open without auth. SFGovTV YouTube streams.
* 🟡 **Chicago, IL**: InSite HTML calendar open. Directly fulfills **Chi Hack Night issue [#30](https://github.com/chihacknight/govbot/issues/30)**.
* 🟡 **New York City, NY**: InSite HTML open; token required for Web API.

---

## 5. Repository Documentation Index

All detailed guides and blueprints are committed in this repository:

* 📄 **[cdp-expansion-blueprint.md](cdp-expansion-blueprint.md)**: Full CDP technical architecture, database seeding SQL, and city onboarding scripts.
* 🌲 **[regions/minnesota.md](regions/minnesota.md)**: Minneapolis & Saint Paul civic tech, museums, and public agencies.
* ☕ **[regions/seattle.md](regions/seattle.md)**: OneBusAway transit tools, PSRC urban modeling, and Clearviction.
* 🗽 **[regions/nyc.md](regions/nyc.md)**: NYC Planning Labs, BetaNYC, and City of New York datasets.
* 🌉 **[regions/sf-bay-area.md](regions/sf-bay-area.md)**: Code for San Francisco (SF Brigade) and Bay Area Metro (MTC).
* 🏙️ **[regions/chicago.md](regions/chicago.md)**: Chi Hack Night (Govbot), DataMade, and Bike Lane Uprising spotlight.
* 🌳 **[regions/oakland.md](regions/oakland.md)**: Sudo Room, OpenOakland, California Digital Library, and Sudo Mesh.
