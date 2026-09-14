import { CityAdapter } from "../../canonical";

/**
 * Denver, CO - Short Term Rental Licenses, statewide file (Socrata / SODA).
 * https://data.colorado.gov/resource/f3vc-vat3.json
 *
 * Verified live: columns license, license_type, license_status, address,
 * parcel_number all present. Distinct license_status values are
 * 'License Issued - Active' (bulk of rows), 'Delinquent', 'Closed - Expired',
 * 'Closed - Administratively', and 'Closed - Surrendered', so the filter
 * keeps actives only. Address-only file: no owner, applicant, contact, unit,
 * or severity columns, so linkage has nothing to group on yet.
 */
export const denverStr: CityAdapter = {
  feed: {
    id: "co-denver-str-licenses",
    label: "Denver Short Term Rental Licenses (Denver County)",
  },
  defaults: {
    jurisdictionId: "denver-co",
    city: "Denver",
    county: "Denver",
    state: "CO",
  },
  source: {
    platform: "socrata",
    endpoint: "https://data.colorado.gov/resource/f3vc-vat3.json",
    dataset: "f3vc-vat3",
    pageSize: 1000,
    where: "license_status='License Issued - Active'",
    orderBy: ":id",
  },
  fieldMap: {
    apn: "parcel_number",
    address: "address",
    status: "license_status",
  },
  severityMap: {},
  linker: "email_or_owner_address",
  note: "Address-only STR file: no owner, applicant, contact, or unit columns published, so link keys cannot group properties until a contacts source is added.",
};
