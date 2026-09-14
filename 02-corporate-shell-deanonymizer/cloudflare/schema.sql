-- Cloudflare D1 Schema for Minneapolis Rental Housing Registry
CREATE TABLE IF NOT EXISTS rental_licenses (
    apn TEXT PRIMARY KEY,
    address TEXT NOT NULL,
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
