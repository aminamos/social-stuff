#!/usr/bin/env python3
"""
NYC owner backfill for the corporate-shell deanonymizer.

The rental_licenses feed ny-hpd-registration (Socrata tesw-yqqr, Multiple
Dwelling Registrations) publishes no owner identity — it only carries
boroid/block/lot + registrationid. HPD publishes owner/agent contacts in a
second dataset (feu5-w2e2, Registration Contacts) keyed by registrationid.

This script:
  1. pages tesw-yqqr   -> bbl -> registrationid
  2. pages feu5-w2e2   -> registrationid -> best owner contact
     (owner-side types ranked before Agent/SiteManager; corporationname
     preferred, falling back to the contact's personal name)
  3. emits chunked .sql files that create a staging table nyc_owner_map,
     load it, update rental_licenses.owner_* + link_key, and drop it
  4. applies them via ../scripts/wr d1 execute --remote

link_key replicates linkKey("name") from src/housing/canonical.ts:
  name:<jurisdiction>:<normalized entity name>
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request

REG_ENDPOINT = "https://data.cityofnewyork.us/resource/tesw-yqqr.json"
CONTACT_ENDPOINT = "https://data.cityofnewyork.us/resource/feu5-w2e2.json"
PAGE = 50000
JURISDICTION = "new-york-ny"
FEED_ID = "ny-hpd-registration"
# Windows has no /tmp; honor NYC_ENRICH_OUT, else the platform temp dir.
OUT_DIR = os.environ.get("NYC_ENRICH_OUT") or os.path.join(tempfile.gettempdir(), "nyc-enrich")
# scripts/wr is a bash script; invoke through bash so this also runs on
# Windows (subprocess will not exec an extensionless script natively), with
# a POSIX-style path so git-bash does not mangle the backslashes.
# shutil.which resolves bash from PATH (git-bash); a bare "bash" would let
# CreateProcess pick System32\bash.exe (WSL) which cannot see E:/ paths.

WR_SCRIPT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../../scripts/wr")
).replace("\\", "/")
WR = [shutil.which("bash") or "bash", WR_SCRIPT]
DB = "social-housing-db"

NON_ENTITIES = {
    "", "n a", "na", "none", "unknown", "owner", "owners", "self",
    "dwelling units", "apartment", "apartments", "building", "property",
    "properties", "management", "same as owner", "see above",
}
# Kept in parity with GENERIC_TOKENS in src/housing/canonical.ts — the Python
# link_key must reproduce linkKey("name") exactly or the grouping splits.
GENERIC_TOKENS = {
    "the", "and", "of", "on", "at", "community", "property", "properties",
    "site", "building", "resident", "apartment", "apartments", "manager",
    "management", "office", "agent", "admin", "administrator", "contact",
    "leasing", "maintenance", "general", "dwelling", "unit", "units",
    "na", "n", "none", "unknown", "self", "owner", "owners", "same", "as",
    "see", "above", "tbd", "null", "blank", "info", "information",
}


def norm_entity(name: str) -> str:
    first = re.split(r"[,;|]", name or "")[0]
    s = re.sub(r"[^a-z0-9]+", " ", first.lower()).strip()
    return re.sub(r"\s+", " ", s)


def usable_name(norm: str) -> bool:
    if not norm or len(norm) < 3 or norm in NON_ENTITIES:
        return False
    toks = [t for t in norm.split(" ") if t]
    return bool(toks) and not all(t in GENERIC_TOKENS for t in toks)


def link_key(owner_name: str) -> str | None:
    n = norm_entity(owner_name)
    return f"name:{JURISDICTION}:{n}" if usable_name(n) else None


def page(endpoint: str, offset: int, select: str) -> list[dict]:
    url = f"{endpoint}?$limit={PAGE}&$offset={offset}&$order=:id&$select={select}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read())
        except Exception as e:
            if attempt == 3:
                raise
            print(f"  retry {attempt + 1} offset {offset}: {e}", flush=True)
            time.sleep(3 * (attempt + 1))
    return []


def sql_str(v: str | None) -> str:
    if v is None or v == "":
        return "NULL"
    return "'" + v.replace("'", "''") + "'"


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)

    if "--apply-only" in sys.argv:
        files = sorted(
            os.path.join(OUT_DIR, f)
            for f in os.listdir(OUT_DIR)
            if f.endswith(".sql")
        )
        if not files:
            sys.exit(f"no sql files in {OUT_DIR}")
        apply_files(files)
        return

    # ---- 1. contacts: registrationid -> best owner contact ----
    print("downloading feu5-w2e2 registration contacts...", flush=True)
    owners: dict[str, dict] = {}
    rank = {"CorporateOwner": 0, "Agent": 1, "HeadOfficer": 2}
    off = 0
    while True:
        rows = page(
            CONTACT_ENDPOINT, off,
            "registrationid,type,corporationname,firstname,lastname,"
            "businesshousenumber,businessstreetname,businesscity,"
            "businessstate,businesszip",
        )
        if not rows:
            break
        for r in rows:
            rid = r.get("registrationid")
            if not rid:
                continue
            rrank = rank.get(r.get("type", ""), 3)
            cur = owners.get(rid)
            if cur is None or rrank < cur["rank"]:
                corp = (r.get("corporationname") or "").strip()
                person = " ".join(
                    p for p in [r.get("firstname", "").strip(), r.get("lastname", "").strip()] if p
                ).strip()
                owners[rid] = {
                    "rank": rrank,
                    "name": corp or person,
                    "addr": " ".join(
                        p for p in [r.get("businesshousenumber", "").strip(),
                                    r.get("businessstreetname", "").strip()] if p
                    ).strip(),
                    "city": (r.get("businesscity") or "").strip(),
                    "state": (r.get("businessstate") or "").strip(),
                    "zip": (r.get("businesszip") or "").strip(),
                }
        off += len(rows)
        print(f"  {off} contacts ({len(owners)} registrations)", flush=True)
        if len(rows) < PAGE:
            break

    # ---- 2. registrations: bbl -> registrationid ----
    print("downloading tesw-yqqr registrations...", flush=True)
    bbl_owner: dict[str, dict] = {}
    off = 0
    while True:
        rows = page(REG_ENDPOINT, off, "registrationid,boroid,block,lot")
        if not rows:
            break
        for r in rows:
            rid = r.get("registrationid")
            try:
                bbl = f"{int(r['boroid'])}{int(r['block']):05d}{int(r['lot']):04d}"
            except (KeyError, ValueError, TypeError):
                continue
            own = owners.get(rid or "")
            if own:
                bbl_owner[bbl] = own
        off += len(rows)
        print(f"  {off} registrations ({len(bbl_owner)} BBLs w/ owner)", flush=True)
        if len(rows) < PAGE:
            break

    print(f"maps: {len(owners)} contacts, {len(bbl_owner)} BBLs with owners", flush=True)

    # ---- 3. emit chunked SQL ----
    items = sorted(bbl_owner.items())
    chunk_rows = 2000
    files: list[str] = []
    n = 0
    buf = [
        "DROP TABLE IF EXISTS nyc_owner_map;",
        "CREATE TABLE nyc_owner_map (apn TEXT PRIMARY KEY, owner_name TEXT, "
        "owner_address TEXT, owner_city TEXT, owner_state TEXT, owner_zip TEXT, link_key TEXT);",
    ]
    for i, (bbl, o) in enumerate(items):
        buf.append(
            "INSERT OR REPLACE INTO nyc_owner_map VALUES ("
            f"{sql_str(bbl)},{sql_str(o['name'])},{sql_str(o['addr'])},"
            f"{sql_str(o['city'])},{sql_str(o['state'])},{sql_str(o['zip'])},"
            f"{sql_str(link_key(o['name']))});"
        )
        if (i + 1) % chunk_rows == 0 or i == len(items) - 1:
            n += 1
            path = os.path.join(OUT_DIR, f"chunk_{n:03d}.sql")
            with open(path, "w") as f:
                f.write("\n".join(buf) + "\n")
            files.append(path)
            buf = []

    update_path = os.path.join(OUT_DIR, "zz_update.sql")
    with open(update_path, "w") as f:
        f.write(
            f"UPDATE rental_licenses SET\n"
            f"  owner_name    = (SELECT m.owner_name    FROM nyc_owner_map m WHERE m.apn = rental_licenses.apn),\n"
            f"  owner_address = (SELECT m.owner_address FROM nyc_owner_map m WHERE m.apn = rental_licenses.apn),\n"
            f"  owner_city    = (SELECT m.owner_city    FROM nyc_owner_map m WHERE m.apn = rental_licenses.apn),\n"
            f"  owner_state   = (SELECT m.owner_state   FROM nyc_owner_map m WHERE m.apn = rental_licenses.apn),\n"
            f"  owner_zip     = (SELECT m.owner_zip     FROM nyc_owner_map m WHERE m.apn = rental_licenses.apn),\n"
            f"  link_key      = (SELECT m.link_key      FROM nyc_owner_map m WHERE m.apn = rental_licenses.apn)\n"
            f"WHERE feed_id = '{FEED_ID}'\n"
            f"  AND apn IN (SELECT apn FROM nyc_owner_map);\n"
            "DROP TABLE nyc_owner_map;\n"
        )
    files.append(update_path)
    print(f"wrote {len(files)} sql files to {OUT_DIR}", flush=True)

    if "--emit-only" in sys.argv:
        return
    apply_files(files)


def apply_files(files: list[str]) -> None:
    """Apply chunk files; idempotent, retry transient upload failures."""
    resume = 1
    if "--resume" in sys.argv:
        resume = int(sys.argv[sys.argv.index("--resume") + 1])
    for idx, path in enumerate(files, start=1):
        if idx < resume:
            continue
        for attempt in range(4):
            print(f"applying {os.path.basename(path)}"
                  + (f" (retry {attempt})" if attempt else "") + "...", flush=True)
            res = subprocess.run(
                WR + ["d1", "execute", DB, "--remote", "--file", path, "--json"],
                capture_output=True, text=True,
            )
            if res.returncode == 0:
                break
            print((res.stdout or res.stderr)[-800:], flush=True)
            time.sleep(5 * (attempt + 1))
        else:
            sys.exit(f"chunk failed after retries: {path} -- rerun with --resume {idx}")

    print("done. verify with:", flush=True)
    print(
        f"  {' '.join(WR)} d1 execute {DB} --remote --command \"SELECT COUNT(*) FROM "
        f"rental_licenses WHERE feed_id='{FEED_ID}' AND link_key IS NOT NULL\"",
        flush=True,
    )


if __name__ == "__main__":
    main()
