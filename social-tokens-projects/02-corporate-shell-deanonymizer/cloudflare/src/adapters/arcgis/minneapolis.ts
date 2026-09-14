import { CityAdapter } from "../../canonical";

/**
 * Minneapolis, MN - City of Minneapolis Active Rental Licenses (ArcGIS).
 *
 * The layer is Minneapolis-only (it carries ward/neighborhood, not a city
 * field), so location falls back to the feed defaults. Tier 3 is the chronic
 * non-compliance band, mapped to canonical class C.
 */
export const minneapolis: CityAdapter = {
  feed: {
    id: "mn-hennepin-rental-licenses",
    label: "Minneapolis Active Rental Licenses (Hennepin County)",
  },
  defaults: {
    jurisdictionId: "minneapolis-mn",
    city: "Minneapolis",
    county: "Hennepin",
    state: "MN",
  },
  source: {
    platform: "arcgis",
    endpoint:
      "https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Active_Rental_Licenses/FeatureServer/0/query",
    dataset: "Active_Rental_Licenses",
    pageSize: 2000,
    where: "1=1",
    orderBy: "OBJECTID",
  },
  fieldMap: {
    apn: "apn",
    address: "address",
    units: "licensedUnits",
    owner_name: "ownerName",
    owner_address: "ownerAddress1",
    owner_city: "ownerCity",
    owner_state: "ownerState",
    owner_zip: "ownerZip",
    owner_phone: "ownerPhone",
    owner_email: "ownerEmail",
    applicant_name: "applicantName",
    applicant_phone: "applicantPhone",
    applicant_email: "applicantEmail",
    severity_raw: "tier",
    status: "status",
  },
  severityMap: {
    "Tier 1": "A",
    "Tier 2": "B",
    "Tier 3": "C",
  },
  linker: "email_or_owner_address",
  note: "Published daily. No owner identity beyond the licensing contact; county tax roll adds taxpayer names.",
};
