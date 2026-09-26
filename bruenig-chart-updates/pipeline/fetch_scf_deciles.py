#!/usr/bin/env python3
"""fetch_scf_deciles.py — reproduce Bruenig's SCF-2022 wealth-decile chart set
from the public summary extract (rscfp2022.dta inside scfp2022s.zip).

Source: https://www.federalreserve.gov/econres/files/scfp2022s.zip
  The summary extract is long-format: 5 rows per household (one per
  implicate; y1 = yy1*10 + implicate), wgt = full-sample household weight.

Method (mirrors the published SCF bulletin decile tables):
  For each of the 5 implicates:
    sort households by networth, assign each to the weighted decile
    (cumulative wgt share 0-10%,10-20%,...); share of group net worth held
    by decile d = sum(wgt*networth within decile) / sum(wgt*networth
    overall or within the subgroup), *100.
    Composition charts: within decile d, share of decile *population*
    (weighted household count) in each demographic category.
  Final values = mean across the 5 implicates.

Charts emitted (family 'wealth', all SCF 2022):
  decile shares overall:            series 'share'
  decile shares within subgroup:    race4 x {white,black,latino,other},
                                    age4 x {18-35,36-50,51-65,65+},
                                    edcl x {lt-hs,hs,some-college,college}
  composition of each decile:       series = category label,
                                    value = % of decile population
Not computable from the public extract (archived as originals only in
seed.py): Norway deciles (Statistics Norway data), Alaska deciles
(state-level SCF grouping not published).

Outputs: downloads/scfp2022s.zip, computed/wealth_deciles.csv
  columns: chart, series, x, value
"""

import os
import urllib.request
import zipfile

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DL = os.path.join(HERE, "downloads")
OUT = os.path.join(HERE, "computed")
URL = "https://www.federalreserve.gov/econres/files/scfp2022s.zip"
ZIP = os.path.join(DL, "scfp2022s.zip")
MEMBER = "rscfp2022.dta"
UA = {"User-Agent": "bruenig-chart-updates pipeline (research)"}

COLS = ["yy1", "y1", "wgt", "networth", "age", "edcl", "race"]

RACE_MAP = {1: "white", 2: "black", 3: "latino", 4: "other", 5: "other"}
EDCL_MAP = {1: "lt-hs", 2: "hs", 3: "some-college", 4: "college"}
EDCL_LABEL = {"lt-hs": "<HS", "hs": "HS", "some-college": "Some college",
              "college": "College"}
RACE_LABEL = {"white": "White", "black": "Black", "latino": "Latino",
              "other": "Other"}
AGE_LABEL = {"18-35": "18-35", "36-50": "36-50", "51-65": "51-65",
             "65+": "65+"}
DECILES = [f"D{i}" for i in range(1, 11)]


def download():
    if os.path.exists(ZIP) and os.path.getsize(ZIP) > 0:
        print(f"  cached {os.path.basename(ZIP)} ({os.path.getsize(ZIP):,} B)")
        return
    print(f"  GET {URL}")
    req = urllib.request.Request(URL, headers=UA)
    with urllib.request.urlopen(req, timeout=300) as r, \
            open(ZIP + ".part", "wb") as f:
        f.write(r.read())
    os.replace(ZIP + ".part", ZIP)


def age_group(a):
    if a <= 35:
        return "18-35"
    if a <= 50:
        return "36-50"
    if a <= 65:
        return "51-65"
    return "65+"


def decile_assign(df):
    """Assign weighted networth decile (1-10) within df (one implicate)."""
    s = df.sort_values("networth", kind="mergesort")
    cum = s["wgt"].cumsum() / s["wgt"].sum()
    # decile index: first decile = cumshare <= 0.1, etc.
    idx = np.minimum(np.ceil(cum * 10).astype(int), 10)
    idx = np.maximum(idx, 1)
    return pd.Series(idx.values, index=s.index)


