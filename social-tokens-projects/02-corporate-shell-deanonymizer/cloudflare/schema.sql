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
CREATE TABLE IF NOT EXISTS sync_state (
    feed_id TEXT PRIMARY KEY,
    offset INTEGER NOT NULL DEFAULT 0,
    rows_total INTEGER NOT NULL DEFAULT 0,
    started_at TEXT,
    updated_at TEXT,
    completed_at TEXT,
    last_error TEXT
);

-- Multi-city property parcels across Hennepin and Ramsey counties
CREATE TABLE IF NOT EXISTS county_parcels (
    pid TEXT PRIMARY KEY,
    county TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    owner_name TEXT,
    owner_address TEXT,
    taxpayer_name TEXT,
    taxpayer_address TEXT,
    units INTEGER DEFAULT 1,
    market_value REAL,
    property_type TEXT,
    homestead_status TEXT,
    delinquent_tax_year TEXT,
    year_built INTEGER,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_d1_parcel_owner ON county_parcels(owner_name);
CREATE INDEX IF NOT EXISTS idx_d1_parcel_taxpayer ON county_parcels(taxpayer_name);
CREATE INDEX IF NOT EXISTS idx_d1_parcel_city ON county_parcels(city);
CREATE INDEX IF NOT EXISTS idx_d1_parcel_county ON county_parcels(county);
CREATE INDEX IF NOT EXISTS idx_d1_parcel_address ON county_parcels(address);

-- Wage theft enforcement actions, settlements, and civil citations
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
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_d1_wage_theft_legal ON wage_theft_records(respondent_legal_name);
CREATE INDEX IF NOT EXISTS idx_d1_wage_theft_trade ON wage_theft_records(trade_name);
CREATE INDEX IF NOT EXISTS idx_d1_wage_theft_city ON wage_theft_records(city);
CREATE INDEX IF NOT EXISTS idx_d1_wage_theft_agency ON wage_theft_records(source_agency);
