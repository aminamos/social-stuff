-- D1 schema for bruenig-chart-updates.
-- Recomputes and serves updated versions of Matt Bruenig / People's Policy
-- Project charts when their underlying public datasets release new vintages.
-- Database: bruenig-chart-updates.
-- Apply: wrangler d1 execute bruenig-chart-updates --remote --file bruenig-chart-updates/schema.sql

CREATE TABLE IF NOT EXISTS charts (
  slug TEXT PRIMARY KEY,           -- e.g. 'market-vs-disposable-poverty'
  family TEXT NOT NULL,            -- poverty | wealth | intl
  title TEXT NOT NULL,
  subtitle TEXT,
  provenance TEXT NOT NULL,        -- JSON: {bruenig_post_url, bruenig_post_title,
                                   --  source_name, source_url, recipe_md}
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,             -- e.g. 'market-vs-disposable-poverty:market'
  chart_slug TEXT NOT NULL REFERENCES charts(slug),
  label TEXT NOT NULL,             -- legend label, e.g. 'Market-income poverty'
  unit TEXT NOT NULL DEFAULT 'percent',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_series_chart ON series(chart_slug);

CREATE TABLE IF NOT EXISTS points (
  series_id TEXT NOT NULL REFERENCES series(id),
  x TEXT NOT NULL,                 -- year ('2024') or category label ('USA')
  y REAL NOT NULL,
  PRIMARY KEY (series_id, x)
);
CREATE INDEX IF NOT EXISTS idx_points_series ON points(series_id);

-- Dataset release tracking: the monthly cron re-checks each dataset's index
-- page and writes the newest vintage seen; a change here means charts are
-- stale until the pipeline re-runs.
CREATE TABLE IF NOT EXISTS releases (
  dataset TEXT PRIMARY KEY,        -- 'cps-asec' | 'scf' | 'oecd-idd'
  label TEXT NOT NULL,
  source_index_url TEXT NOT NULL,
  latest_vintage TEXT,             -- e.g. '2026' for ASEC released 2026
  checked_at TEXT,
  stale INTEGER NOT NULL DEFAULT 0 -- 1 = newer vintage detected, pipeline not yet re-run
);

CREATE TABLE IF NOT EXISTS change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset TEXT NOT NULL,
  old_vintage TEXT,
  new_vintage TEXT NOT NULL,
  detected_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_change_log_detected ON change_log(detected_at);
