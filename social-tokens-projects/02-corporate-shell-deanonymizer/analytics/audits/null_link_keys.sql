AUDIT (
  name null_link_keys,
  blocking false
);

-- Rows with no sister-property grouping key. Expected for feeds whose
-- linker is 'bbl' or 'registration_contacts' (link_key null by design);
-- a spike elsewhere means a linker regression.
SELECT parcel_id, feed_id, jurisdiction_id
FROM @this_model
WHERE link_key IS NULL
