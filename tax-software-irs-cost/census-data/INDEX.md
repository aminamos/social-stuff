# Census Geography Reference — States, Counties, County Subdivisions

Pulled 2026-09-16 from census.gov geography reference files (the authoritative lists behind www.census.gov/library/publications.html geography products).

## Clean outputs (use these)

| File | Rows | Contents |
|---|---|---|
| `states.csv` / `states.json` | 57 | 50 states + DC + PR + island areas: abbr, FIPS, name, GNIS ID |
| `counties.csv` / `counties.json` | 3,235 | Every county/county-equivalent: state abbr+name, state FIPS, county FIPS, 5-digit GEOID, county name, class code |
| `mn-counties.csv` | 87 | Minnesota counties only (subset of counties.csv) |

## Raw Census files (as downloaded)

- `state.txt` — pipe-delimited state list (`STATE|STUSAB|STATE_NAME|STATENS`)
- `national_county.txt` — county FIPS codes list (`STUSAB,STATEFP,COUNTYFP,COUNTYNAME,CLASSFP`)
- `national_cousub.txt` — 36,643 county subdivisions (townships, precincts, CCDs — relevant for MN property-tax/local context)
- `2025_Gaz_state_national.txt` — Gazetteer: state land/water area + internal point lat/long
- `2025_Gaz_counties_national.txt` — Gazetteer: same per county (incl. `GEOIDFQ` fully-qualified GEOID)

## Sources

- https://www2.census.gov/geo/docs/reference/codes/files/ (FIPS code lists)
- https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/ (2025 Gazetteer)

## Notes

- County *equivalents* included: parishes (LA), boroughs/census areas (AK), independent cities, PR municipios, island-area equivalents.
- No population figures — Gazetteer carries area + centroid only. For population/demographics use ACS or the Census API (api.census.gov).
- Class code `H1` = active county; others (H4–H9) are legal/statistical equivalents.
