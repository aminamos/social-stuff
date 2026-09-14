import { CityAdapter } from "../../canonical";

/**
 * Buffalo, NY - Business Licenses (Socrata / SODA).
 * https://data.buffalony.gov/resource/qcyy-feh8.json
 *
 * Verified live: columns licenseno, businessname, address, licstatus, city,
 * state all present, and licstatus='Active' ordered by licenseno returns
 * rows. This is a general business-license file (music venues, fuel devices,
 * etc.), not a rental registry: there is no owner identity, no unit count,
 * and no parcel column, so apn maps to prclid (the city parcel id on the
 * license row) and linkage groups by the licensed business name.
 */
export const buffalo: CityAdapter = {
  feed: {
    id: "ny-buffalo-business-licenses",
    label: "Buffalo Business Licenses (Erie County)",
  },
  defaults: {
    jurisdictionId: "buffalo-ny",
    city: "Buffalo",
    county: "Erie",
    state: "NY",
  },
  source: {
    platform: "socrata",
    endpoint: "https://data.buffalony.gov/resource/qcyy-feh8.json",
    dataset: "qcyy-feh8",
    pageSize: 1000,
    where: "licstatus='Active'",
    orderBy: "licenseno",
  },
  fieldMap: {
    apn: "prclid",
    address: "address",
    city: "city",
    state: "state",
    applicant_name: "businessname",
    status: "licstatus",
  },
  severityMap: {},
  linker: "name",
  note: "General business licenses, not rental-specific; rental coverage is incidental. No owner identity or unit counts published, so linkage groups by the licensed business name.",
};
