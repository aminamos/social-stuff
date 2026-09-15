-- Roseville STR feasibility: rule parameter overrides + lookup audit log
-- + registry of archived source documents (objects live in R2: roseville-str-docs)

CREATE TABLE IF NOT EXISTS rule_params (
  key TEXT PRIMARY KEY,          -- e.g. 'fees.strLicenseAnnual'
  value TEXT NOT NULL,           -- JSON-encoded scalar
  source TEXT,                   -- code section / fee schedule ref
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS source_documents (
  r2_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  content_type TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS lookups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  address_input TEXT NOT NULL,
  matched_address TEXT,
  parcel_id TEXT,
  city TEXT,
  verdict TEXT,
  scenario_json TEXT NOT NULL,
  narrative_source TEXT
);
CREATE INDEX IF NOT EXISTS idx_lookups_time ON lookups(requested_at);
CREATE INDEX IF NOT EXISTS idx_lookups_parcel ON lookups(parcel_id);

-- Seed defaults matching src/rules.ts constants. The engine reads these at
-- request time so fee updates need only an UPDATE, not a redeploy.
INSERT OR IGNORE INTO rule_params (key, value, source) VALUES
  ('fees.strLicenseAnnual',          '540',  'Fee Schedule §314.05 / Appendix A (verify current)'),
  ('fees.strLicenseLateFee',         '43',   'Appendix A late renewal'),
  ('fees.rentalRegistrationPerUnit', '45',   'cityofroseville.com/2588/Rental-Housing (2025 figure)'),
  ('fees.rentalRegistrationLate',    '43',   'Appendix A'),
  ('fees.lodgingTaxRate',            '0.03', 'Ch. 312; lodging tax return form (DocumentCenter 35573)'),
  ('spacing.feet',                   '500',  '909.03.B (Ord. 1657)'),
  ('notice.radiusFeet',              '300',  '909.07.C (Ord. 1657)'),
  ('cap.winterDays',                 '212',  '909.02 window Oct 1–May 1'),
  ('cap.summerDays',                 '153',  '909.02 window May 1–Oct 1'),
  ('cap.winterSpacing',              '7',    '909.02'),
  ('cap.summerSpacing',              '10',   '909.02'),
  ('str.maxNights',                  '30',   '909.02 definition'),
  ('occupancy.maxUnrelatedAdults',   '4',    '909.03.A.6; 906.06/1001.10');

INSERT OR IGNORE INTO source_documents (r2_key, title, source_url, fetched_at, content_type, notes) VALUES
  ('ordinance-1657-ch909-2024.docx', 'Ordinance 1657 — Ch. 909 STR amendments (adopted 2024-02-12)',
   'https://www.cityofroseville.com/DocumentCenter/View/36287', '2026-09-15',
   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
   'CURRENT law: 500-ft spacing, 300-ft neighbor notice, frequency caps, license non-transfer'),
  ('ordinance-1657-ch909-2024.txt', 'Ordinance 1657 — extracted text',
   'https://www.cityofroseville.com/DocumentCenter/View/36287', '2026-09-15',
   'text/plain', 'Text extraction of the adopted ordinance'),
  ('ordinance-1596-ch909-2021.pdf', 'Ordinance 1596 — original Ch. 909 creation (adopted 2021-02-08)',
   'https://www.cityofroseville.com/DocumentCenter/View/31343', '2026-09-15',
   'application/pdf', 'Original chapter; superseded in part by Ord. 1657'),
  ('ordinance-1596-ch909-2021.txt', 'Ordinance 1596 — extracted text',
   'https://www.cityofroseville.com/DocumentCenter/View/31343', '2026-09-15',
   'text/plain', 'Text extraction of the original ordinance'),
  ('lodging-tax-return-form.pdf', 'Roseville lodging tax return (3%)',
   'http://www.ci.roseville.mn.us/DocumentCenter/View/35573', '2026-09-15',
   'application/pdf', 'Ch. 312 monthly return; guest register submitted with it (909.12)'),
  ('lodging-tax-return-form.txt', 'Lodging tax return — extracted text',
   'http://www.ci.roseville.mn.us/DocumentCenter/View/35573', '2026-09-15',
   'text/plain', NULL),
  ('ch907-rental-registration-brochure.pdf', 'Rental Registration brochure (Ch. 907, 1–4 units)',
   'http://www.cityofroseville.com/DocumentCenter/View/29076', '2026-09-15',
   'application/pdf', '$45/unit/yr; >4 units → licensed via Fire Dept'),
  ('ch907-rental-registration-brochure.txt', 'Rental Registration brochure — extracted text',
   'http://www.cityofroseville.com/DocumentCenter/View/29076', '2026-09-15',
   'text/plain', NULL),
  ('rules-snapshot.json', 'Engine constants snapshot',
   'roseville-str-feasibility/src/rules.ts', '2026-09-15',
   'application/json', 'FEES, SEASONS, thresholds as encoded at deploy time');
