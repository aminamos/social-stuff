#!/usr/bin/env python3
"""Stream a wrangler `d1 export` SQL dump into data/registry.duckdb.

The dump is one INSERT per line with explicit column lists. We parse
INSERT lines for TABLES directly into DuckDB via executemany batches —
no sqlite intermediate, no CSV files (disk is tight; the dump alone is
~470MB). Columns land as VARCHAR; models TRY_CAST at staging.

Usage: .venv/bin/python scripts/load_duckdb.py [dump.sql]
"""
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
DATA = HERE / "data"
DUMP = Path(sys.argv[1]) if len(sys.argv) > 1 else DATA / "social-housing-db.sql"
OUT_DB = DATA / "registry.duckdb"

TABLES = {
    "rental_licenses",
    "violations",
    "county_parcels",
    "wage_theft_records",
    "dual_matches",
    "owner_entities",
    "owner_entity_links",
    "owner_entity_review",
}

INSERT_RE = re.compile(
    r'^INSERT INTO "?([A-Za-z_]\w*)"?\s*\((.*?)\)\s*VALUES\s*', re.I
)
BATCH = 2000


def split_values(s: str) -> list[str]:
    """Split a '(...),(...)' VALUES tail into row bodies."""
    rows, depth, in_str, cur = [], 0, False, []
    i = 0
    while i < len(s):
        c = s[i]
        if in_str:
            cur.append(c)
            if c == "'":
                if i + 1 < len(s) and s[i + 1] == "'":
                    cur.append("'")
                    i += 1
                else:
                    in_str = False
        elif c == "'":
            in_str = True
            cur.append(c)
        elif c == "(":
            depth += 1
            if depth > 1:
                cur.append(c)
        elif c == ")":
            depth -= 1
            if depth == 0:
                rows.append("".join(cur))
                cur = []
            else:
                cur.append(c)
        elif depth >= 1:
            cur.append(c)
        i += 1
    return rows


def split_cols(s: str) -> list[str]:
    """Split a VALUES row body on top-level commas."""
    parts, in_str, cur = [], False, []
    i = 0
    while i < len(s):
        c = s[i]
        if in_str:
            cur.append(c)
            if c == "'":
                if i + 1 < len(s) and s[i + 1] == "'":
                    cur.append("'")
                    i += 1
                else:
                    in_str = False
        elif c == "'":
            in_str = True
            cur.append(c)
        elif c == ",":
            parts.append("".join(cur))
            cur = []
        else:
            cur.append(c)
        i += 1
    parts.append("".join(cur))
    return parts


def lit(v: str):
    """Parse one SQLite literal."""
    v = v.strip()
    if v.upper() == "NULL":
        return None
    if len(v) >= 2 and v[0] == "'" and v[-1] == "'":
        return v[1:-1].replace("''", "'")
    if v[:2].upper() == "X'":
        return bytes.fromhex(v[2:-1])
    try:
        return int(v)
    except ValueError:
        try:
            return float(v)
        except ValueError:
            return v


def main() -> None:
    if not DUMP.exists():
        sys.exit(f"missing {DUMP} — run scripts/export-d1.sh first")

    import duckdb

    if OUT_DB.exists():
        OUT_DB.unlink()
    duck = duckdb.connect(str(OUT_DB))
    duck.execute("CREATE SCHEMA raw")
    duck.execute("BEGIN TRANSACTION")

    counts = {t: 0 for t in TABLES}
    pending: dict[str, list] = {t: [] for t in TABLES}
    ncols: dict[str, int] = {}

    def flush(t: str) -> None:
        rows = pending[t]
        if not rows:
            return
        ph = ",".join("?" for _ in range(ncols[t]))
        duck.executemany(f'INSERT INTO raw.{t} VALUES ({ph})', rows)
        counts[t] += len(rows)
        pending[t] = []

    with open(DUMP, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            if not line.startswith("INSERT INTO"):
                continue
            m = INSERT_RE.match(line)
            if not m:
                continue
            tname = m.group(1)
            if tname not in TABLES:
                continue
            if tname not in ncols:
                cols = [c.strip().strip('"') for c in m.group(2).split(",")]
                ncols[tname] = len(cols)
                coldefs = ", ".join(f'"{c}" VARCHAR' for c in cols)
                duck.execute(f'CREATE TABLE raw.{tname} ({coldefs})')
            tail = line[m.end():].rstrip()
            if tail.endswith(";"):
                tail = tail[:-1]
            for rowbody in split_values(tail):
                vals = [lit(v) for v in split_cols(rowbody)]
                if len(vals) == ncols[tname]:
                    pending[tname].append(vals)
            if len(pending[tname]) >= BATCH:
                flush(tname)

    for t in TABLES:
        flush(t)
    duck.execute("COMMIT")
    for t, n in counts.items():
        if n:
            print(f"raw.{t}: {n} rows")
    duck.close()
    print(f"wrote {OUT_DB}")


if __name__ == "__main__":
    main()
