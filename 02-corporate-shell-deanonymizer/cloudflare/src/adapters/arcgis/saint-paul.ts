import { CityAdapter } from "../../canonical";

/**
 * Saint Paul, MN - Certificate of Occupancy (Residential) (ArcGIS).
 *
 * Grade A/B/C is the city's habitability rating; Grade C maps to canonical
 * class C. The source publishes no owner, agent, or management email, so
 * sister-property linkage degrades to name matching until the Ramsey County
 * tax roll is added.
 */
export const saintPaul: CityAdapter = {
  feed: {
    id: "mn-ramsey-cofo",
    label: "Saint Paul Certificate of Occupancy (Ramsey County)",
  },
  defaults: {
    jurisdictionId: "saint-paul-mn",
    city: "Saint Paul",
    county: "Ramsey",
    state: "MN",
  },
  source: {
    platform: "arcgis",
    endpoint:
      "https://services1.arcgis.com/9meaaHE3uiba0zr8/arcgis/rest/services/Certificate_of_Occupancy_-_Residential/FeatureServer/0/query",
    dataset: "Certificate_of_Occupancy_-_Residential",
    pageSize: 2000,
    where: "1=1",
    orderBy: "OBJECTID",
  },
  fieldMap: {
    apn: "PIN",
    address: "ADDRESS",
    units: "UNITS",
    owner_name: "PROPNAME",
    applicant_name: "PRIMOCCTYPE",
    severity_raw: "GRADE",
    status: "STATUS",
  },
  severityMap: {
    A: "A",
    B: "B",
    C: "C",
  },
  severityLabelPrefix: "Grade ",
  linker: "email_or_owner_address",
  note: "No owner/agent contact fields published; linkage is name-only until the Ramsey County tax roll is added.",
};
