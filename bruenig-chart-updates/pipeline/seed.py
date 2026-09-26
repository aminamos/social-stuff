#!/usr/bin/env python3
"""seed.py — emit data/seed.sql and data/seed_releases.sql for D1.

Reads pipeline/computed/{poverty,wealth,intl}.csv (produced by the fetch_*
scripts) and emits idempotent INSERT OR REPLACE statements matching
schema.sql. Re-runnable: same inputs -> identical rows.

Usage: python pipeline/seed.py   (run from repo root or pipeline/)
"""

import csv
import json
import os
import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)            # bruenig-chart-updates/
COMPUTED = os.path.join(HERE, "computed")
DATA = os.path.join(ROOT, "data")
NOW = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

POVERTY_POST_URL = "https://www.peoplespolicyproject.org/2023/09/18/who-are-the-poor-in-2021-and-2022/"
POVERTY_POST_TITLE = "Who Are the Poor in 2021 and 2022?"
WEALTH_POST_URL = "https://peoplespolicyproject.org/2023/10/23/wealth-distribution-in-2022/"
WEALTH_POST_TITLE = "Wealth Distribution in 2022"
INTL_POST_URL = "https://peoplespolicyproject.org/2025/10/07/does-europe-use-market-incomes-to-achieve-equality/"
INTL_POST_TITLE = "Does Europe Use Market Incomes to Achieve Equality?"

POVERTY_RECIPE = """\
Replicates Bruenig's recurring market-vs-disposable poverty charts
(e.g. the 'Who Are the Poor' series and 'The US Welfare State Cut Poverty
by Two-Thirds') on the newest CPS ASEC microdata.

Unit of analysis: SPM resource unit (SPM_ID) — Bruenig: "I use the family
unit definition provided by the Supplemental Poverty Measure."

Market income (unit total over members' person records):
  WSAL_VAL + SEMP_VAL + FRSE_VAL (earnings),
  INT_VAL + DIV_VAL + RNT_VAL + CAP_VAL (capital income),
  ANN_VAL + PEN_VAL1 + PEN_VAL2 + PNSN_VAL + RINT_VAL1 + RINT_VAL2
    (private pensions, annuities, retirement-account income),
  CSP_VAL (child support received — a private transfer, counted as market
    income by Bruenig's "gross cash income from non-governmental sources").
Government cash transfers (SS, SSI, public assistance, UI, workers comp,
veterans', disability, survivor, other) and tax credits are excluded.

Disposable income: SPM_RESOURCES — Census's SPM resource measure, equal to
market income plus cash and near-cash government benefits and refundable
credits minus taxes, medical out-of-pocket spending, childcare, work
expenses, and child support paid. Bruenig uses the same concept.

Poverty line: SPM_POVTHRESHOLD, the unit's official SPM threshold.
NOTE — approximation vs Bruenig's older work: some earlier posts used a
fixed single-person line scaled by sqrt(family size) or 50% of median
equivalized income; here the official SPM threshold is used instead, so
levels differ modestly from those posts. Disposable rates match the
published Census SPM rates within ~0.2pp.

Weights: SPM_WEIGHT (unit weight propagated to members), so rates are
person-weighted. Children = A_AGE < 18.

Coverage: income years 2022-2025 (ASEC releases 2023-2026; the new-format
public CSVs with embedded SPM fields begin with ASEC 2023). Older years
use the legacy fixed-width files with different variable names — not yet
implemented; extend fetch_asec.py to add them.
"""

WEALTH_RECIPE = """\
Updates Bruenig's SCF wealth-distribution charts ("Wealth Distribution in
2022", Oct 2023) using the Federal Reserve's Distributional Financial
Accounts (DFA), the official SCF-derived distributional series.

Series (share of total household net worth, %):
  top1     = TopPt1 + RemainingTop1  (top 0.1% + 99th-99.9th percentile)
  top10    = top1 + Next9
  bottom50 = Bottom50
Points are quarterly ('YYYY:Qn'), 1989:Q3 to the latest published quarter —
more current than the triennial SCF itself.

NOTE — source difference: Bruenig's charts use SCF microdata directly.
The SCF public summary tables do not break out a top-1% net-worth band,
so we use the DFA, which the Fed calibrates to the SCF. SCF-vintage values
agree with his figures (2022: top 10% ~73%, bottom 50% ~2%). The 'scf'
release row still keys off scfindex.htm (the triennial survey); the DFA
zips refresh quarterly — re-running fetch_scf.py updates the chart
between SCF releases.
"""