def decile_shares(df):
    """% of group net worth held by each weighted decile (one implicate)."""
    d = decile_assign(df)
    wn = df["wgt"] * df["networth"]
    tot = wn.sum()
    return {f"D{i}": 100.0 * wn[d == i].sum() / tot for i in range(1, 11)}


def decile_composition(df, groupcol, order):
    """% of each decile's population in each category (one implicate)."""
    d = decile_assign(df).values
    out = {}
    for i in range(1, 11):
        sub = df[d == i]
        tot = sub["wgt"].sum()
        out[f"D{i}"] = {
            cat: 100.0 * sub.loc[sub[groupcol] == cat, "wgt"].sum() / tot
            for cat in order
        }
    return out


def main():
    os.makedirs(DL, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    download()

    with zipfile.ZipFile(ZIP) as z:
        with z.open(MEMBER) as f:
            df = pd.read_stata(f, columns=COLS)

    df["imp"] = df["y1"].astype(int) % 10
    df["agegrp"] = df["age"].map(age_group)
    df["racegrp"] = df["race"].map(RACE_MAP)
    df["edugrp"] = df["edcl"].map(EDCL_MAP)
    n_hh = df["yy1"].nunique()
    print(f"  {len(df):,} rows, {n_hh:,} households x "
          f"{df['imp'].nunique()} implicates")

    # accumulate per-implicate results, average at the end
    # spec: (chart, grouper) — grouper None = overall decile shares
    share_charts = [("wealth-decile-shares-2022", None)]
    share_charts += [(f"wealth-deciles-race-{g}-2022",
                      ("racegrp", g)) for g in RACE_LABEL]
    share_charts += [(f"wealth-deciles-age-{g.replace('+', '-plus')}-2022",
                      ("agegrp", g)) for g in AGE_LABEL]
    edu_slug = {"lt-hs": "less-than-hs", "hs": "hs-only",
                "some-college": "some-college", "college": "college"}
    share_charts += [(f"wealth-deciles-edu-{edu_slug[g]}-2022",
                      ("edugrp", g)) for g in EDCL_LABEL]

    acc = {chart: {x: [] for x in DECILES} for chart, _ in share_charts}
    comp_specs = [("wealth-decile-composition-age-2022", "agegrp",
                   list(AGE_LABEL)),
                  ("wealth-decile-composition-educ-2022", "edugrp",
                   list(EDCL_LABEL)),
                  ("wealth-decile-composition-race-2022", "racegrp",
                   list(RACE_LABEL))]
    comp_acc = {c: {x: {cat: [] for cat in order}
                    for x in DECILES} for c, _, order in comp_specs}

    for imp, g in df.groupby("imp"):
        g = g.reset_index(drop=True)
        for chart, spec in share_charts:
            sub = g if spec is None else g[g[spec[0]] == spec[1]]
            sh = decile_shares(sub)
            for x in DECILES:
                acc[chart][x].append(sh[x])
        for chart, col, order in comp_specs:
            comp = decile_composition(g, col, order)
            for x in DECILES:
                for cat in order:
                    comp_acc[chart][x][cat].append(comp[x][cat])

    rows = []
    for chart, _ in share_charts:
        for x in DECILES:
            rows.append({"chart": chart, "series": "share", "x": x,
                         "value": round(float(np.mean(acc[chart][x])), 4)})
    for chart, col, order in comp_specs:
        lab = {"agegrp": AGE_LABEL, "edugrp": EDCL_LABEL,
               "racegrp": RACE_LABEL}[col]
        for cat in order:
            for x in DECILES:
                rows.append({"chart": chart, "series": lab[cat], "x": x,
                             "value": round(
                                 float(np.mean(comp_acc[chart][x][cat])), 4)})

    out = pd.DataFrame(rows)
    path = os.path.join(OUT, "wealth_deciles.csv")
    out.to_csv(path, index=False)
    print(f"wrote {path} ({len(out)} rows)")
    print("overall decile shares:",
          out[(out.chart == "wealth-decile-shares-2022")]
          .pivot(index="x", columns="series", values="value")
          .round(1).to_string())


if __name__ == "__main__":
    main()
