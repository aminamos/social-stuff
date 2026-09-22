AUDIT (
  name syndicate_name_drift,
  blocking false
);

-- Sister-property groups whose members publish more than one owner_name
-- spelling. Legitimate for DBA chains; a high count suggests link_key is
-- grouping unrelated entities (e.g. a shared registered-agent address).
SELECT link_key, properties, owner_spellings, sample_owner
FROM @this_model
WHERE owner_spellings > 1