INTL_RECIPE = """\
US vs peer-country poverty: OECD Income Distribution Database (DF_IDD)
via the SDMX REST API, measures PR_INC_MRKT (market income) and
PR_INC_DISP (disposable income), total population, post-2012 income
definition (METH2012 / D_CUR), poverty line = 50% of median disposable
income (PL_50). Latest available year per country.

This is the same market-vs-disposable frame Bruenig uses in "Does Europe
Use Market Incomes to Achieve Equality?" (Oct 2025) and the welfare-state
posts; OECD definitions differ from the CPS ASEC recipe used for the US
series (equivalized disposable household income, 50%-of-median line), so
cross-family comparisons are indicative only.

x values are 'ISO3:YYYY' (country code : that country's latest data year)
because country coverage years differ.
"""


def esc(s):
    return s.replace("'", "''")


def emit_chart(f, slug, family, title, subtitle, provenance):
    prov = json.dumps(provenance, indent=None)
    sub = "NULL" if subtitle is None else f"'{esc(subtitle)}'"
    f.write(
        "INSERT OR REPLACE INTO charts (slug, family, title, subtitle, provenance, updated_at)\n"
        f"VALUES ('{esc(slug)}', '{family}', '{esc(title)}', {sub}, "
        f"'{esc(prov)}', '{NOW}');\n\n"
    )


def emit_series(f, chart_slug, sid_suffix, label, unit="percent"):
    sid = f"{chart_slug}:{sid_suffix}"
    f.write(
        "INSERT OR REPLACE INTO series (id, chart_slug, label, unit, updated_at)\n"
        f"VALUES ('{sid}', '{chart_slug}', '{esc(label)}', '{esc(unit)}', '{NOW}');\n"
    )
    return sid


def emit_point(f, series_id, x, y):
    f.write(
        "INSERT OR REPLACE INTO points (series_id, x, y) "
        f"VALUES ('{series_id}', '{esc(str(x))}', {float(y)});\n"
    )


