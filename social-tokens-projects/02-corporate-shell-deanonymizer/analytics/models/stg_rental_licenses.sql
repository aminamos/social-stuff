MODEL (
  name analytics.stg_rental_licenses,
  kind FULL,
  audits (
    not_null(columns = (parcel_id, feed_id, jurisdiction_id)),
    unique_values(columns = (parcel_id)),
    placeholder_owner_names,
    null_link_keys
  )
);

-- Canonical registry rows as exported from D1 (all_varchar on load).
SELECT
  parcel_id,
  apn,
  feed_id,
  jurisdiction_id,
  city,
  county,
  state,
  address,
  TRY_CAST(units AS INTEGER) AS units,
  owner_name,
  owner_address,
  owner_city,
  owner_state,
  owner_zip,
  owner_phone,
  owner_email,
  applicant_name,
  applicant_phone,
  applicant_email,
  severity_class,
  tier,
  status,
  link_key,
  synced_at
FROM raw.rental_licenses
