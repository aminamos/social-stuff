-- Saved returns: one JSON snapshot of input + computed result per row.
CREATE TABLE IF NOT EXISTS returns (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  filing_status TEXT NOT NULL,
  input_json TEXT NOT NULL,
  result_json TEXT NOT NULL
);
