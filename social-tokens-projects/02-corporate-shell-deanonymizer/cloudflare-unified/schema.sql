-- Cloudflare D1 Schema for the multi-jurisdiction Housing & Labor Registry.
--
-- rental_licenses is city-agnostic. Every city is ingested by a CityAdapter
-- (see src/adapters) through a shared platform client (see src/platforms).
--   feed_id         the ingest feed that wrote the row (cursor identity)
--   jurisdiction_id the property's municipality
--   parcel_id       globally unique key: "{STATE}:{COUNTY}:{local_id}"

CREATE TABLE IF NOT EXISTS rental_licenses (
    parcel_id TEXT PRIMARY KEY,
    apn TEXT NOT NULL,
    feed_id TEXT NOT NULL,
    jurisdiction_id TEXT NOT NULL,
    city TEXT,
    county TEXT,
    state TEXT,
    address TEXT,
    units INTEGER DEFAULT 1,
    owner_name TEXT,
    owner_address TEXT,
    owner_city TEXT,
    owner_state TEXT,
    owner_zip TEXT,
    owner_phone TEXT,
    owner_email TEXT,
    applicant_name TEXT,
    applicant_phone TEXT,
    applicant_email TEXT,
    severity_class TEXT,          -- canonical A | B | C
    tier TEXT,                    -- raw source label, e.g. "Tier 3", "Grade C"
    status TEXT,
    source_platform TEXT,         -- arcgis | socrata | ckan
    source_dataset TEXT,
    link_key TEXT,                -- sister-property grouping key
    synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_rl_feed ON rental_licenses(feed_id);
CREATE INDEX IF NOT EXISTS idx_rl_jurisdiction ON rental_licenses(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_rl_owner_name ON rental_licenses(owner_name);
CREATE INDEX IF NOT EXISTS idx_rl_applicant_name ON rental_licenses(applicant_name);
CREATE INDEX IF NOT EXISTS idx_rl_applicant_email ON rental_licenses(applicant_email);
CREATE INDEX IF NOT EXISTS idx_rl_owner_address ON rental_licenses(owner_address);
CREATE INDEX IF NOT EXISTS idx_rl_address ON rental_licenses(address);
CREATE INDEX IF NOT EXISTS idx_rl_apn ON rental_licenses(apn);
CREATE INDEX IF NOT EXISTS idx_rl_city ON rental_licenses(city, county);
CREATE INDEX IF NOT EXISTS idx_rl_tier ON rental_licenses(tier);
CREATE INDEX IF NOT EXISTS idx_rl_link_key ON rental_licenses(link_key);

-- Per-feed crawl cursor. A single invocation must never exceed the platform's
-- D1 queries-per-invocation limit, so large feeds resume here.
-- started_at is used by chunked rebuild jobs (dual_matches, entity_resolution)
-- to mark cycle boundaries; older databases need
--   ALTER TABLE sync_state ADD COLUMN started_at TEXT;
CREATE TABLE IF NOT EXISTS sync_state (
    feed_id TEXT PRIMARY KEY,
    offset INTEGER NOT NULL DEFAULT 0,
    rows_total INTEGER NOT NULL DEFAULT 0,
    started_at TEXT,
    updated_at TEXT,
    completed_at TEXT,
    last_error TEXT
);

-- Habitability violations joined to the registry on parcel key
-- (violations.join_key = rental_licenses.apn; NYC BBL). PK is feed-scoped.
CREATE TABLE IF NOT EXISTS violations (
    feed_id TEXT NOT NULL,
    violation_id TEXT NOT NULL,
    join_key TEXT,
    violation_class TEXT,
    status TEXT,
    is_open INTEGER NOT NULL DEFAULT 0,
    address TEXT,
    boro TEXT,
    description TEXT,
    source_platform TEXT,
    source_dataset TEXT,
    row_hash TEXT,
    synced_at TEXT,
    PRIMARY KEY (feed_id, violation_id)
);

CREATE INDEX IF NOT EXISTS idx_v_join_key ON violations(join_key);
CREATE INDEX IF NOT EXISTS idx_v_feed ON violations(feed_id);
CREATE INDEX IF NOT EXISTS idx_v_feed_open_class ON violations(feed_id, is_open, violation_class);

-- Wage theft enforcement actions, settlements, and civil citations.
-- provenance_type / source_docket_url are written by the labor sync/seed
-- paths (VERIFIED_PUBLIC_ACTION vs PROTOTYPE_SEED_PENDING_FOIA).
CREATE TABLE IF NOT EXISTS wage_theft_records (
    case_id TEXT PRIMARY KEY,
    source_agency TEXT NOT NULL,
    respondent_legal_name TEXT NOT NULL,
    trade_name TEXT,
    address TEXT,
    city TEXT DEFAULT 'Minneapolis',
    state TEXT DEFAULT 'MN',
    zip_code TEXT,
    naics_code TEXT,
    industry_description TEXT,
    violation_type TEXT,
    back_wages_recovered REAL DEFAULT 0.0,
    civil_penalties_assessed REAL DEFAULT 0.0,
    workers_affected INTEGER DEFAULT 0,
    repeat_violator INTEGER DEFAULT 0,
    status TEXT DEFAULT 'VIOLATION_CONFIRMED',
    findings_date TEXT,
    settlement_amount REAL DEFAULT 0.0,
    description TEXT,
    provenance_type TEXT DEFAULT 'PROTOTYPE_SEED_PENDING_FOIA',
    source_docket_url TEXT DEFAULT '',
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_d1_wage_theft_legal ON wage_theft_records(respondent_legal_name);
CREATE INDEX IF NOT EXISTS idx_d1_wage_theft_trade ON wage_theft_records(trade_name);
CREATE INDEX IF NOT EXISTS idx_d1_wage_theft_city ON wage_theft_records(city);
CREATE INDEX IF NOT EXISTS idx_d1_wage_theft_agency ON wage_theft_records(source_agency);

-- Materialized landlord × wage-theft join. The instr() substring join over
-- rental_licenses × wage_theft_records exceeds D1's per-query CPU limit at
-- request time, so the 06:00 cron (or POST /crossover/rebuild) rebuilds this
-- table one wage_theft_records row at a time; /api/crossover reads it.
-- Rebuild progress resumes via sync_state.feed_id = 'dual_matches'.
CREATE TABLE IF NOT EXISTS dual_matches (
    landlord_name TEXT NOT NULL,
    landlord_city TEXT,
    landlord_county TEXT,
    landlord_state TEXT,
    properties_count INTEGER DEFAULT 0,
    total_units INTEGER DEFAULT 0,
    tier3_properties INTEGER DEFAULT 0,
    case_id TEXT NOT NULL,
    source_agency TEXT,
    respondent_legal_name TEXT,
    trade_name TEXT,
    violation_type TEXT,
    back_wages_recovered REAL DEFAULT 0.0,
    workers_affected INTEGER DEFAULT 0,
    provenance_type TEXT,
    source_docket_url TEXT DEFAULT '',
    matched_at TEXT,
    PRIMARY KEY (landlord_name, case_id)
);

CREATE INDEX IF NOT EXISTS idx_dual_matches_case ON dual_matches(case_id);
CREATE INDEX IF NOT EXISTS idx_dual_matches_city ON dual_matches(landlord_city);

-- Staging for rebuildDualMatches: raw license-row hits per wage-theft case,
-- aggregated (COUNT DISTINCT apn) into dual_matches when a pass completes.
CREATE TABLE IF NOT EXISTS dual_match_hits (
    case_id TEXT NOT NULL,
    landlord_name TEXT NOT NULL,
    landlord_city TEXT,
    landlord_county TEXT,
    landlord_state TEXT,
    apn TEXT,
    units INTEGER DEFAULT 0,
    tier3 INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_dual_match_hits_case ON dual_match_hits(case_id);

-- Confidential whistleblower / worker incident intake.
-- Written by POST /api/reports (unified) and the legacy POST /report.
CREATE TABLE IF NOT EXISTS worker_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_name TEXT NOT NULL,
    worksite_address TEXT DEFAULT '',
    city TEXT DEFAULT 'Minneapolis',
    job_title TEXT DEFAULT '',
    violation_types TEXT DEFAULT '',
    estimated_unpaid_amount REAL DEFAULT 0.0,
    weeks_worked INTEGER DEFAULT 0,
    narrative TEXT NOT NULL,
    contact_email TEXT DEFAULT '',
    contact_phone TEXT DEFAULT '',
    union_affiliation TEXT DEFAULT 'NON_UNION',
    status TEXT DEFAULT 'PENDING_ORGANIZER_REVIEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_worker_reports_employer ON worker_reports(employer_name);
CREATE INDEX IF NOT EXISTS idx_worker_reports_status ON worker_reports(status);

-- Sync telemetry for the labor live-sync and crossover snapshot jobs.
CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    cases_synced INTEGER DEFAULT 0,
    status TEXT DEFAULT 'SUCCESS',
    details TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_source ON sync_logs(source);

-- ---------------------------------------------------------------------------
-- Entity resolution: canonical owner entities with per-link provenance.
--
-- Every rental_licenses row emits linking signals (applicant/owner email,
-- shared email domain, jurisdiction-scoped normalized name). Each signal
-- is its own entity (entity_id = the signal key) and every signal links the
-- parcel to that entity with a match_type + confidence, so a row carrying
-- both an email and a name links into both clusters. Candidate merges that
-- need human judgment land in owner_entity_review (cross-jurisdiction
-- name/domain matches, oversized auto groups); approving re-points the
-- links. This DDL mirrors the deployed production tables — keep in sync.
--
-- Rows are written by the chunked rebuild in src/housing/entities.ts
-- (sync_state feed_id = 'entity_resolution'), mirroring dual_matches.
CREATE TABLE IF NOT EXISTS owner_entities (
    entity_id TEXT PRIMARY KEY,      -- 'email:<email>' | 'domain:<domain>' | 'name:<jurisdiction>:<name>'
    display_name TEXT NOT NULL,
    normalized_name TEXT,
    entity_kind TEXT DEFAULT 'unknown',   -- company | person | unknown
    email_domain TEXT,
    parcel_count INTEGER DEFAULT 0,
    jurisdiction_count INTEGER DEFAULT 0,
    provenance TEXT DEFAULT '{}',         -- JSON: {signals:[], sources:[], merged_from:[]}
    status TEXT DEFAULT 'auto',           -- auto | review | confirmed | merged
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS owner_entity_links (
    parcel_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    match_type TEXT NOT NULL,             -- email_exact | email_domain | name | manual
    confidence REAL DEFAULT 1.0,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    PRIMARY KEY (parcel_id, entity_id)
);

CREATE TABLE IF NOT EXISTS owner_entity_review (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id_a TEXT NOT NULL,
    entity_id_b TEXT,                     -- NULL for single-entity flags
    reason TEXT NOT NULL,                 -- cross_jurisdiction_name_domain | multi_jurisdiction_name | large_auto_group
    evidence TEXT DEFAULT '{}',           -- JSON describing the candidate
    status TEXT DEFAULT 'pending',        -- pending | approved | rejected
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_oel_entity ON owner_entity_links(entity_id);
CREATE INDEX IF NOT EXISTS idx_oe_domain ON owner_entities(email_domain);
CREATE INDEX IF NOT EXISTS idx_oe_status ON owner_entities(status);
CREATE INDEX IF NOT EXISTS idx_oer_status ON owner_entity_review(status);
