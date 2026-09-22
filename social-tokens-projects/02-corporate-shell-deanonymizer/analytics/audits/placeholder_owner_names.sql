AUDIT (
  name placeholder_owner_names,
  blocking false
);

-- Owner fields that carry placeholders instead of entities (mirrors the
-- worker's NON_ENTITIES / GENERIC_TOKENS lists). Non-blocking: flagged
-- rows stay in the model, the warning reports how many.
SELECT parcel_id, feed_id, jurisdiction_id, owner_name
FROM @this_model
WHERE owner_name IS NULL
   OR lower(trim(owner_name)) IN (
     'n a', 'na', 'n/a', 'none', 'unknown', 'owner', 'owners', 'self',
     'dwelling units', 'apartment', 'apartments', 'building', 'property',
     'properties', 'management', 'same as owner', 'see above', 'tbd'
   )
