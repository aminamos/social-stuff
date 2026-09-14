# Seattle & Puget Sound Metro

Seattle is a major hub for open transit software, regional environmental planning, and record-clearing social justice initiatives.

---

## 🟢 Highly Active Organizations with Open Issues

### 1. OneBusAway (`OneBusAway`)
* **Focus**: The world's leading open-source transit information platform, originally developed at the University of Washington in Seattle. Used by thousands of daily transit riders across King County Metro and Sound Transit.
* **Primary Repos**:
  * [`OneBusAway/watchdog`](https://github.com/OneBusAway/watchdog)
  * [`OneBusAway/onebusaway-ios`](https://github.com/OneBusAway/onebusaway-ios)
  * [`OneBusAway/onebusaway-android`](https://github.com/OneBusAway/onebusaway-android)
  * [`OneBusAway/maglev`](https://github.com/OneBusAway/maglev)
* **Stack**: Swift/SwiftUI, Kotlin/Java, TypeScript, Python
* **Activity**: Extremely active daily commits and issue triage in 2026.
* **Target Issues**:
  * **[#147](https://github.com/OneBusAway/watchdog/issues/147) — `Handle GTFS stop coordinate precision changes without treating them as relocations`**
    * *Label*: `good first issue`
    * *Why solve*: Minor floating point precision rounding in transit feed updates erroneously triggers stop relocation logic.
    * *Skills*: Python, GTFS transit data.
  * **[#1412](https://github.com/OneBusAway/onebusaway-ios/issues/1412) — `VoiceOver says "Map type" for the button that opens the whole Map settings sheet`**
    * *Label*: `Accessibility`, `Bug`
    * *Why solve*: Accessibility bug where screen readers mislabel the settings trigger button on the main map.
    * *Skills*: iOS, SwiftUI, Accessibility / VoiceOver.
  * **[#2301](https://github.com/OneBusAway/onebusaway-android/issues/2301) — `Show a banner when OBA realtime predictions are unavailable`**
    * *Why solve*: Clear user feedback when agencies temporarily degrade from real-time vehicle positions to scheduled estimates.
    * *Skills*: Android, Kotlin.

---

### 2. Puget Sound Regional Council (`psrc`)
* **Focus**: Regional planning and civic data agency for King, Pierce, Snohomish, and Kitsap counties. Maintains open modeling and GIS scripts for housing, transit, and land use policy.
* **Primary Repos**:
  * [`psrc/future_land_use`](https://github.com/psrc/future_land_use)
  * [`psrc/network_builder`](https://github.com/psrc/network_builder)
  * [`psrc/soundcast`](https://github.com/psrc/soundcast)
* **Stack**: Python, GeoPandas, GIS, Jupyter
* **Activity**: Active updates throughout 2026 implementing Washington HB 1110 (middle housing law).
* **Target Issues**:
  * **[#3](https://github.com/psrc/future_land_use/issues/3) — `Fully wire hb_1110_stops.py as a step`**
    * *Why solve*: Pipeline step wiring for transit stop walksheds under Washington's missing-middle housing reform law.
    * *Skills*: Python, GIS / GeoPandas.
  * **[#65](https://github.com/psrc/network_builder/issues/65) — `Set default transit speeds to 25 mph`**
    * *Why solve*: Quick parameter update for regional transit network calculations.
    * *Skills*: Python.
  * **[#64](https://github.com/psrc/network_builder/issues/64) — `Shift hard-coded rail/ferry travel times from the 'Processing' field to a new dedicated time field`**
    * *Skills*: Python, data modeling.

---

### 3. Clearviction (`clearviction-devs`)
* **Focus**: Seattle-based 501(c)(3) nonprofit creating open-source tools to help formerly incarcerated individuals vacate eligible convictions in Washington state.
* **Primary Repo**: [`clearviction-devs/clearviction-wa`](https://github.com/clearviction-devs/clearviction-wa)
* **Stack**: TypeScript, React, Next.js, Sanity CMS
* **Activity**: Eligibility calculator codebase for King County & Washington courts.

---

## ⚠️ Dormant Groups in Seattle

* **Open Seattle (`openseattle`)**: Most historical repositories (`clearviction-v1`, `seattlespeeds`, `openseattle.github.io`) are archived. Active civic projects have moved directly to independent non-profit orgs (like Clearviction or OneBusAway).
