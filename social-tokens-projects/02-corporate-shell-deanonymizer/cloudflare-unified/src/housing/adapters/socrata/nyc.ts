import { CityAdapter, toBBL } from "../../canonical";

/**
 * New York, NY - HPD Multiple Dwelling Registrations (Socrata / SODA).
 * https://data.cityofnewyork.us/resource/tesw-yqqr.json
 *
 * The registration publishes no BBL column and no owner identity, so the
 * parcel key is derived: BBL = boroid digit + block (5-padded) + lot
 * (4-padded). boroid codes 1 MANHATTAN, 2 BRONX, 3 BROOKLYN, 4 QUEENS,
 * 5 STATEN ISLAND. Owner identity comes from the HPD Registration
 * Contacts dataset (feu5-w2e2) joined on registrationid:
 * scripts/nyc-owner-enrich.py backfills owner_* columns and link_key
 * onto these rows (re-run after any full feed reset, since re-sync
 * rewrites owner_name/link_key to null). Parcel joins use apn equality
 * (parcelJoin bbl) against violations.join_key.
 */
export const nyc: CityAdapter = {
  feed: {
    id: "ny-hpd-registration",
    label: "NYC HPD Multiple Dwelling Registrations",
  },
  defaults: {
    jurisdictionId: "new-york-ny",
    city: "New York",
    county: "New York",
    state: "NY",
  },
  source: {
    platform: "socrata",
    endpoint: "https://data.cityofnewyork.us/resource/tesw-yqqr.json",
    dataset: "tesw-yqqr",
    pageSize: 1000,
    orderBy: ":id",
  },
  fieldMap: {
    city: "boro",
    status: "registrationenddate",
  },
  severityMap: {},
  linker: "registration_contacts",
  parcelJoin: "bbl",
  computeApn: (row) => toBBL(row["boroid"], row["block"], row["lot"]),
  computeAddress: (row) => {
    const house = String(row["housenumber"] ?? "").trim();
    const street = String(row["streetname"] ?? "").trim();
    return [house, street].filter(Boolean).join(" ");
  },
  note: "Registration only: no owner identity published (backfilled from feu5-w2e2 contacts via scripts/nyc-owner-enrich.py), no BBL column (derived from boroid/block/lot). Violations live in wvxf-dwi5 and join on BBL.",
};
