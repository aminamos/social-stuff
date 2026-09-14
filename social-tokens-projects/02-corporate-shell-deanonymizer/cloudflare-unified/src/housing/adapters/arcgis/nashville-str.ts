import { CityAdapter } from "../../canonical";

/**
 * Nashville, TN - Residential Short Term Rental Permits (ArcGIS view).
 * https://services2.arcgis.com/HdTo6HJqh92wn4D8/arcgis/rest/services/Residential_Short_Term_Rental_Permits_view/FeatureServer/0
 *
 * Field list and a paged query verified live against the layer: Permit_,
 * Permit_Owner_Name, Permit_Owner_Addr1/City/State/Zip, Parcel, Permit_Status,
 * Address, City, State, Applicant, and ObjectId all present. STR permits
 * only, not the long-term rental stock. Endpoint carries the /query suffix
 * per the platform client, as in minneapolis.ts.
 */
export const nashvilleStr: CityAdapter = {
  feed: {
    id: "tn-nashville-str-permits",
    label: "Nashville Short Term Rental Permits (Davidson County)",
  },
  defaults: {
    jurisdictionId: "nashville-tn",
    city: "Nashville",
    county: "Davidson",
    state: "TN",
  },
  source: {
    platform: "arcgis",
    endpoint:
      "https://services2.arcgis.com/HdTo6HJqh92wn4D8/arcgis/rest/services/Residential_Short_Term_Rental_Permits_view/FeatureServer/0/query",
    dataset: "Residential_Short_Term_Rental_Permits_view",
    pageSize: 1000,
    where: "1=1",
    orderBy: "ObjectId",
  },
  fieldMap: {
    apn: "Parcel",
    address: "Address",
    city: "City",
    state: "State",
    owner_name: "Permit_Owner_Name",
    owner_address: "Permit_Owner_Addr1",
    owner_city: "Permit_Owner_City",
    owner_state: "Permit_Owner_State",
    owner_zip: "Permit_Owner_Zip",
    applicant_name: "Applicant",
    status: "Permit_Status",
  },
  severityMap: {},
  linker: "email_or_owner_address",
  note: "Short term rental permits only; long-term rentals are not in this file. No unit counts or habitability class published.",
};
