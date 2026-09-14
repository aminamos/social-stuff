import { CityAdapter } from "../../canonical";

/**
 * San Francisco, CA - Business Registry, lessors of real estate (Socrata).
 * https://data.sf.gov/resource/g8m3-pdis.json
 *
 * Column list and filter verified live against the dataset metadata. Two
 * corrections from the draft: administratively_closed is TEXT (either
 * "***Administratively Closed" or null), so `=false` is a SoQL type error
 * and the filter uses `is null` instead; mailing_address_1 exists and maps
 * to the owner address. NAICS 5311 is self-reported lessors of real estate,
 * a rental proxy rather than a rental registry: it includes owner-occupied
 * small landlords and misses unregistered rentals.
 */
export const sanFrancisco: CityAdapter = {
  feed: {
    id: "ca-sf-business-registry",
    label: "San Francisco Business Registry, Lessors of Real Estate (San Francisco County)",
  },
  defaults: {
    jurisdictionId: "san-francisco-ca",
    city: "San Francisco",
    county: "San Francisco",
    state: "CA",
  },
  source: {
    platform: "socrata",
    endpoint: "https://data.sf.gov/resource/g8m3-pdis.json",
    dataset: "g8m3-pdis",
    pageSize: 1000,
    where: "self_reported_naics_code like '5311%' AND location_end_date is null AND administratively_closed is null",
    orderBy: ":id",
  },
  fieldMap: {
    apn: "uniqueid",
    address: "full_business_address",
    owner_name: "ownership_name",
    owner_address: "mailing_address_1",
    owner_city: "mail_city",
    owner_state: "mail_state",
    owner_zip: "mail_zipcode",
    applicant_name: "dba_name",
  },
  severityMap: {},
  linker: "email_or_owner_address",
  note: "Rental proxy, not a registry: NAICS 5311 is self-reported, so coverage skews toward filers. No unit counts and no habitability class published.",
};
