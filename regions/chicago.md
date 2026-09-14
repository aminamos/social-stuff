# Chicago & Cook County

Chicago has arguably the most vibrant and longest-running weekly civic tech community in North America (Chi Hack Night, meeting weekly since 2012) alongside prominent open-source civic data firms like DataMade.

---

## 🟢 Highly Active Organizations with Open Issues

### 1. Chi Hack Night (`chihacknight`)
* **Focus**: Nonprofit civic tech collective meeting weekly to build tools for Chicago residents, public transit accountability, climate modeling, and open legislation.
* **Primary Repos**:
  * [`chihacknight/govbot`](https://github.com/chihacknight/govbot)
  * [`chihacknight/breakout-groups`](https://github.com/chihacknight/breakout-groups)
  * [`chihacknight/il-solar-map`](https://github.com/chihacknight/il-solar-map)
  * [`chihacknight/chihacknight.org`](https://github.com/chihacknight/chihacknight.org)
* **Stack**: Python, FastAPI, React / TypeScript, Jekyll
* **Activity**: Active weekly commits in 2026.
* **Target Issues**:
  * **[#30](https://github.com/chihacknight/govbot/issues/30) — `Data Catalog: Chicago City Council (Councilmatic)`**
    * *Label*: `good first issue`
    * *Why solve*: Integrate Chicago City Council legislative data feeds into Govbot's public discovery catalog.
    * *Skills*: Python, JSON APIs.
  * **[#28](https://github.com/chihacknight/govbot/issues/28) — `Add Executive Actions As govbot_data item`**
    * *Label*: `good first issue`
    * *Why solve*: Expand civic data tracking to include executive orders alongside municipal bills.
    * *Skills*: Python.
  * **[#27](https://github.com/chihacknight/govbot/issues/27) — `Overhaul README and docs for clarity, marketing, and use cases`**
    * *Why solve*: Excellent onboarding task to help new community volunteers get running.
    * *Skills*: Markdown, documentation.
  * **[#78](https://github.com/chihacknight/govbot/issues/78) — `Scraper regression: from_organization / organization_id emitted as unresolved "~{...}" reference`**
    * *Why solve*: Bug fix for legislative entity parser.
    * *Skills*: Python, web scraping.

---

### 2. DataMade (`datamade`)
* **Focus**: Chicago-based civic technology company that builds and maintains foundational open-source packages for address parsing, census data, and municipal meeting transcripts.
* **Primary Repos**:
  * [`datamade/usaddress`](https://github.com/datamade/usaddress) (the standard Python library for unstructured US address parsing)
  * [`datamade/la-metro-translations`](https://github.com/datamade/la-metro-translations)
  * [`datamade/census`](https://github.com/datamade/census)
* **Stack**: Python, probabilistic modeling, Django, REST APIs
* **Activity**: Highly active with steady releases in 2026.
* **Target Issues**:
  * **[#410](https://github.com/datamade/usaddress/issues/410) — `Initialize all regex once`**
    * *Label*: `features`
    * *Why solve*: Performance optimization: precompiling regexes avoids recompilation overhead during high-volume batch address standardization.
    * *Skills*: Python, Regular Expressions.
  * **[#84](https://github.com/datamade/la-metro-translations/issues/84) — `Make download link text unique per language`**
    * *Why solve*: Accessibility (WCAG) fix ensuring screen reader users know which translation language link they are clicking.
    * *Skills*: Django, HTML/templates, Accessibility.
  * **[#92](https://github.com/datamade/la-metro-translations/issues/92) — `Add tests for DocumentFiles API view`**
    * *Skills*: Python, pytest / Django REST Framework.

---

## 🚲 Honorary Civic Tech Spotlight: Bike Lane Uprising (BLU)
* **Website**: [bikelaneuprising.com](https://www.bikelaneuprising.com/)
* **Background**: Founded in Chicago by Christina Whiteley after a near-fatal bike lane crash, BLU is one of the most successful civic data advocacy projects in the US.
* **Civic Impact**: By mobilizing cyclists to submit crowdsourced photos of bike lane obstructions (delivery vehicles, utility work, illegal parking), BLU created structured GIS data that forced municipal accountability across 100+ cities and influenced protected bike lane infrastructure decisions.
* **Chi Hack Night Connection**: Featured at **Chi Hack Night (#277)** as a quintessential blueprint of how grassroots citizen data can shape urban policy.
