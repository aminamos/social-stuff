# Minnesota (Twin Cities Metro & State)

Minnesota has a rich ecosystem of civic tech, cultural institutions, and public agencies. However, grassroots volunteer groups like Open Twin Cities and TCMAP have largely gone dormant or sunsetted, while official public sector and museum organizations remain actively maintained.

---

## 🟢 Highly Active Organizations with Open Issues

### 1. Hennepin County Digital Services (`HennepinCounty`)
* **Focus**: Accessible digital public services for the largest county in MN (Minneapolis + suburbs).
* **Primary Repo**: [`HennepinCounty/ed-hcds-components`](https://github.com/HennepinCounty/ed-hcds-components)
* **Stack**: HTML, SCSS, CSS, Vanilla JavaScript
* **Activity**: Multiple commits and issues in 2025–2026. Very active triage.
* **Target Issues**:
  * **[#66](https://github.com/HennepinCounty/ed-hcds-components/issues/66) — `[header] [search] Add button to header search component, remove placeholder text`**
    * *Why solve*: Usability testing on mobile identified need for an explicit search button.
    * *Skills*: SCSS, responsive HTML layout.
  * **[#59](https://github.com/HennepinCounty/ed-hcds-components/issues/59) — `Create focus state for <a> hyperlink elements`** 🔄 *In review*
    * *Status*: [PR #69](https://github.com/HennepinCounty/ed-hcds-components/pull/69) open (also addresses [#57](https://github.com/HennepinCounty/ed-hcds-components/issues/57)).
    * *Why solve*: Adds custom, accessible `:focus` ring styling to links instead of browser defaults.
    * *Skills*: CSS / Accessibility (WCAG 2.1 Focus Visible).
  * **[#58](https://github.com/HennepinCounty/ed-hcds-components/issues/58) — `Create link styling for links on dark background`**
    * *Skills*: CSS contrast & accessibility.
  * **[#61](https://github.com/HennepinCounty/ed-hcds-components/issues/61) — `Add utility classes for controlling gap in Flex and Grid`**
    * *Skills*: Modern CSS utilities.

---

### 2. Minneapolis Institute of Art (`artsmia`)
* **Focus**: 501(c)(3) public fine arts museum in Minneapolis with renowned open access APIs and collection tools.
* **Primary Repos**: [`artsmia/collection-elasticsearch`](https://github.com/artsmia/collection-elasticsearch), [`artsmia/collection`](https://github.com/artsmia/collection)
* **Stack**: Python, Elasticsearch, JSON REST APIs
* **Activity**: Active collection API updates in 2026.
* **Target Issues**:
  * **[#10](https://github.com/artsmia/collection-elasticsearch/issues/10) — `Records flagged image: valid whose image renditions return 403 on all sizes`**
    * *Why solve*: Integrators building digital frames and public displays hit 403 errors on certain public domain artwork IDs.
    * *Skills*: Python, Elasticsearch queries, API verification.
  * **[#10](https://github.com/artsmia/collection/issues/10) — `broken link for image rights`**
    * *Skills*: Markdown / link verification.

---

### 3. University of Minnesota Libraries / Mapping Prejudice (`UMNLibraries`)
* **Focus**: Civic data pipelines, digital scholarship, and racial deed covenant mapping across Minnesota counties.
* **Primary Repos**: [`UMNLibraries/racial_covenants_processor`](https://github.com/UMNLibraries/racial_covenants_processor), [`UMNLibraries/cdm-blacklightify`](https://github.com/UMNLibraries/cdm-blacklightify)
* **Stack**: Python, Django, PostgreSQL/GIS; Ruby on Rails (Blacklight)
* **Target Issues**:
  * **[#151](https://github.com/UMNLibraries/racial_covenants_processor/issues/151) — `Can covenantedparcel counts include new child workflows?`**
    * *Why solve*: Counties like Stearns have multiple record types (Torrens vs. Abstract) that need aggregate parcel count rollups on summary views.
    * *Skills*: Python, Django models/views.
  * **[#156](https://github.com/UMNLibraries/cdm-blacklightify/issues/156) — `Date Created facet date format`**
    * *Skills*: Ruby / Blacklight UI.

---

### 4. Science Museum of Minnesota (`scimusmn`)
* **Focus**: 501(c)(3) museum in Saint Paul creating open interactive exhibits, hardware kiosks, and educational tools.
* **Primary Repos**: [`scimusmn/laparoscopy-camera`](https://github.com/scimusmn/laparoscopy-camera), [`scimusmn/smm-create-app`](https://github.com/scimusmn/smm-create-app)
* **Stack**: C++, Arduino, Node.js
* **Target Issues**:
  * **[#5](https://github.com/scimusmn/laparoscopy-camera/issues/5) — `digitalRead should be inverted`**
    * *Why solve*: Direct one-line fix: hardware pull-up inverted logic (`if (!digitalRead(button_pin))`).
    * *Skills*: Arduino C++.

---

### 5. Northern Widget (`NorthernWidget`)
* **Focus**: Saint Paul-based open-source environmental datalogging and community science hardware/firmware.
* **Primary Repos**: [`NorthernWidget/Margay_Library`](https://github.com/NorthernWidget/Margay_Library), [`NorthernWidget/Project-Margay`](https://github.com/NorthernWidget/Project-Margay)
* **Stack**: C++, Arduino, KiCad, Jekyll, GitHub Actions
* **Activity**: Highly active in 2026.
* **Target Issues**:
  * **[#28](https://github.com/NorthernWidget/Margay_Library/issues/28) — `Add GitHub Pages API documentation (following Apis_Library pattern)`**
    * *Why solve*: Fully scoped task to add Doxygen + Jekyll GitHub Pages deployment pipeline.
    * *Skills*: Jekyll, Doxygen, CI workflows.

---

### 6. MinnPost (`MinnPost`)
* **Focus**: 501(c)(3) nonprofit public-interest newsroom in Minneapolis.
* **Primary Repo**: [`MinnPost/object-sync-for-salesforce`](https://github.com/MinnPost/object-sync-for-salesforce)
* **Stack**: PHP, WordPress, Salesforce API
* **Target Issues**:
  * **[#554](https://github.com/MinnPost/object-sync-for-salesforce/issues/554) — `Documentation bug: Important information omitted from initial setup instructions`**
  * **[#546](https://github.com/MinnPost/object-sync-for-salesforce/issues/546) — `Be able to edit mapping errors messages`**

---

## ⚠️ Dormant / Sunsetted Groups in Minnesota

* **Open Twin Cities (`OpenTwinCities`)**: Activity ceased around 2021–2022. Repositories like `adopt-a-tree` and `mnpay` are effectively unmaintained.
* **Twin Cities Maker (`tcmaker`)**: The Hack Factory community workshop codebases (`clubhouse`, `tcmaker-theme`) have not seen commits since late 2022.
* **Twin Cities Mutual Aid Project (`Twin-Cities-Mutual-Aid`)**: Officially sunsetted; all primary repositories are marked read-only and archived.
* **Minnesota Explained (`minnesotaexplained`)**: Codebase is updated, but no public issue tracker is maintained.
