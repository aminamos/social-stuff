-- Bug 1: split legacy fused email entities onto their first email
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:clifton8445@gmail.com', display_name, normalized_name, entity_kind, 'gmail.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:clifton8445@gmail.com; clifton.llc.8445@gmail.com';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:clifton8445@gmail.com' WHERE entity_id = 'email:clifton8445@gmail.com; clifton.llc.8445@gmail.com';
DELETE FROM owner_entity_links WHERE entity_id = 'email:clifton8445@gmail.com; clifton.llc.8445@gmail.com';
UPDATE rental_licenses SET link_key = 'email:clifton8445@gmail.com' WHERE link_key = 'email:clifton8445@gmail.com; clifton.llc.8445@gmail.com';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:clifton8445@gmail.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:clifton8445@gmail.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:clifton8445@gmail.com';
DELETE FROM owner_entities WHERE entity_id = 'email:clifton8445@gmail.com; clifton.llc.8445@gmail.com';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:minnesota@rentpure.com', display_name, normalized_name, entity_kind, 'rentpure.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:minnesota@rentpure.com; mmohanlall@rentpure.com';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:minnesota@rentpure.com' WHERE entity_id = 'email:minnesota@rentpure.com; mmohanlall@rentpure.com';
DELETE FROM owner_entity_links WHERE entity_id = 'email:minnesota@rentpure.com; mmohanlall@rentpure.com';
UPDATE rental_licenses SET link_key = 'email:minnesota@rentpure.com' WHERE link_key = 'email:minnesota@rentpure.com; mmohanlall@rentpure.com';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:minnesota@rentpure.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:minnesota@rentpure.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:minnesota@rentpure.com';
DELETE FROM owner_entities WHERE entity_id = 'email:minnesota@rentpure.com; mmohanlall@rentpure.com';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:samirproperties@msn.com', display_name, normalized_name, entity_kind, 'msn.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:samirproperties@msn.com; info@samirpropertiesmn.co';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:samirproperties@msn.com' WHERE entity_id = 'email:samirproperties@msn.com; info@samirpropertiesmn.co';
DELETE FROM owner_entity_links WHERE entity_id = 'email:samirproperties@msn.com; info@samirpropertiesmn.co';
UPDATE rental_licenses SET link_key = 'email:samirproperties@msn.com' WHERE link_key = 'email:samirproperties@msn.com; info@samirpropertiesmn.co';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:samirproperties@msn.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:samirproperties@msn.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:samirproperties@msn.com';
DELETE FROM owner_entities WHERE entity_id = 'email:samirproperties@msn.com; info@samirpropertiesmn.co';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:cg@mydmco.com', display_name, normalized_name, entity_kind, 'mydmco.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:cg@mydmco.com; minneapolis@mydmco.com';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:cg@mydmco.com' WHERE entity_id = 'email:cg@mydmco.com; minneapolis@mydmco.com';
DELETE FROM owner_entity_links WHERE entity_id = 'email:cg@mydmco.com; minneapolis@mydmco.com';
UPDATE rental_licenses SET link_key = 'email:cg@mydmco.com' WHERE link_key = 'email:cg@mydmco.com; minneapolis@mydmco.com';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:cg@mydmco.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:cg@mydmco.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:cg@mydmco.com';
DELETE FROM owner_entities WHERE entity_id = 'email:cg@mydmco.com; minneapolis@mydmco.com';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:neile@mhsapartments.com', display_name, normalized_name, entity_kind, 'mhsapartments.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:neile@mhsapartments.com; rda@mhsapartments.com';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:neile@mhsapartments.com' WHERE entity_id = 'email:neile@mhsapartments.com; rda@mhsapartments.com';
DELETE FROM owner_entity_links WHERE entity_id = 'email:neile@mhsapartments.com; rda@mhsapartments.com';
UPDATE rental_licenses SET link_key = 'email:neile@mhsapartments.com' WHERE link_key = 'email:neile@mhsapartments.com; rda@mhsapartments.com';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:neile@mhsapartments.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:neile@mhsapartments.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:neile@mhsapartments.com';
DELETE FROM owner_entities WHERE entity_id = 'email:neile@mhsapartments.com; rda@mhsapartments.com';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:eaguda@lifewaycare.com', display_name, normalized_name, entity_kind, 'lifewaycare.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:eaguda@lifewaycare.com; zoe.langford@lifewaycare.c';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:eaguda@lifewaycare.com' WHERE entity_id = 'email:eaguda@lifewaycare.com; zoe.langford@lifewaycare.c';
DELETE FROM owner_entity_links WHERE entity_id = 'email:eaguda@lifewaycare.com; zoe.langford@lifewaycare.c';
UPDATE rental_licenses SET link_key = 'email:eaguda@lifewaycare.com' WHERE link_key = 'email:eaguda@lifewaycare.com; zoe.langford@lifewaycare.c';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:eaguda@lifewaycare.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:eaguda@lifewaycare.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:eaguda@lifewaycare.com';
DELETE FROM owner_entities WHERE entity_id = 'email:eaguda@lifewaycare.com; zoe.langford@lifewaycare.c';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:pwmitchell1@gmail.com', display_name, normalized_name, entity_kind, 'gmail.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:pwmitchell1@gmail.com; mr.p.w.mitchell@gmail.com';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:pwmitchell1@gmail.com' WHERE entity_id = 'email:pwmitchell1@gmail.com; mr.p.w.mitchell@gmail.com';
DELETE FROM owner_entity_links WHERE entity_id = 'email:pwmitchell1@gmail.com; mr.p.w.mitchell@gmail.com';
UPDATE rental_licenses SET link_key = 'email:pwmitchell1@gmail.com' WHERE link_key = 'email:pwmitchell1@gmail.com; mr.p.w.mitchell@gmail.com';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:pwmitchell1@gmail.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:pwmitchell1@gmail.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:pwmitchell1@gmail.com';
DELETE FROM owner_entities WHERE entity_id = 'email:pwmitchell1@gmail.com; mr.p.w.mitchell@gmail.com';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:lruss@aeon.org', display_name, normalized_name, entity_kind, 'aeon.org', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:lruss@aeon.org; bsoukup@aeon.org; assetmgmt@aeon.o';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:lruss@aeon.org' WHERE entity_id = 'email:lruss@aeon.org; bsoukup@aeon.org; assetmgmt@aeon.o';
DELETE FROM owner_entity_links WHERE entity_id = 'email:lruss@aeon.org; bsoukup@aeon.org; assetmgmt@aeon.o';
UPDATE rental_licenses SET link_key = 'email:lruss@aeon.org' WHERE link_key = 'email:lruss@aeon.org; bsoukup@aeon.org; assetmgmt@aeon.o';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:lruss@aeon.org'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:lruss@aeon.org'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:lruss@aeon.org';
DELETE FROM owner_entities WHERE entity_id = 'email:lruss@aeon.org; bsoukup@aeon.org; assetmgmt@aeon.o';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:darcywestund@gmail.com', display_name, normalized_name, entity_kind, 'gmail.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:darcywestund@gmail.com; dwestlind@aol.com';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:darcywestund@gmail.com' WHERE entity_id = 'email:darcywestund@gmail.com; dwestlind@aol.com';
DELETE FROM owner_entity_links WHERE entity_id = 'email:darcywestund@gmail.com; dwestlind@aol.com';
UPDATE rental_licenses SET link_key = 'email:darcywestund@gmail.com' WHERE link_key = 'email:darcywestund@gmail.com; dwestlind@aol.com';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:darcywestund@gmail.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:darcywestund@gmail.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:darcywestund@gmail.com';
DELETE FROM owner_entities WHERE entity_id = 'email:darcywestund@gmail.com; dwestlind@aol.com';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:alex@lrprop.com', display_name, normalized_name, entity_kind, 'lrprop.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:alex@lrprop.com; inspections@lrprop.com';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:alex@lrprop.com' WHERE entity_id = 'email:alex@lrprop.com; inspections@lrprop.com';
DELETE FROM owner_entity_links WHERE entity_id = 'email:alex@lrprop.com; inspections@lrprop.com';
UPDATE rental_licenses SET link_key = 'email:alex@lrprop.com' WHERE link_key = 'email:alex@lrprop.com; inspections@lrprop.com';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:alex@lrprop.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:alex@lrprop.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:alex@lrprop.com';
DELETE FROM owner_entities WHERE entity_id = 'email:alex@lrprop.com; inspections@lrprop.com';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:amandah@weidner.com', display_name, normalized_name, entity_kind, 'weidner.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:amandah@weidner.com; inspiredir@weidner.com; inspi';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:amandah@weidner.com' WHERE entity_id = 'email:amandah@weidner.com; inspiredir@weidner.com; inspi';
DELETE FROM owner_entity_links WHERE entity_id = 'email:amandah@weidner.com; inspiredir@weidner.com; inspi';
UPDATE rental_licenses SET link_key = 'email:amandah@weidner.com' WHERE link_key = 'email:amandah@weidner.com; inspiredir@weidner.com; inspi';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:amandah@weidner.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:amandah@weidner.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:amandah@weidner.com';
DELETE FROM owner_entities WHERE entity_id = 'email:amandah@weidner.com; inspiredir@weidner.com; inspi';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:mbfrontdesk@metesbounds.com', display_name, normalized_name, entity_kind, 'metesbounds.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:mbfrontdesk@metesbounds.com; abbottapartmentsmn@me';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:mbfrontdesk@metesbounds.com' WHERE entity_id = 'email:mbfrontdesk@metesbounds.com; abbottapartmentsmn@me';
DELETE FROM owner_entity_links WHERE entity_id = 'email:mbfrontdesk@metesbounds.com; abbottapartmentsmn@me';
UPDATE rental_licenses SET link_key = 'email:mbfrontdesk@metesbounds.com' WHERE link_key = 'email:mbfrontdesk@metesbounds.com; abbottapartmentsmn@me';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:mbfrontdesk@metesbounds.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:mbfrontdesk@metesbounds.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:mbfrontdesk@metesbounds.com';
DELETE FROM owner_entities WHERE entity_id = 'email:mbfrontdesk@metesbounds.com; abbottapartmentsmn@me';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:jhinchley@yellowtreecorp.com', display_name, normalized_name, entity_kind, 'yellowtreecorp.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:jhinchley@yellowtreecorp.com; jfahrendorff@yellowt';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:jhinchley@yellowtreecorp.com' WHERE entity_id = 'email:jhinchley@yellowtreecorp.com; jfahrendorff@yellowt';
DELETE FROM owner_entity_links WHERE entity_id = 'email:jhinchley@yellowtreecorp.com; jfahrendorff@yellowt';
UPDATE rental_licenses SET link_key = 'email:jhinchley@yellowtreecorp.com' WHERE link_key = 'email:jhinchley@yellowtreecorp.com; jfahrendorff@yellowt';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:jhinchley@yellowtreecorp.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:jhinchley@yellowtreecorp.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:jhinchley@yellowtreecorp.com';
DELETE FROM owner_entities WHERE entity_id = 'email:jhinchley@yellowtreecorp.com; jfahrendorff@yellowt';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:dan@blvd-management.com', display_name, normalized_name, entity_kind, 'blvd-management.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:dan@blvd-management.com; brett@blvd-management.com';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:dan@blvd-management.com' WHERE entity_id = 'email:dan@blvd-management.com; brett@blvd-management.com';
DELETE FROM owner_entity_links WHERE entity_id = 'email:dan@blvd-management.com; brett@blvd-management.com';
UPDATE rental_licenses SET link_key = 'email:dan@blvd-management.com' WHERE link_key = 'email:dan@blvd-management.com; brett@blvd-management.com';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:dan@blvd-management.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:dan@blvd-management.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:dan@blvd-management.com';
DELETE FROM owner_entities WHERE entity_id = 'email:dan@blvd-management.com; brett@blvd-management.com';
INSERT OR IGNORE INTO owner_entities (entity_id, display_name, normalized_name, entity_kind, email_domain, parcel_count, status, created_at, updated_at)
  SELECT 'email:dcreurer@arcadiamanagement.com', display_name, normalized_name, entity_kind, 'arcadiamanagement.com', 0, status, created_at, updated_at
  FROM owner_entities WHERE entity_id = 'email:dcreurer@arcadiamanagement.com; tcundiff@arcadiama';
