#!/usr/bin/env python3
"""Coverage tests for rural-planning-bot.a-8c6.workers.dev.

Regression suite for the 2026-09-15 under-detection fix: the site's
"GIS portal" column showed 2/60 yes because detection only matched
ArcGIS Hub sites and missed Beacon/qPublic, Pro-West Link, and
county-hosted ArcGIS viewers. These tests run against the live public
API (/api/counties) so they catch data regressions no matter where
the worker source or seed data lives.

Run:  python test_coverage.py
      python test_coverage.py --offline   # skip live-URL checks
"""

import json
import re
import ssl
import sys
import unittest
import urllib.request

if sys.stdout:
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr:
    sys.stderr.reconfigure(encoding="utf-8")

BASE = "https://rural-planning-bot.a-8c6.workers.dev"

# Minnesota's 60 nonmetro counties per USDA ERS — the full expected set.
EXPECTED_COUNTIES = {
    "Aitkin", "Becker", "Beltrami", "Big Stone", "Brown", "Cass",
    "Chippewa", "Clearwater", "Cook", "Cottonwood", "Crow Wing",
    "Douglas", "Faribault", "Freeborn", "Goodhue", "Grant", "Hubbard",
    "Itasca", "Jackson", "Kanabec", "Kandiyohi", "Kittson",
    "Koochiching", "Lac qui Parle", "Lake", "Lake of the Woods",
    "Lincoln", "Lyon", "Mahnomen", "Marshall", "Martin", "McLeod",
    "Meeker", "Morrison", "Mower", "Murray", "Nobles", "Norman",
    "Otter Tail", "Pennington", "Pine", "Pipestone", "Pope",
    "Red Lake", "Redwood", "Renville", "Rice", "Roseau", "Sibley",
    "Steele", "Stevens", "Swift", "Todd", "Traverse", "Wadena",
    "Waseca", "Watonwan", "Wilkin", "Winona", "Yellow Medicine",
}

VALID_STATUS = {"pending", "needs_review", "verified", "loaded"}

# Counties confirmed (2026-09-15) to expose no public parcel service:
# Big Stone REST dir publishes only FiberMap; Cottonwood's AGO "View"
# app has no confirmed parcel layer. No *new* county may join this set.
KNOWN_PARCEL_GAPS = {"Big Stone", "Cottonwood"}

# beacon.schneidercorp.com TLS-fingerprints and 403s non-browser clients.
# A 403 from this host means "bot-blocked", not "missing" — treat it as
# reachable; any other beacon failure mode (404/DNS) still fails.
BOT_BLOCKED_HOSTS = {"beacon.schneidercorp.com"}

URL_FIELDS = (
    "gis_portal_url", "gis_parcels_service_url", "zoning_ordinance_url",
    "city_code_url", "assessor_url",
)

_SSL = ssl.create_default_context()
_SSL.check_hostname = False
_SSL.verify_mode = ssl.CERT_NONE
_UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36"}


def fetch(url, timeout=30):
    """GET with a browser UA — the worker's zone 403s default
    Python-urllib clients."""
    req = urllib.request.Request(url, headers=_UA)
    return urllib.request.urlopen(req, timeout=timeout, context=_SSL)


def http_status(url, timeout=20):
    try:
        return fetch(url, timeout).status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return None


class CoverageTests(unittest.TestCase):
    """Data invariants — these would have caught the under-detection."""

    @classmethod
    def setUpClass(cls):
        cls.rows = json.loads(fetch(f"{BASE}/api/counties").read())
        cls.by_name = {r["county"]: r for r in cls.rows}

    def test_exactly_the_60_nonmetro_counties(self):
        names = {r["county"] for r in self.rows}
        self.assertEqual(names, EXPECTED_COUNTIES,
                         f"missing={sorted(EXPECTED_COUNTIES - names)} "
                         f"extra={sorted(names - EXPECTED_COUNTIES)}")

    def test_every_county_has_gis_portal(self):
        """The core regression: detection bias left 58/60 NULL."""
        missing = [c for c, r in self.by_name.items()
                   if not r["gis_portal_url"]]
        self.assertEqual(missing, [],
                         "counties with no GIS portal recorded — "
                         "likely under-detection again")

    def test_parcels_coverage_no_new_gaps(self):
        missing = {c for c, r in self.by_name.items()
                   if not r["gis_parcels_service_url"]}
        self.assertLessEqual(missing, KNOWN_PARCEL_GAPS,
                             f"new parcel gaps: "
                             f"{sorted(missing - KNOWN_PARCEL_GAPS)}")
        fixed = KNOWN_PARCEL_GAPS - missing
        if fixed:
            print(f"  note: known gaps now filled: {sorted(fixed)} "
                  f"— shrink KNOWN_PARCEL_GAPS")

    def test_status_values_valid(self):
        bad = [(r["county"], r["status"]) for r in self.rows
               if r["status"] not in VALID_STATUS]
        self.assertEqual(bad, [])

    def test_urls_wellformed(self):
        bad = []
        for r in self.rows:
            for f in URL_FIELDS:
                v = r.get(f)
                if v is not None and not re.match(r"^https?://[^\s/]+", v):
                    bad.append((r["county"], f, v))
        self.assertEqual(bad, [])


@unittest.skipIf("--offline" in sys.argv, "offline mode")
class LiveUrlTests(unittest.TestCase):
    """Stored URLs must still resolve — catches link rot."""

    @classmethod
    def setUpClass(cls):
        cls.rows = json.loads(fetch(f"{BASE}/api/counties").read())

    def test_gis_portal_urls_resolve(self):
        from concurrent.futures import ThreadPoolExecutor
        pairs = [(r["county"], r["gis_portal_url"])
                 for r in self.rows if r["gis_portal_url"]]

        def check(pair):
            county, url = pair
            host = re.match(r"^https?://([^/]+)", url).group(1)
            code = http_status(url)
            if code == 403 and host in BOT_BLOCKED_HOSTS:
                return None  # bot-blocked but alive
            if code is None or code >= 400:
                return (county, url, code)
            return None

        with ThreadPoolExecutor(12) as ex:
            failures = [f for f in ex.map(check, pairs) if f]
        self.assertEqual(failures, [])

    def test_homepage_renders_no_false_negatives(self):
        html = fetch(BASE + "/").read().decode("utf-8", "ignore")
        rows = re.findall(
            r'<tr><td><a href="/county/[^"]+">([^<]+)</a></td>'
            r"<td>([^<]+)</td><td>(yes|no)</td><td>(yes|no)</td></tr>",
            html)
        gis_no = [c for c, _s, g, _p in rows if g == "no"]
        self.assertEqual(len(rows), 60)
        self.assertEqual(gis_no, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
