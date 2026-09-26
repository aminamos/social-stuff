#!/usr/bin/env python3
"""seed.py — emit data/seed.sql and data/seed_releases.sql for D1.

Reads pipeline/computed/{poverty,wealth,intl,intl_gini,wealth_deciles}.csv
(produced by the fetch_* scripts) and emits idempotent INSERT OR REPLACE
statements matching schema.sql. Re-runnable: same inputs -> identical rows.

Usage: python pipeline/seed.py   (run from repo root or pipeline/)
"""

import csv
import json
import os
import datetime
import re

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
GINI_POST_URL = "https://peoplespolicyproject.org/2025/10/31/crunching-the-numbers-on-predistribution/"
GINI_POST_TITLE = "Crunching the Numbers on Predistribution"

# Original Bruenig chart SVGs, archived in R2 bucket
# bruenig-chart-updates-data under originals/<chart_slug>/<filename>.
# The SVGs embed fonts converted to paths — visual artifacts only, values
# come from our recomputation.
PPP_UPLOADS = "https://www.peoplespolicyproject.org/static/uploads"


def orig(r2_dir, ppp_path, title):
    """Provenance entry for one archived original chart artifact.

    r2_dir groups artifacts by source bundle: one dir per post chart-set
    ('wealth-post') or per standalone chart slug.
    """
    fn = ppp_path.rsplit("/", 1)[-1]
    return {"title": title,
            "source_url": f"{PPP_UPLOADS}/{ppp_path}",
            "r2_key": f"originals/{r2_dir}/{fn}"}


POVERTY_ORIGINALS = [
    ("2023/09/Who-Are-the-Poor_-SPM-Income-2021-2022-1.svg",
     "Who Are the Poor? SPM Income 2021-2022"),
    ("2023/09/Who-Are-The-Poor_-SPM-Income-2021.svg",
     "Who Are the Poor? SPM Income 2021"),
    ("2023/09/Who-Are-The-Poor_-SPM-Income-2022.svg",
     "Who Are the Poor? SPM Income 2022"),
]