UPDATE OR IGNORE owner_entity_links SET entity_id = 'email:dcreurer@arcadiamanagement.com' WHERE entity_id = 'email:dcreurer@arcadiamanagement.com; tcundiff@arcadiama';
DELETE FROM owner_entity_links WHERE entity_id = 'email:dcreurer@arcadiamanagement.com; tcundiff@arcadiama';
UPDATE rental_licenses SET link_key = 'email:dcreurer@arcadiamanagement.com' WHERE link_key = 'email:dcreurer@arcadiamanagement.com; tcundiff@arcadiama';
UPDATE owner_entities SET
  parcel_count = (SELECT COUNT(*) FROM owner_entity_links WHERE entity_id = 'email:dcreurer@arcadiamanagement.com'),
  jurisdiction_count = (SELECT COUNT(DISTINCT r.jurisdiction_id) FROM owner_entity_links l JOIN rental_licenses r ON r.parcel_id = l.parcel_id WHERE l.entity_id = 'email:dcreurer@arcadiamanagement.com'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE entity_id = 'email:dcreurer@arcadiamanagement.com';
DELETE FROM owner_entities WHERE entity_id = 'email:dcreurer@arcadiamanagement.com; tcundiff@arcadiama';
-- fused addr link_key on philadelphia rows
UPDATE rental_licenses SET link_key = 'addr:philadelphia-pa:201 old york road suite' WHERE link_key = 'addr:philadelphia-pa:201 old york road suite; 1-458 jenkintown, pa 19046 usa';
-- Bug 2: drop 'unknown st paul landlord' placeholder entity + links (rental_licenses.link_key already NULL)
DELETE FROM owner_entity_links WHERE entity_id = 'name:saint-paul-mn:unknown st paul landlord';
DELETE FROM owner_entities WHERE entity_id = 'name:saint-paul-mn:unknown st paul landlord';
