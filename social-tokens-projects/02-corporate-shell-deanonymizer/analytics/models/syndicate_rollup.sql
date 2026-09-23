MODEL (
  name analytics.syndicate_rollup,
  kind FULL,
  audits (
    syndicate_name_drift
  )
);

-- Per-link_key portfolio rollup: one row per sister-property group.
-- Violations pre-aggregate per join_key so units are not multiplied by
-- the join fan-out.
SELECT
  r.link_key,
  COUNT(DISTINCT r.parcel_id) AS properties,
  SUM(r.units) AS units,
  COUNT(DISTINCT r.jurisdiction_id) AS jurisdictions,
  COUNT(DISTINCT r.state) AS states,
  MIN(r.owner_name) AS sample_owner,
  COUNT(DISTINCT r.owner_name) AS owner_spellings,
  SUM(COALESCE(v.open_violations, 0)) AS open_violations,
  COUNT(v.join_key) AS parcels_with_open_violations
FROM analytics.stg_rental_licenses r
LEFT JOIN (
  SELECT join_key, COUNT(*) AS open_violations
  FROM analytics.stg_violations
  WHERE is_open = 1 AND join_key IS NOT NULL
  GROUP BY join_key
) v ON v.join_key = r.apn
WHERE r.link_key IS NOT NULL
GROUP BY r.link_key
HAVING COUNT(DISTINCT r.parcel_id) > 1
