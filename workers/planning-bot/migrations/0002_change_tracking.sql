-- Change tracking for archived code documents (applied 2026-09-14).
-- Apply: wrangler d1 execute rural-planning-bot --remote --file workers/planning-bot/migrations/0002_change_tracking.sql

ALTER TABLE documents ADD COLUMN content_sha256 TEXT;
ALTER TABLE documents ADD COLUMN checked_at TEXT;

CREATE TABLE IF NOT EXISTS change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  county TEXT NOT NULL,
  kind TEXT NOT NULL,                 -- city_code | zoning
  old_r2_key TEXT NOT NULL,
  new_r2_key TEXT NOT NULL,
  old_sha256 TEXT NOT NULL,
  new_sha256 TEXT NOT NULL,
  detected_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_change_log_county ON change_log(county);
CREATE INDEX IF NOT EXISTS idx_change_log_detected ON change_log(detected_at);
