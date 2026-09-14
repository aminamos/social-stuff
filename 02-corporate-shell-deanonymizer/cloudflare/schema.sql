-- Cloudflare D1 Schema for Twin Cities Metro Housing & Parcel Registry
CREATE TABLE IF NOT EXISTS rental_licenses (
    apn TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    city TEXT DEFAULT 'Minneapolis',
    county TEXT DEFAULT 'Hennepin',
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
    units INTEGER DEFAULT 1,
    tier TEXT,
    status TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_d1_applicant_email ON rental_licenses(applicant_email);
CREATE INDEX IF NOT EXISTS idx_d1_owner_name ON rental_licenses(owner_name);
CREATE INDEX IF NOT EXISTS idx_d1_address ON rental_licenses(address);
CREATE INDEX IF NOT EXISTS idx_d1_tier ON rental_licenses(tier);
CREATE INDEX IF NOT EXISTS idx_d1_city ON rental_licenses(city);
CREATE INDEX IF NOT EXISTS idx_d1_county ON rental_licenses(county);

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