# wealth post chart set: (slug, svg path, chart title, series spec)
# series spec: None = computed decile-share chart from wealth_deciles.csv;
# "comp:<col>" = composition chart; "original-only" = not computable.
WEALTH_SVG = "2023/10/"
WEALTH_CHARTS = [
    ("wealth-decile-shares-2022",
     "Share-of-Wealth-Held-by-Each-Wealth-Decile-2022.svg",
     "Share of Wealth Held by Each Wealth Decile, 2022", None),
    ("wealth-decile-composition-age-2022",
     "Age-Composition-of-Each-Wealth-Decile-2022.svg",
     "Age Composition of Each Wealth Decile, 2022", "comp:age"),
    ("wealth-decile-composition-educ-2022",
     "Educational-Composition-of-Each-Wealth-Decile-2022.svg",
     "Educational Composition of Each Wealth Decile, 2022", "comp:edu"),
    ("wealth-decile-composition-race-2022",
     "Racial-Composition-of-Each-Wealth-Decile-2022.svg",
     "Racial Composition of Each Wealth Decile, 2022", "comp:race"),
    ("wealth-deciles-race-white-2022",
     "Percent-of-White-Wealth-Owned-by-Each-White-Wealth-Decile-2022.svg",
     "Percent of White Wealth Owned by Each White Wealth Decile, 2022",
     None),
    ("wealth-deciles-race-black-2022",
     "Percent-of-Black-Wealth-Owned-by-Each-Black-Wealth-Decile-2022.svg",
     "Percent of Black Wealth Owned by Each Black Wealth Decile, 2022",
     None),
    ("wealth-deciles-race-latino-2022",
     "Percent-of-Latino-Wealth-Owned-by-Each-Latino-Wealth-Decile-2022.svg",
     "Percent of Latino Wealth Owned by Each Latino Wealth Decile, 2022",
     None),
    ("wealth-deciles-race-other-2022",
     "Percent-of-Other-Race-Wealth-Owned-by-Each-Other-Race-Wealth-Decile-2022.svg",
     "Percent of Other-Race Wealth Owned by Each Other-Race Wealth "
     "Decile, 2022", None),
    ("wealth-deciles-age-18-35-2022",
     "Percent-of-Age-18-35-Wealth-Owned-by-Each-18-35-Wealth-Decile-2022.svg",
     "Percent of Age-18-35 Wealth Owned by Each 18-35 Wealth Decile, "
     "2022", None),
    ("wealth-deciles-age-36-50-2022",
     "Percent-of-Age-36-50-Wealth-Owned-by-Each-36-50-Wealth-Decile-2022.svg",
     "Percent of Age-36-50 Wealth Owned by Each 36-50 Wealth Decile, "
     "2022", None),
    ("wealth-deciles-age-51-65-2022",
     "Percent-of-Age-51-65-Wealth-Owned-by-Each-51-65-Wealth-Decile-2022.svg",
     "Percent of Age-51-65 Wealth Owned by Each 51-65 Wealth Decile, "
     "2022", None),
    ("wealth-deciles-age-65-plus-2022",
     "Percent-of-Over-65-Wealth-Owned-by-Each-Over-65-Wealth-Decile-2022.svg",
     "Percent of Over-65 Wealth Owned by Each Over-65 Wealth Decile, "
     "2022", None),
    ("wealth-deciles-edu-less-than-hs-2022",
     "Percent-of-Wealth-Owned-by-Each-Wealth-Decile-Among-Those-With-Less-Than-a-HS-Education-2022.svg",
     "Percent of Wealth Owned by Each Wealth Decile Among Those With "
     "Less Than a HS Education, 2022", None),
    ("wealth-deciles-edu-hs-only-2022",
     "Percent-of-Wealth-Owned-by-Each-Wealth-Decile-Among-Those-With-Only-a-HS-Education-2022.svg",
     "Percent of Wealth Owned by Each Wealth Decile Among Those With "
     "Only a HS Education, 2022", None),
    ("wealth-deciles-edu-some-college-2022",
     "Percent-of-Wealth-Owned-by-Each-Wealth-Decile-Among-Those-With-Some-College-Education-2022.svg",
     "Percent of Wealth Owned by Each Wealth Decile Among Those With "
     "Some College Education, 2022", None),
    ("wealth-deciles-edu-college-2022",
     "Percent-of-Wealth-Owned-by-Each-Wealth-Decile-Among-Those-With-a-College-Degree-2022.svg",
     "Percent of Wealth Owned by Each Wealth Decile Among Those With a "
     "College Degree, 2022", None),
    ("wealth-deciles-norway-2019",
     "Percent-of-Wealth-Owned-by-Each-Wealth-Decile-Norway-2019.svg",
     "Percent of Wealth Owned by Each Wealth Decile, Norway 2019",
     "original-only"),
    ("wealth-deciles-alaska-2017-2020",
     "Percent-of-Alaskan-Wealth-Held-by-Each-Alaskan-Wealth-Decile-2017-2020.svg",
     "Percent of Alaskan Wealth Held by Each Alaskan Wealth Decile, "
     "2017-2020", "original-only"),
]

GINI_ORIGINALS = [
    ("2025/10/Market-Income-Gini-by-Age-Group-2019-OECD.svg",
     "Market Income Gini by Age Group, 2019, OECD"),
]

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

Coverage: income years 2021-2025 (ASEC releases 2022-2026; the new-format
public CSVs with embedded SPM fields begin with ASEC 2022). Older years
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

NOTE — no original chart: the anchor post embeds no chart images (text
only), and an exhaustive scan of all peoplespolicyproject.org posts found
no Bruenig chart publishing a cross-country market-vs-disposable poverty
comparison. This chart is OUR EXTENSION of his analysis.

