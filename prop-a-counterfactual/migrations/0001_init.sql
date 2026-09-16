-- Proposal A counterfactual: Michigan taxable-value uncapping model
-- Sources: MI Treasury 2024 Ad Valorem Tax Levy Report (form 625),
--          State Tax Commission 2024/2025 Annual Reports (appendices 3-4)

CREATE TABLE counties (
  county TEXT PRIMARY KEY,
  tv INTEGER NOT NULL,           -- 2024 taxable valuation (all classes)
  sev INTEGER NOT NULL,          -- 2024 state equalized valuation (all classes)
  sev_res INTEGER NOT NULL,      -- 2024 residential SEV
  gap INTEGER NOT NULL,          -- sev - tv
  total_tax REAL NOT NULL,       -- 2024 ad valorem taxes levied in county
  avg_rate REAL NOT NULL,        -- mills: total_tax / tv * 1000
  uncap_uplift REAL NOT NULL     -- gap * avg_rate / 1000
);

CREATE TABLE state_series (
  year INTEGER PRIMARY KEY,
  levy INTEGER NOT NULL,
  avg_rate REAL NOT NULL,
  homestead_rate REAL NOT NULL,
  nonhomestead_rate REAL NOT NULL,
  sev INTEGER NOT NULL,
  tv INTEGER NOT NULL,
  gap INTEGER NOT NULL
);

CREATE TABLE class_values (
  year INTEGER NOT NULL,
  cls TEXT NOT NULL,             -- agricultural|commercial|industrial|residential|timber_cutover|developmental|personal
  sev INTEGER NOT NULL,
  tv INTEGER NOT NULL,
  gap INTEGER NOT NULL,
  PRIMARY KEY (year, cls)
);

-- Tunable model parameters; UPDATE to change engine defaults without redeploy.
CREATE TABLE model_params (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL            -- JSON number
);

CREATE TABLE source_documents (
  r2_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  content_type TEXT NOT NULL,
  notes TEXT
);
