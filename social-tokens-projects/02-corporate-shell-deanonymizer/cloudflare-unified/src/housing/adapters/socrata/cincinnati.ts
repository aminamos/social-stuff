import { CityAdapter } from "../../canonical";

/**
 * Cincinnati, OH - Building inspections activity (Socrata / SODA).
 * https://data.cincinnati-oh.gov/resource/ivda-umw7.json
 *
 * Verified live: columns number_key, work_type, full_address, data_status,
 * status_class, entered_date all present; there are no owner, applicant,
 * parcel, or unit columns anywhere in the dataset metadata. This is an
 * inspections-activity log, not a rental registry, and it is included only
 * as an address-level signal: apn maps to number_key (the city case number,
 * not a parcel id, so parcel_id values from this feed do not join with any
 * tax roll) and status maps to status_class. Ordered by :id because the
 * uniqueid column is null on sampled rows.
 */
export const cincinnati: CityAdapter = {
  feed: {
    id: "oh-cincinnati-rental-inspections",
    label: "Cincinnati Building Inspections Activity (Hamilton County)",
  },
  defaults: {
    jurisdictionId: "cincinnati-oh",
    city: "Cincinnati",
    county: "Hamilton",
    state: "OH",
  },
  source: {
    platform: "socrata",
    endpoint: "https://data.cincinnati-oh.gov/resource/ivda-umw7.json",
    dataset: "ivda-umw7",
    pageSize: 1000,
    orderBy: ":id",
  },
  fieldMap: {
    apn: "number_key",
    address: "full_address",
    status: "status_class",
  },
  severityMap: {},
  linker: "email_or_owner_address",
  note: "Inspections log, not a registry: no owner, parcel, or unit data. apn holds the city case number, so parcel ids from this feed join with nothing; address-level signal only.",
};
