import { CityAdapter } from "../../canonical";

/**
 * Philadelphia, PA - Rental Licenses (CARTO SQL API v2).
 * https://phl.carto.com/api/v2/sql?q=SELECT * FROM business_licenses LIMIT 1
 *
 * Verified live: columns parcel_id_num, address, opa_owner,
 * business_mailing_address, ownercontact1name, numberofunits, licensestatus,
 * rentalcategory, licensetype, cartodb_id all present; the Rental + Active
 * filter returns rows. ownercontact1name is frequently null (the sample row
 * carries none), so linkage falls back to the business mailing address.
 * Owner mailing city/state/zip are embedded in the single
 * business_mailing_address string, not separate columns.
 */
export const philadelphia: CityAdapter = {
  feed: {
    id: "pa-philadelphia-rental-licenses",
    label: "Philadelphia Rental Licenses (Philadelphia County)",
  },
  defaults: {
    jurisdictionId: "philadelphia-pa",
    city: "Philadelphia",
    county: "Philadelphia",
    state: "PA",
  },
  source: {
    platform: "carto",
    endpoint: "https://phl.carto.com/api/v2/sql",
    dataset: "business_licenses",
    pageSize: 1000,
    where: "licensetype='Rental' AND licensestatus='Active'",
    orderBy: "cartodb_id",
  },
  fieldMap: {
    apn: "parcel_id_num",
    address: "address",
    owner_name: "opa_owner",
    owner_address: "business_mailing_address",
    applicant_name: "ownercontact1name",
    units: "numberofunits",
    status: "licensestatus",
    severity_raw: "rentalcategory",
  },
  severityMap: {},
  linker: "email_or_owner_address",
  note: "Rental licenses only. No violation severity published, so rentalcategory is stored raw. Owner contact name is often null; linkage falls back to the business mailing address.",
};
