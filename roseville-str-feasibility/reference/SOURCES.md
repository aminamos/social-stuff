# Source documents — Roseville, MN rental code

The legal basis for the engine, archived in two places:

1. **This directory** — extracted `.txt` files (greppable) + original binaries.
2. **Cloudflare R2** (`roseville-str-docs` bucket) — same documents, served by
   the worker at `GET /docs/<key>`; registry queryable at `GET /api/sources`.

| File | Source | Fetched | What it establishes |
|---|---|---|---|
| `ordinance-1657-ch909-2024.docx` / `.txt` | [DocumentCenter/View/36287](https://www.cityofroseville.com/DocumentCenter/View/36287) | 2026-09-15 | **Current Ch. 909** — 500-ft spacing (909.03.B), 300-ft neighbor notice (909.07.C), 7/10-day frequency caps (909.02), exemptions (909.08), license non-transfer (909.06.C), 90-day unlicensed penalty (909.06.F) |
| `ordinance-1596-ch909-2021.pdf` / `.txt` | [DocumentCenter/View/31343](https://www.cityofroseville.com/DocumentCenter/View/31343) | 2026-09-15 | Original Ch. 909 creation (2021) — superseded in part by Ord. 1657 |
| `lodging-tax-return-form.pdf` / `.txt` | [DocumentCenter/View/35573](http://www.ci.roseville.mn.us/DocumentCenter/View/35573) | 2026-09-15 | **3% lodging tax** on rentals <30 days, monthly return (Ch. 312; referenced by 909.05.B) |
| `ch907-rental-registration-brochure.pdf` / `.txt` | [DocumentCenter/View/29076](http://www.cityofroseville.com/DocumentCenter/View/29076) | 2026-09-15 | Ch. 907 registration scope: SFH, duplex, triplex, fourplex, townhome, twinhome, condo; >4 units → Ch. 908 license via Fire Dept |

## Other authorities cited (not archived)

- **Ch. 907/908** full text: [Municode](https://library.municode.com/mn/roseville/codes/code_of_ordinances)
- **Fee Schedule §314.05 / Appendix A**: STR license $540/yr, rental registration $43–45/unit — verify current amounts on the city site before relying on them
- **Ch. 317** lodging / extended-stay license (alternative for >30-day stays)
- **Roseville STR program page**: [cityofroseville.com/3581/Short-Term-Rentals](https://www.cityofroseville.com/3581/Short-Term-Rentals)
- **Licensed-STR search** (for the 500-ft check): [Accela Citizen Access](https://aca-prod.accela.com/ROSEVILLE_MN/Cap/CapHome.aspx?module=Licenses) → record type "Short-Term Rental License"
- **Ramsey County parcel data**: [OpenData FeatureServer layer 12](https://maps.co.ramsey.mn.us/arcgis/rest/services/OpenData/OpenData/FeatureServer/12)
- **County geocoder**: [LOC_Locator_Composite](https://gis.ramseycountymn.gov/server/rest/services/Geolocator/LOC_Locator_Composite/GeocodeServer)
