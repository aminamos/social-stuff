import { CityAdapter } from "../../canonical";

/**
 * Seattle, WA - Rental Property Registration (Socrata / SODA).
 * https://data.seattle.gov/resource/j2xh-c7vt.json
 *
 * Seattle publishes a registration but no owner of record and no habitability
 * rating. `propertycontactname` is the contact on the registration (a person or
 * a management company), which maps to the management field, not the owner.
 * Ownership requires the linked permit record at services.seattle.gov.
 */
export const seattle: CityAdapter = {
  feed: {
    id: "wa-king-rental-registration",
    label: "Seattle Rental Property Registration (King County)",
  },
  defaults: {
    jurisdictionId: "seattle-wa",
    city: "Seattle",
    county: "King",
    state: "WA",
  },
  source: {
    platform: "socrata",
    endpoint: "https://data.seattle.gov/resource/j2xh-c7vt.json",
    dataset: "j2xh-c7vt",
    pageSize: 1000,
    orderBy: ":id",
  },
  fieldMap: {
    apn: "permitnum",
    address: "originaladdress1",
    units: "rentalhousingunits",
    applicant_name: "propertycontactname",
    status: "statuscurrent",
  },
  severityMap: {},
  linker: "name",
  note: "Registration only: no owner identity and no habitability class published, so linkage groups by the registration contact name. Violations live in a separate dataset (ez4a-iug7) and are not yet ingested.",
};