x values are 'ISO3:YYYY' (country code : that country's latest data year)
because country coverage years differ.
"""

SCF_DECILE_RECIPE = """\
Reproduces Bruenig's SCF-2022 wealth-decile chart set ("Wealth
Distribution in 2022", Oct 2023) directly from the SCF public summary
extract (scfp2022s.zip -> rscfp2022.dta) — the same data he used.

Unit: SCF household; weight = WGT; net worth = NETWORTH. The extract is
long-format with 5 rows per household (implicates); shares/compositions
are computed within each implicate and averaged across the 5.

Deciles: households sorted by networth; weighted decile cut points from
the cumulative weight distribution (D1 = bottom 10% of households, D10 =
top 10%). Decile share = sum(wgt*networth in decile) / sum(wgt*networth
in scope). For subgroup charts, decile cut points AND the share
denominator are computed within the subgroup (e.g. deciles of the white
wealth distribution share white wealth).

Composition charts: for each wealth decile, the share of the decile's
population (weighted household count) in each demographic category.

Group mappings (head-of-household variables):
  age   -> exact AGE grouped 18-35 / 36-50 / 51-65 / 65+
  edcl  -> 1 <HS, 2 HS only, 3 some college, 4 college degree
  race  -> 1 White, 2 Black, 3 Latino, 4+5 'Other' (the public extract's
           RACE codes 4-5 are folded into Bruenig's 'Other race' bucket)

Validation: overall decile shares agree with the Fed's published 2022
SCF bulletin tables (top decile ~73%, bottom 50% ~2-3%).
"""

GINI_RECIPE = """\
Market-income Gini by age group across OECD countries — reproduces the
OECD chart in "Crunching the Numbers on Predistribution" (Oct 2025).

Source: OECD IDD (DF_IDD), measure INC_MRKT_GINI, unit 0_TO_1,
methodology METH2012 / definition D_CUR, age groups Y18T65
(working-age 18-65), Y_GT65 (over 65), _T (all). Bruenig's original used
2019; ours shows each country's latest available year.

x values are 'ISO3:YYYY' (country : latest data year); each country has
three series (working-age, 65+, total).
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
    gini = read_csv("intl_gini.csv")        # ref_area, age, year, value
    wdec = read_csv("wealth_deciles.csv")   # chart, series, x, value

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
                "asecpub22csv.zip / asecpub23csv.zip / asecpub24csv.zip / "
                "asecpub25csv.zip / asecpub26csv.zip -> pppub{NN}.csv"
            ),
            "recipe_md": POVERTY_RECIPE,
            "original_charts": [
                orig(slug, p, t) for p, t in POVERTY_ORIGINALS],
            # income years covered by the original post's charts
            "original_window": {"first_x": "2021", "last_x": "2022"},
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
            # our extension — no corresponding original in the post
            "original_charts": [],
            "original_window": {"first_x": None, "last_x": None},
            "extension_note": (
                "Quarterly extension of Bruenig's 2022 SCF snapshot using "
                "the Fed DFA; no single original chart in the post shows "
                "shares over time."
            ),
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

        # ---------- wealth: SCF 2022 decile chart set ----------
        # rows in wealth_deciles.csv keyed by chart slug
        dec_by_chart = {}
        for r in wdec:
            dec_by_chart.setdefault(r["chart"], []).append(r)
        for cslug, svg, ctitle, spec in WEALTH_CHARTS:
            o = orig("wealth-post", WEALTH_SVG + svg, ctitle)
            prov = {
                "bruenig_post_url": WEALTH_POST_URL,
                "bruenig_post_title": WEALTH_POST_TITLE,
                "source_name": "Survey of Consumer Finances 2022, public "
                               "summary extract",
                "source_url": "https://www.federalreserve.gov/econres/"
                              "scfindex.htm",
                "source_detail": "scfp2022s.zip -> rscfp2022.dta "
                                 "(wgt x networth, 5 implicates)",
                "recipe_md": SCF_DECILE_RECIPE,
                "original_charts": [o],
                "original_window": {"first_x": "D1", "last_x": "D10"},
            }
            if spec == "original-only":
                prov["recipe_md"] += (
                    "\nUPDATE PENDING — not computable from public SCF "
                    "extract (requires non-US / restricted-source data). "
                    "Original chart only.\n"
                )
                emit_chart(f, cslug, "wealth", ctitle,
                           "Original chart — update not computable "
                           "from public data", prov)
                f.write("\n")
                continue
            emit_chart(f, cslug, "wealth", ctitle,
                       "Recomputed from SCF 2022 public microdata "
                       "(5 implicates, weighted)", prov)
            chart_rows = dec_by_chart.get(cslug, [])
            # explicit suffixes — '<HS' and 'HS' would collide under a
            # generic sanitize, and '65+' must stay URL/HTML-safe.
            sfx_map = {"share": "share", "<HS": "lt-hs", "HS": "hs",
                       "Some college": "some-college",
                       "College": "college", "White": "white",
                       "Black": "black", "Latino": "latino",
                       "Other": "other", "18-35": "18-35",
                       "36-50": "36-50", "51-65": "51-65",
                       "65+": "65-plus"}
            emitted = set()
            for r in chart_rows:
                if r["series"] not in emitted:
                    emitted.add(r["series"])
                    lab = ("Share of group net worth (%)"
                           if r["series"] == "share" else r["series"])
                    emit_series(f, cslug, sfx_map[r["series"]], lab)
            for r in chart_rows:
                emit_point(f, f"{cslug}:{sfx_map[r['series']]}",
                           r["x"], r["value"])
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
            # anchor post embeds no charts — ours is an extension (see recipe)
            "original_charts": [],
            "original_window": {"first_x": None, "last_x": None},
            "extension_note": (
                "Anchor post is text-only; no Bruenig chart publishes this "
                "cross-country poverty cut. Our extension."
            ),
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
        f.write("\n")

        # ---------- intl: market-income Gini by age group ----------
        # reproduces the OECD chart in "Crunching the Numbers on
        # Predistribution" — latest available year per country.
        slug = "intl-market-gini-age"
        gini_latest = {}
        for r in gini:
            y = int(r["year"])
            k = (r["ref_area"], r["age"])
            if k not in gini_latest or y > gini_latest[k]:
                gini_latest[k] = y
        prov = {
            "bruenig_post_url": GINI_POST_URL,
            "bruenig_post_title": GINI_POST_TITLE,
            "source_name": "OECD Income Distribution Database (DF_IDD)",
            "source_url": "https://sdmx.oecd.org/public/rest/v1/data/"
                          "OECD.WISE.INE,DSD_WISE_IDD@DF_IDD/"
                          ".A.INC_MRKT_GINI._Z.0_TO_1."
                          "Y18T65+Y_GT65+_T.METH2012.D_CUR._Z",
            "source_detail": "SDMX CSV, key dims documented in recipe",
            "recipe_md": GINI_RECIPE,
            "original_charts": [
                orig(slug, p, t) for p, t in GINI_ORIGINALS],
            # x encodes 'ISO3:YYYY' — no contiguous x-window marks the
            # original vintage; styling falls back to the divider rule.
            "original_window": {"first_x": None, "last_x": None},
        }
        emit_chart(f, slug, "intl",
                   "Market-income Gini by age group, US and OECD peers",
                   "Gini coefficient of market income by age group, "
                   "latest available year per country (OECD IDD)", prov)
        gids = {
            "Y18T65": emit_series(f, slug, "working-age",
                                  "Market-income Gini, ages 18-65",
                                  unit="gini"),
            "Y_GT65": emit_series(f, slug, "65-plus",
                                  "Market-income Gini, ages 65+",
                                  unit="gini"),
            "_T": emit_series(f, slug, "total",
                              "Market-income Gini, all ages",
                              unit="gini"),
        }
        gini_rows = {}
        for r in gini:
            k = (r["ref_area"], r["age"])
            if int(r["year"]) == gini_latest[k]:
                gini_rows[k] = r
        for (c, age), r in sorted(
                gini_rows.items(),
                key=lambda kv: (kv[0][0] != "USA",
                                kv[0][0], kv[0][1])):
            emit_point(f, gids[age], f"{c}:{gini_latest[(c, age)]}",
                       r["value"])

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
