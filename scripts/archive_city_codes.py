"""Archive county-seat city code documents into R2.

Reads data/county_sources.json, downloads each recorded city_code_url
(HTML or PDF, browser User-Agent), uploads the bytes to the
rural-planning-bot-data R2 bucket, and records the R2 key in the D1
`documents` table (kind='city_code') so the frontend worker can serve them.

URLs that fail to fetch are skipped with a printed warning -- the D1
county row keeps its URL and review note; nothing is fabricated.

Usage:
    source .venv/bin/activate
    python scripts/archive_city_codes.py [--push]

Outputs:
    data/cache/city-code/<County>.html|.pdf   local copies (gitignored)
    data/city_code_docs.sql                    INSERT batch for documents
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "data" / "county_sources.json"
CACHE = ROOT / "data" / "cache" / "city-code"
DOCS_SQL = ROOT / "data" / "city_code_docs.sql"
BUCKET = "rural-planning-bot-data"
DB = "rural-planning-bot"

TIMEOUT = 60
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
MAX_BYTES = 25_000_000


def sql_str(value: object) -> str:
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def fetch(url: str) -> tuple[bytes, str] | None:
    try:
        r = requests.get(url, timeout=TIMEOUT, headers=UA, allow_redirects=True)
        if r.status_code != 200 or not r.content:
            return None
        ctype = r.headers.get("content-type", "").lower()
        ext = ".pdf" if "pdf" in ctype or url.lower().endswith(".pdf") else ".html"
        return r.content[:MAX_BYTES], ext
    except requests.RequestException:
        return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--push", action="store_true",
                        help="upload to R2 and insert into D1 (default: fetch only)")
    args = parser.parse_args()

    records: list[dict] = json.loads(SOURCES.read_text(encoding="utf-8"))
    targets = [(r["county"], r["city_code_url"]) for r in records if r.get("city_code_url")]
    print(f"{len(targets)} city code URLs to archive")

    CACHE.mkdir(parents=True, exist_ok=True)
    docs = []
    for i, (county, url) in enumerate(targets, 1):
        print(f"[{i}/{len(targets)}] {county}...", flush=True)
        got = fetch(url)
        if got is None:
            print(f"  SKIP: fetch failed: {url}")
            continue
        content, ext = got
        local = CACHE / f"{county}{ext}"
        local.write_bytes(content)
        r2_key = f"city-code/{county}{ext}"
        print(f"  saved {len(content)} bytes -> {r2_key}")
        if args.push:
            for attempt in range(4):
                try:
                    subprocess.run(
                        ["wrangler", "r2", "object", "put", f"{BUCKET}/{r2_key}",
                         "--file", str(local), "--remote"], check=True, cwd=ROOT,
                    )
                    break
                except subprocess.CalledProcessError:
                    if attempt == 3:
                        print(f"  UPLOAD FAILED after retries, skipping: {r2_key}")
                        break
                    time.sleep(5 * (attempt + 1))
        docs.append({"county": county, "kind": "city_code",
                     "source_url": url, "r2_key": r2_key})

    lines = ["DELETE FROM documents WHERE kind = 'city_code';"]
    lines += [
        "INSERT INTO documents (county, kind, source_url, r2_key) VALUES ("
        + ", ".join([sql_str(d["county"]), sql_str(d["kind"]),
                     sql_str(d["source_url"]), sql_str(d["r2_key"])]) + ");"
        for d in docs
    ]
    DOCS_SQL.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {len(docs)} statements -> {DOCS_SQL.relative_to(ROOT)}")
    if args.push and docs:
        subprocess.run(
            ["wrangler", "d1", "execute", DB, "--remote", "--file", str(DOCS_SQL)],
            check=True, cwd=ROOT,
        )
    elif not args.push:
        print("re-run with --push to upload to R2 and insert into D1")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
