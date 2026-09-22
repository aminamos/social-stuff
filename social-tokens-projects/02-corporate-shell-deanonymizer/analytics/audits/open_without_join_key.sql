AUDIT (
  name open_without_join_key,
  blocking false
);

-- Open violations that can never join the registry on apn equality.
-- Expected for address-join-only feeds (Phoenix, Seattle, Chicago); a
-- spike in a parcel-join feed (NYC BBL, Charlotte ParcelId) means the
-- join_key mapping regressed.
SELECT feed_id, violation_id, status
FROM @this_model
WHERE is_open = 1 AND join_key IS NULL
