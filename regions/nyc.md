# New York City (NYC)

New York City has the most sophisticated civic tech, open data, and municipal engineering ecosystem in the country. NYC Planning's Data Engineering and Planning Labs teams publish dozens of active open-source tools, while BetaNYC powers community municipal open data.

---

## 🟢 Highly Active Organizations with Open Issues

### 1. NYC Department of City Planning (`NYCPlanning`)
* **Focus**: Urban planning, land use, zoning apps, and data engineering pipelines powering applications used by millions of New Yorkers.
* **Primary Repos**:
  * [`NYCPlanning/data-engineering`](https://github.com/NYCPlanning/data-engineering)
  * [`NYCPlanning/equity-tool`](https://github.com/NYCPlanning/equity-tool)
  * [`NYCPlanning/ae-cp-map`](https://github.com/NYCPlanning/ae-cp-map)
  * [`NYCPlanning/labs-zola`](https://github.com/NYCPlanning/labs-zola)
* **Stack**: Python, Docker, PostGIS, TypeScript, React, Mapbox GL / MapLibre
* **Activity**: Daily commits and open PR triage in 2026.
* **Target Issues**:
  * **[#2627](https://github.com/NYCPlanning/data-engineering/issues/2627) — `minio client downloads return 410; drop mc or repoint the install`**
    * *Label*: `platform`
    * *Why solve*: S3/MinIO client URL update for dockerized ingest pipelines.
    * *Skills*: Bash, Docker, CI/CD.
  * **[#303](https://github.com/NYCPlanning/equity-tool/issues/303) — `react-map-gl deprecation warning`**
    * *Why solve*: Clean frontend fix removing deprecated props from the interactive mapping layer.
    * *Skills*: React, TypeScript, react-map-gl.
  * **[#559](https://github.com/NYCPlanning/ae-cp-map/issues/559) — `CPP Housing Growth - Display Housing Growth by Borough`**
    * *Why solve*: UI feature to display borough-level housing growth aggregation on the community portal.
    * *Skills*: React, Data visualization.

---

### 2. BetaNYC (`BetaNYC`)
* **Focus**: 501(c)(3) civic tech organization dedicated to NYC open data, community board tooling, and municipal transparency.
* **Primary Repos**:
  * [`BetaNYC/New-York-City-Budget`](https://github.com/BetaNYC/New-York-City-Budget)
  * [`BetaNYC/nyc-charter-laws-rules`](https://github.com/BetaNYC/nyc-charter-laws-rules)
  * [`BetaNYC/nyc-boundaries`](https://github.com/BetaNYC/nyc-boundaries)
* **Stack**: Python, SQLite, FastMCP / Model Context Protocol, Markdown, Leaflet
* **Activity**: Highly active in August–September 2026 with modern AI/MCP and budget data tooling.
* **Target Issues**:
  * **[#50](https://github.com/BetaNYC/New-York-City-Budget/issues/50) — `get_awards_by_ein still uses pre-1.3.1 ordering, so two award tools disagree on order`**
    * *Why solve*: Deterministic sorting discrepancy between two API query functions.
    * *Skills*: Python, SQLite.
  * **[#49](https://github.com/BetaNYC/New-York-City-Budget/issues/49) — `Truncated search results report page total as if full total — disclose true match count`**
    * *Why solve*: Standard pagination metadata bug fix.
    * *Skills*: Python.
  * **[#25](https://github.com/BetaNYC/nyc-charter-laws-rules/issues/25) — `Disclaimer footer repeats on every tool response; propose compact format`**
    * *Why solve*: Prompt context efficiency improvement for civic legal tools.
    * *Skills*: Python, MCP.

---

### 3. City of New York (`CityOfNewYork`)
* **Focus**: Official city repositories, including ACCESS NYC (benefits screener managed by the Mayor's Office for Economic Opportunity) and geospatial datasets.
* **Primary Repos**:
  * [`CityOfNewYork/ACCESS-NYC`](https://github.com/CityOfNewYork/ACCESS-NYC)
  * [`CityOfNewYork/nyc-geo-metadata`](https://github.com/CityOfNewYork/nyc-geo-metadata)
* **Stack**: PHP / WordPress (ACCESS NYC), Markdown, GeoJSON
* **Target Issues**:
  * **[#114](https://github.com/CityOfNewYork/nyc-geo-metadata/issues/114) — `Consider Documenting Address Point ZIP Code Details`**
    * *Label*: `help wanted`
    * *Skills*: Documentation, municipal GIS metadata.
  * **[#55](https://github.com/CityOfNewYork/nyc-geo-metadata/issues/55) — `make all links relative`**
    * *Label*: `enhancement`
    * *Skills*: Markdown formatting, documentation links.
