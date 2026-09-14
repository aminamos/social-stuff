import { CityAdapter, toBBL } from "../../canonical";

/**
 * New York, NY - HPD Multiple Dwelling Registrations (Socrata / SODA).
 * https://data.cityofnewyork.us/resource/tesw-yqqr.json
 *
 * The registration publishes no BBL column and no owner identity, so the
 * parcel key is derived: BBL = boroid digit + block (5-padded) + lot
 * (4-padded). boroid codes 1 MANHATTAN, 2 BRONX, 3 BROOKLYN, 4 QUEENS,
 * 5 STATEN ISLAND. Sister-property linkage waits on the separate contacts
 * dataset, so linker is registration_contacts (link_key null) and parcel
 * joins use apn equality (parcelJoin bbl) against violations.join_key.
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
  note: "Registration only: no owner identity published, no BBL column (derived from boroid/block/lot). Violations live in wvxf-dwi5 and join on BBL.",
};
