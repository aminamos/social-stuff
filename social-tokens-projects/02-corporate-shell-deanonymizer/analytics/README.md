# analytics/ — DuckDB + SQLMesh over the registry

Offline analysis of `social-housing-db` (the D1 behind the registry workers):
staging models for `rental_licenses` / `violations`, a sister-property
rollup mart, and audits for the known data hazards (null link_keys,
placeholder owners, duplicate parcels, name drift inside a syndicate).

## Setup

```bash
cd analytics
uv venv .venv                      # or: python3 -m venv .venv
uv pip install --python .venv/bin/python duckdb sqlmesh
```

## Refresh data

```bash
scripts/export-d1.sh                          # remote D1 -> data/social-housing-db.sql
.venv/bin/python scripts/load_duckdb.py       # dump -> data/registry.duckdb raw.*
```

## Run

```bash
.venv/bin/sqlmesh plan            # build models + run audits
.venv/bin/sqlmesh run             # subsequent runs
.venv/bin/duckdb data/registry.duckdb
```

`blocking: false` audits report counts without failing the plan — null
link_keys and open-without-join_key are expected for address-join feeds
(Phoenix, Seattle, Chicago) and bbl/registration_contacts linkers; watch
the count, not the pass/fail.