def read_csv(name):
    path = os.path.join(COMPUTED, name)
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def main():
    os.makedirs(DATA, exist_ok=True)

    pov = read_csv("poverty.csv")           # income_year, series, value
    wealth = read_csv("wealth.csv")         # quarter, series, value
    intl = read_csv("intl.csv")             # ref_area, measure, year, value

    pov_years = sorted({int(r["income_year"]) for r in pov})
    wq = sorted({r["quarter"] for r in wealth})
    intl_latest = {}
    for r in intl:
        y = int(r["year"])
        if r["ref_area"] not in intl_latest or y > intl_latest[r["ref_area"]]:
            intl_latest[r["ref_area"]] = y
    intl_max_year = max(intl_latest.values())
    n_intl_countries = len(intl_latest)

    seed_path = os.path.join(DATA, "seed.sql")
    with open(seed_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(f"-- generated by pipeline/seed.py at {NOW} UTC\n")
        f.write("-- idempotent: INSERT OR REPLACE throughout\n\n")

        # ---------- poverty ----------
        slug = "market-vs-disposable-poverty"
        subtitle = (
            f"US poverty rates under Bruenig's market-income vs SPM-disposable "
            f"income definitions, income years {pov_years[0]}-{pov_years[-1]} "
            f"(CPS ASEC microdata)"
        )
        prov = {
            "bruenig_post_url": POVERTY_POST_URL,
            "bruenig_post_title": POVERTY_POST_TITLE,
            "source_name": "CPS ASEC public-use files (person CSV)",
            "source_url": "https://www2.census.gov/programs-surveys/cps/datasets/",
            "source_detail": (
                "asecpub23csv.zip / asecpub24csv.zip / asecpub25csv.zip / "
                "asecpub26csv.zip -> pppub{NN}.csv"
            ),
            "recipe_md": POVERTY_RECIPE,
        }
        emit_chart(f, slug, "poverty",
                   "Market vs disposable income poverty (US)", subtitle, prov)
        sids = {
            "market_total": emit_series(f, slug, "market", "Market-income poverty (all persons)"),
            "disposable_total": emit_series(f, slug, "disposable", "Disposable-income poverty (all persons, SPM)"),
            "market_child": emit_series(f, slug, "market-children", "Market-income poverty (children <18)"),
            "disposable_child": emit_series(f, slug, "disposable-children", "Disposable-income poverty (children <18, SPM)"),
        }
        for r in pov:
            emit_point(f, sids[r["series"]], r["income_year"], r["value"])
        f.write("\n")

        # ---------- wealth ----------
        slug = "wealth-shares"
        subtitle = (
            f"Share of US household net worth, {wq[0]} to {wq[-1]} "
            "(Federal Reserve Distributional Financial Accounts)"
        )
        prov = {
            "bruenig_post_url": WEALTH_POST_URL,
            "bruenig_post_title": WEALTH_POST_TITLE,
            "source_name": "Fed Distributional Financial Accounts (SCF-derived)",
            "source_url": "https://www.federalreserve.gov/releases/efa/efa-distributional-financial-accounts.htm",
            "source_detail": "dfa.zip -> dfa-networth-shares.csv",
            "recipe_md": WEALTH_RECIPE,
        }
        emit_chart(f, slug, "wealth", "Wealth shares by percentile group (US)",
                   subtitle, prov)
        wsids = {
            "top1": emit_series(f, slug, "top-1", "Top 1% share of net worth"),
            "top10": emit_series(f, slug, "top-10", "Top 10% share of net worth"),
            "bottom50": emit_series(f, slug, "bottom-50", "Bottom 50% share of net worth"),
        }
        for r in wealth:
            emit_point(f, wsids[r["series"]], r["quarter"], r["value"])
        f.write("\n")

        # ---------- intl ----------
        slug = "intl-market-vs-disposable-poverty"
        subtitle = (
            f"Poverty rate at 50% of median disposable income, latest "
            f"available year per country (OECD IDD; latest year {intl_max_year})"
        )
        prov = {
            "bruenig_post_url": INTL_POST_URL,
            "bruenig_post_title": INTL_POST_TITLE,
            "source_name": "OECD Income Distribution Database (DF_IDD)",
            "source_url": "https://sdmx.oecd.org/public/rest/v1/data/OECD.WISE.INE,DSD_WISE_IDD@DF_IDD/.A.PR_INC_DISP+PR_INC_MRKT._Z.PT_POP._T.METH2012.D_CUR.PL_50",
            "source_detail": "SDMX CSV, key dims documented in recipe",
            "recipe_md": INTL_RECIPE,
        }
        emit_chart(f, slug, "intl",
                   "Market vs disposable poverty, US and OECD peers",
                   subtitle, prov)
        isids = {
            "PR_INC_MRKT": emit_series(f, slug, "market", "Market-income poverty rate"),
            "PR_INC_DISP": emit_series(f, slug, "disposable", "Disposable-income poverty rate"),
        }
        # latest year per country only — bar chart, USA first then by disp desc
        latest_rows = {}
        for r in intl:
            if int(r["year"]) == intl_latest[r["ref_area"]]:
                latest_rows[(r["ref_area"], r["measure"])] = r
        order = sorted(
            intl_latest.keys(),
            key=lambda c: (
                c != "USA",
                -float(latest_rows.get((c, "PR_INC_DISP"), {"value": "0"})["value"]),
            ),
        )
        for c in order:
            x = f"{c}:{intl_latest[c]}"
            for m in ("PR_INC_MRKT", "PR_INC_DISP"):
                r = latest_rows.get((c, m))
                if r:
                    emit_point(f, isids[m], x, r["value"])

    # ---------- releases ----------
    rel_path = os.path.join(DATA, "seed_releases.sql")
    with open(rel_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(f"-- generated by pipeline/seed.py at {NOW} UTC\n")
        f.write("INSERT OR REPLACE INTO releases "
                "(dataset, label, source_index_url, latest_vintage, checked_at, stale) VALUES\n")
        rows = [
            ("cps-asec", "CPS ASEC public-use files (new-format CSV)",
             "https://www2.census.gov/programs-surveys/cps/datasets/",
             str(max(pov_years) + 1), NOW, 0),
            ("scf", "Survey of Consumer Finances",
             "https://www.federalreserve.gov/econres/scfindex.htm",
             "2022", NOW, 0),
            ("oecd-idd", "OECD Income Distribution Database (DF_IDD)",
             "https://sdmx.oecd.org/public/rest/v1/data/OECD.WISE.INE,DSD_WISE_IDD@DF_IDD/USA.A.PR_INC_DISP._Z.PT_POP._T.METH2012.D_CUR.PL_50",
             str(intl_max_year), NOW, 0),
        ]
        f.write(",\n".join(
            f"('{d}', '{esc(l)}', '{esc(u)}', '{v}', '{c}', {s})"
            for d, l, u, v, c, s in rows) + ";\n")

    print(f"wrote {seed_path}")
    print(f"wrote {rel_path}")
    print(f"poverty years: {pov_years} | wealth quarters: {wq[0]}..{wq[-1]} "
          f"| intl countries: {n_intl_countries} latest<= {intl_max_year}")


if __name__ == "__main__":
    main()
