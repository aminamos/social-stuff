MODEL (
  name analytics.stg_violations,
  kind FULL,
  audits (
    not_null(columns = (feed_id, violation_id)),
    unique_combination_of_columns(columns = (feed_id, violation_id)),
    open_without_join_key
  )
);

SELECT
  feed_id,
  violation_id,
  join_key,
  violation_class,
  status,
  TRY_CAST(is_open AS INTEGER) AS is_open,
  address,
  boro,
  description,
  source_platform,
  source_dataset,
  synced_at
FROM raw.violations
