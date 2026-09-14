# Civic Tech & Social Impact Open Source Directory

A curated, field-verified roadmap of civic tech groups, non-profits, public data agencies, and community initiatives across **Minnesota (Twin Cities)**, **Seattle**, **New York City**, **SF Bay Area**, **Chicago**, and **Oakland**.

Every organization listed here has been audited for **active maintenance pipelines in 2025–2026** so your pull requests won't sit unreviewed on abandoned forks.

> 📊 **[Read the Complete Executive Summary & Master Roadmap (EXECUTIVE_SUMMARY.md)](EXECUTIVE_SUMMARY.md)** for the full analysis, maintenance gap audit, ranked quick-win action plan, and CDP expansion strategy.

---

## 🌐 Live Sites

* 🏠 **[Social Housing Info](https://social-housing-info.a-8c6.workers.dev/)** — public information resource on rent stabilization definitions, the NYC rent freeze, block-by-block housing development, community land trusts, and further reading.
* 🏢 **[Landlord De-anonymizer](https://mpls-rental-sync-worker.a-8c6.workers.dev)** — ownership graphs for Twin Cities rental properties, reconstructing corporate landlord networks from tax rolls, SOS filings, violations, and mortgage deeds.
* ⚖️ **[Wage Theft & Labor Standards Registry](https://twin-cities-wage-theft-worker.a-8c6.workers.dev)** — searchable registry of wage theft and labor standards violations across the Twin Cities.
* 🧩 **[Slumlord & Wage Theft Crossover Matrix](https://twin-cities-slumlord-labor-matrix.a-8c6.workers.dev)** — cross-index of corporate syndicates cited for both slumlord code violations and wage theft, with a crossover API and in-browser AI assistant.

---

## 🗺️ Regional Guides

* 🌲 **[Minnesota & Twin Cities](regions/minnesota.md)**: Hennepin County Design System, Minneapolis Institute of Art, UMN Mapping Prejudice, Science Museum of MN, Northern Widget, MinnPost.
* ☕ **[Seattle & Puget Sound](regions/seattle.md)**: OneBusAway, Puget Sound Regional Council (PSRC), Clearviction.
* 🗽 **[New York City](regions/nyc.md)**: NYC Planning (Data Engineering, Planning Labs, Equity Tool), BetaNYC, City of New York.
* 🌉 **[San Francisco Bay Area](regions/sf-bay-area.md)**: Code for San Francisco (SF Brigade), Bay Area Metro (MTC/ABAG).
* 🏙️ **[Chicago & Cook County](regions/chicago.md)**: Chi Hack Night (Govbot), DataMade (usaddress, LA Metro Translations).
* 🌳 **[Oakland & East Bay](regions/oakland.md)**: Sudo Room, OpenOakland (WOEIP Air Quality), California Digital Library (CDL), Sudo Mesh.

---

## 🏛️ Special Project: [Council Data Project (CDP) Expansion Blueprint](cdp-expansion-blueprint.md)

Strategic and technical expansion roadmap for **[aminamos/cdp](https://github.com/aminamos/cdp)**. Leverages the **Neon PostgreSQL 17 (`pgvector`) + Whisper** architecture to onboard new municipal jurisdictions (Minneapolis, St. Paul, Oakland, San Francisco, Chicago, and NYC) with tested API endpoints and local civic tech tie-ins.

---

## 🪙 Social Tokens Projects ([`social-tokens-projects/`](social-tokens-projects/README.md))

High-leverage agent systems directing LLM tokens toward structural transparency and collective civic power — now housed in this repo (mirrored from [aminamos/social-tokens-projects](https://github.com/aminamos/social-tokens-projects)):

* **01 — Eviction Defense & Right-to-Counsel Navigator** ([`social-tokens-projects/01-eviction-defense-navigator/`](social-tokens-projects/01-eviction-defense-navigator/README.md)): verified answers, fee waivers, discovery requests.
* **02 — Corporate Shell Entity & Slumlord De-anonymization** ([`social-tokens-projects/02-corporate-shell-deanonymizer/`](social-tokens-projects/02-corporate-shell-deanonymizer/README.md)): ownership graphs from tax rolls, SOS filings, violations, mortgage deeds + 3 Cloudflare Workers.
* **06 — SSDI Hearing-Stage Pilot** ([`social-tokens-projects/06-ssdi-hearing-pilot/`](social-tokens-projects/06-ssdi-hearing-pilot/README.md)): 5-step back-office pipeline with attorney sign-off.

---

## ⚡ Top 10 Quick Wins (Ranked by PR Acceptance Probability)

These issues feature active maintainers, isolated diffs, and immediate social or accessibility value:

| # | Organization / Project | Issue | Stack | Why It's a Great First PR |
|---|---|---|---|---|
| **1** | **Hennepin County** | [ed-hcds-components#59](https://github.com/HennepinCounty/ed-hcds-components/issues/59) | CSS / a11y | **Add `:focus` ring to hyperlink elements**: Direct accessibility fix for county digital services. |
| **2** | **Science Museum of MN** | [laparoscopy-camera#5](https://github.com/scimusmn/laparoscopy-camera/issues/5) | C++ / Arduino | **Invert `digitalRead` logic**: One-line boolean fix (`!digitalRead(button_pin)`) on museum interactive. |
| **3** | **OneBusAway** | [watchdog#147](https://github.com/OneBusAway/watchdog/issues/147) | Python / GTFS | **Precision rounding fix**: Stop treating micro-coordinate shifts as transit stop relocations. (`good first issue`) |
| **4** | **DataMade** | [usaddress#410](https://github.com/datamade/usaddress/issues/410) | Python / Regex | **Precompile regular expressions**: Performance optimization on nationwide address parser. |
| **5** | **OneBusAway** | [onebusaway-ios#1412](https://github.com/OneBusAway/onebusaway-ios/issues/1412) | SwiftUI / a11y | **VoiceOver accessibility fix**: Fix misleading button narration for the map settings sheet. |
| **6** | **NYC Planning** | [equity-tool#303](https://github.com/NYCPlanning/equity-tool/issues/303) | React / TS | **Remove deprecated props**: Clean up `react-map-gl` deprecation warnings on public zoning tool. |
| **7** | **Chi Hack Night** | [govbot#30](https://github.com/chihacknight/govbot/issues/30) | Python / APIs | **Councilmatic Catalog Entry**: Add Chicago City Council feed to public discovery tool. (`good first issue`) |
| **8** | **Bay Area Metro** | [travel-model-one#113](https://github.com/BayAreaMetro/travel-model-one/issues/113) | Python | **Typo in truck trip distribution**: Fix formula variable typo in regional transit model. |
| **9** | **Northern Widget** | [Margay_Library#28](https://github.com/NorthernWidget/Margay_Library/issues/28) | Jekyll / Actions | **GitHub Pages API docs**: Setup Doxygen + Jekyll automated doc deployment for civic sensors. |
| **10** | **OpenOakland** | [openoakland.org#295](https://github.com/openoakland/openoakland.org/issues/295) | Jekyll / JS | **Markdown rendering fix**: Convert raw meetup descriptions to formatted HTML. (`good first issue`) |

---

## 🎯 Finding Issues by Tech Stack

### 🎨 Frontend & Design Systems (HTML / SCSS / React / Vue)
* **Hennepin County** ([`ed-hcds-components`](https://github.com/HennepinCounty/ed-hcds-components)): Header search button ([#66](https://github.com/HennepinCounty/ed-hcds-components/issues/66)), dark background link styles ([#58](https://github.com/HennepinCounty/ed-hcds-components/issues/58)), grid/flex gap classes ([#61](https://github.com/HennepinCounty/ed-hcds-components/issues/61)).
* **Code for San Francisco** ([`datasci-earthquake`](https://github.com/sfbrigade/datasci-earthquake)): FEMA hazard card ([#1053](https://github.com/sfbrigade/datasci-earthquake/issues/1053)), layer UI ([#1052](https://github.com/sfbrigade/datasci-earthquake/issues/1052)).
* **Sudo Room** ([`MemberMatters`](https://github.com/sudoroom/MemberMatters)): Membership tier CSS styling ([#1](https://github.com/sudoroom/MemberMatters/issues/1)).
* **OpenOakland** ([`woeip`](https://github.com/openoakland/woeip)): Air quality dashboard responsive layout regression ([#508](https://github.com/openoakland/woeip/issues/508)).

### 🐍 Python, APIs & Civic Data Pipelines
* **DataMade** ([`usaddress`](https://github.com/datamade/usaddress), [`la-metro-translations`](https://github.com/datamade/la-metro-translations)): Regex caching ([#410](https://github.com/datamade/usaddress/issues/410)), document translation API tests ([#92](https://github.com/datamade/la-metro-translations/issues/92)).
* **BetaNYC** ([`New-York-City-Budget`](https://github.com/BetaNYC/New-York-City-Budget)): Sort order consistency ([#50](https://github.com/BetaNYC/New-York-City-Budget/issues/50)), match count reporting ([#49](https://github.com/BetaNYC/New-York-City-Budget/issues/49)).
* **Puget Sound Regional Council** ([`future_land_use`](https://github.com/psrc/future_land_use)): HB 1110 transit stop walkshed wiring ([#3](https://github.com/psrc/future_land_use/issues/3)).
* **UMN Libraries** ([`racial_covenants_processor`](https://github.com/UMNLibraries/racial_covenants_processor)): Multi-workflow parcel count rollup for Mapping Prejudice ([#151](https://github.com/UMNLibraries/racial_covenants_processor/issues/151)).
* **Chi Hack Night** ([`govbot`](https://github.com/chihacknight/govbot)): Scraper organization reference fix ([#78](https://github.com/chihacknight/govbot/issues/78)), executive actions parser ([#28](https://github.com/chihacknight/govbot/issues/28)).

### 📱 Mobile & Transit (iOS / Android)
* **OneBusAway** ([`onebusaway-ios`](https://github.com/OneBusAway/onebusaway-ios), [`onebusaway-android`](https://github.com/OneBusAway/onebusaway-android)): VoiceOver accessibility fix ([#1412](https://github.com/OneBusAway/onebusaway-ios/issues/1412)), offline banner ([#2301](https://github.com/OneBusAway/onebusaway-android/issues/2301)).
* **Code for San Francisco** ([`resource-binder-app`](https://github.com/sfbrigade/resource-binder-app)): Android onboarding screen ([#5](https://github.com/sfbrigade/resource-binder-app/issues/5)).

### 🔌 Embedded, Hardware & IoT
* **Science Museum of Minnesota** ([`laparoscopy-camera`](https://github.com/scimusmn/laparoscopy-camera)): Inverted button reading ([#5](https://github.com/scimusmn/laparoscopy-camera/issues/5)).
* **Northern Widget** ([`Margay_Library`](https://github.com/NorthernWidget/Margay_Library), [`Project-Margay`](https://github.com/NorthernWidget/Project-Margay)): Doxygen docs pipeline ([#28](https://github.com/NorthernWidget/Margay_Library/issues/28)), BoM verification ([#47](https://github.com/NorthernWidget/Project-Margay/issues/47)).

---

## 💡 The Contributor's Rulebook for Civic Tech

1. **Check Commit Recency First**: If the default branch has not seen commits in the last 6 months, verify with a polite comment on the issue before writing code.
2. **Keep Diffs Surgical**: Volunteer reviewers have limited bandwidth. A 10-line diff solving one exact issue is merged 10x faster than a PR that also formats indentation or bumps 5 unrelated packages.
3. **Respect Test Suites & Linters**: Run `npm test`, `pytest`, or equivalent locally. In public agencies like NYC Planning and Hennepin County, CI checks run automated compliance tests.
4. **Prioritize Accessibility (a11y)**: Government and civic tech projects serve everyone, including individuals with low vision, motor impairments, and screen reader users. Accessible fixes are warmly welcomed by maintainers.
