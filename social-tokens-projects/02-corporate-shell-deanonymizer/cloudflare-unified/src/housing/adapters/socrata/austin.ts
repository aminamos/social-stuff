import { CityAdapter } from "../../canonical";

/**
 * Austin, TX - Rental Registration (Socrata / SODA).
 * https://datahub.austintexas.gov/resource/5yf8-fm7j.json
 *
 * Verified live: columns registrationnumber, registrationstatus,
 * registeredaddress, registeredunits, parcelid, city, state, zipcode all
 * present, and registrationstatus='Active' ordered by registrationnumber
 * returns rows. The registration publishes no owner identity and no
 * habitability class; owner names arrive via the sister deficiencies feed
 * (tx-austin-rental-deficiencies), so linkage stays pending until that feed
 * is ingested.
 */
export const austinRegistration: CityAdapter = {
  feed: {
    id: "tx-austin-rental-registration",
    label: "Austin Rental Registration (Travis County)",
  },
  defaults: {
    jurisdictionId: "austin-tx",
    city: "Austin",
    county: "Travis",
    state: "TX",
  },
  source: {
    platform: "socrata",
    endpoint: "https://datahub.austintexas.gov/resource/5yf8-fm7j.json",
    dataset: "5yf8-fm7j",
    pageSize: 1000,
    where: "registrationstatus='Active'",
    orderBy: "registrationnumber",
  },
  fieldMap: {
    apn: "parcelid",
    address: "registeredaddress",
    city: "city",
    state: "state",
    owner_zip: "zipcode",
    units: "registeredunits",
    status: "registrationstatus",
  },
  severityMap: {},
  linker: "registration_contacts",
  note: "Registration only: no owner identity and no habitability class published. Owner names come from the deficiencies feed, so link_key stays null until that dataset is ingested.",
};

/**
 * Austin, TX - Rental Deficiencies (Socrata / SODA).
 * https://datahub.austintexas.gov/resource/ge82-ij4h.json
 *
 * Verified live: columns registrationnumber, registrationstatus,
 * registeredaddress, owner, deficiencycategory, deficiencystatus, parcelid
 * all present, and ordering by registrationnumber works. One row per
 * deficiency, so a property appears once per open/cleared item; the ingestor
 * upserts on parcel id. deficiencystatus is stored as the status and
 * deficiencycategory as the raw tier; neither maps to a canonical class.
 */
export const austinDeficiencies: CityAdapter = {
  feed: {
    id: "tx-austin-rental-deficiencies",
    label: "Austin Rental Deficiencies (Travis County)",
  },
  defaults: {
    jurisdictionId: "austin-tx",
    city: "Austin",
    county: "Travis",
    state: "TX",
  },
  source: {
    platform: "socrata",
    endpoint: "https://datahub.austintexas.gov/resource/ge82-ij4h.json",
    dataset: "ge82-ij4h",
    pageSize: 1000,
    orderBy: "registrationnumber",
  },
  fieldMap: {
    apn: "parcelid",
    address: "registeredaddress",
    city: "city",
    owner_name: "owner",
    status: "deficiencystatus",
    severity_raw: "deficiencycategory",
  },
  severityMap: {},
  linker: "name",
  note: "One row per deficiency (cleared and open alike), keyed to the registration by registrationnumber. Linkage groups by the owner name on the deficiency record.",
};
