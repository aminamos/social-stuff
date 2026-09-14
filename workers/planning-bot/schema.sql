-- D1 schema for the rural Planning Bot ("Can I Build / Do This?").
-- Database: rural-planning-bot. One frontend worker covers all counties.
-- Apply: wrangler d1 execute rural-planning-bot --remote --file workers/planning-bot/schema.sql

CREATE TABLE IF NOT EXISTS counties (
  county TEXT PRIMARY KEY,               -- e.g. 'Wright' (implies '<county> County, MN')
  definition TEXT,                       -- 'nonmetro county (USDA ERS MN rural definitions PDF, p.3)'
  omb_vintage TEXT,                      -- OMB delineation bulletin vintage
  county_seat TEXT,                      -- filled by human review pass
  gis_portal_url TEXT,                   -- verified HTTP 200 ArcGIS Hub site
  gis_parcels_service_url TEXT,          -- verified HTTP 200 parcel Feature Service
  zoning_ordinance_url TEXT,             -- verified HTTP 200 county zoning page
  city_code_url TEXT,                    -- verified HTTP 200 municipal code (county seat)
  assessor_url TEXT,                     -- verified HTTP 200 county assessor / property-tax records page
  status TEXT NOT NULL DEFAULT 'pending',-- pending | needs_review | verified | loaded
  notes TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  county TEXT NOT NULL REFERENCES counties(county),
  kind TEXT NOT NULL,                     -- city_code | zoning | packet | manual
  source_url TEXT NOT NULL,
  r2_key TEXT,                            -- R2 object key once archived, else NULL
  fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_documents_county ON documents(county);
