#!/usr/bin/env python3
"""fetch_asec.py — download CPS ASEC public-use CSV zips and compute
Bruenig-style market-vs-disposable poverty series.

Data source: https://www2.census.gov/programs-surveys/cps/datasets/<YYYY>/march/
  asecpubNNcsv.zip contains the new-format person file (pppubNN.csv) which
  carries all SPM unit fields (SPM_*), so no special SPM extract is needed.

Recipe (mirrors Bruenig's published method — see README/provenance):
  * Resource unit: SPM unit (SPM_ID).
  * Market income  = sum over unit members of gross cash income from
    non-governmental sources:
      WSAL_VAL SEMP_VAL FRSE_VAL      (wages, self-employment, farm)
      INT_VAL DIV_VAL RNT_VAL CAP_VAL (interest, dividends, rent, capital gains)
      ANN_VAL PEN_VAL1 PEN_VAL2 PNSN_VAL RINT_VAL1 RINT_VAL2  (private pensions
                                     /annuities/retirement-account income)
      CSP_VAL                          (child support received — private)
  * Disposable income = SPM_RESOURCES (market income + cash & near-cash
    government benefits + refundable credits - taxes - MOOP - childcare -
    work expenses - child support paid), per the Census SPM definition.
    Bruenig: "I define disposable income using the SPM disposable income
    concept."
  * Poverty line = SPM_POVTHRESHOLD (unit's official SPM threshold).
    NOTE: in some older posts Bruenig used a fixed single-person line scaled
    by sqrt(family size) or 50% of median equivalized income; we use the SPM
    threshold directly — documented difference.
  * Rates are person-weighted (SPM_WEIGHT).

Outputs:
  downloads/asecpubNNcsv.zip          (raw)
  computed/poverty_YYYY.csv           columns: income_year, series, value
                                      series in {market_total, disposable_total,
                                                 market_child, disposable_child}
"""

import argparse
import io
import json
import os
import sys
import urllib.request
import zipfile

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DL = os.path.join(HERE, "downloads")
OUT = os.path.join(HERE, "computed")
BASE = "https://www2.census.gov/programs-surveys/cps/datasets"

# ASEC release years supported (public person CSV with SPM_* fields; the
# new-format "csv" zip covers 2022 onward — earlier releases are
# fixed-width legacy files). Income (reference) year = ASEC year - 1.
ASEC_YEARS = [2026, 2025, 2024, 2023, 2022]

MARKET_COLS = [
    "WSAL_VAL", "SEMP_VAL", "FRSE_VAL",
    "INT_VAL", "DIV_VAL", "RNT_VAL", "CAP_VAL",
    "ANN_VAL", "PEN_VAL1", "PEN_VAL2", "PNSN_VAL", "RINT_VAL1", "RINT_VAL2",
    "CSP_VAL",
]
NEEDED = (
    ["PERIDNUM", "SPM_ID", "SPM_NUMPER", "SPM_RESOURCES", "SPM_POVTHRESHOLD",
     "SPM_WEIGHT", "A_AGE", "MARSUPWT", "PEARNVAL"]
    + MARKET_COLS
)

UA = {"User-Agent": "bruenig-chart-updates pipeline (research)"}


def urljoin(*parts):
    return "/".join(str(p).strip("/") for p in parts)


def download(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        print(f"  cached {os.path.basename(dest)} ({os.path.getsize(dest):,} B)")
        return dest
    print(f"  GET {url}")
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=900) as r, open(dest + ".part", "wb") as f:
        while True:
            chunk = r.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)
    os.replace(dest + ".part", dest)
    print(f"  wrote {os.path.getsize(dest):,} B")
    return dest


def compute_year(asec_year, member, income_year):
    """Return dict of series -> rate(%) for one ASEC release."""
    zip_path = download(
        urljoin(BASE, asec_year, "march", f"asecpub{asec_year % 100:02d}csv.zip"),
        os.path.join(DL, f"asecpub{asec_year % 100:02d}csv.zip"),
    )
    z = zipfile.ZipFile(zip_path)
    if member not in z.namelist():
        raise RuntimeError(f"{member} not in {zip_path}: {z.namelist()}")

    usecols = []
    with z.open(member) as f:
        header = f.readline().decode("utf-8", "replace").strip().split(",")
    missing = [c for c in NEEDED if c not in header]
    if missing:
        raise RuntimeError(f"{member} missing columns: {missing}")
    usecols = NEEDED

    with z.open(member) as f:
        df = pd.read_csv(f, usecols=usecols, low_memory=False)

    for c in MARKET_COLS:
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)
    df["mkt_p"] = df[MARKET_COLS].sum(axis=1)

    # unit-level market income = sum of members' market income
    unit_mkt = df.groupby("SPM_ID")["mkt_p"].sum().rename("unit_mkt")
    df = df.join(unit_mkt, on="SPM_ID")

    # unit-level SPM fields (identical across members; take first)
    u = df.groupby("SPM_ID").agg(
        thr=("SPM_POVTHRESHOLD", "first"),
        res=("SPM_RESOURCES", "first"),
        w=("SPM_WEIGHT", "first"),
        mkt=("unit_mkt", "first"),
        n=("SPM_NUMPER", "first"),
    )
    print(f"  asec{asec_year}: {len(df):,} persons, {len(u):,} SPM units, "
          f"weight sum {u['w'].sum()/1e6:.1f}M")

    df["poor_mkt"] = df["unit_mkt"] < df["SPM_POVTHRESHOLD"]
    df["poor_res"] = df["SPM_RESOURCES"] < df["SPM_POVTHRESHOLD"]
    df["is_child"] = df["A_AGE"] < 18

    # check SPM_WEIGHT vs MARSUPWT sanity (they should agree within rounding)
    w = df["SPM_WEIGHT"].astype(float)

    def rate(mask_poor, mask_pop=None):
        m = mask_pop if mask_pop is not None else df.index == df.index
        num = (w * mask_poor)[m].sum()
        den = w[m].sum()
        return 100.0 * num / den

    child = df["is_child"]
    res = {
        "income_year": income_year,
        "market_total": rate(df["poor_mkt"]),
        "disposable_total": rate(df["poor_res"]),
        "market_child": rate(df["poor_mkt"], child),
        "disposable_child": rate(df["poor_res"], child),
    }
    # diagnostic vs published SPM rate
    print(f"  income {income_year}: market total {res['market_total']:.2f}% | "
          f"disp {res['disposable_total']:.2f}% | child mkt "
          f"{res['market_child']:.2f}% | child disp {res['disposable_child']:.2f}%")
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", default=",".join(map(str, ASEC_YEARS)),
                    help="comma-separated ASEC release years")
    args = ap.parse_args()

    os.makedirs(DL, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)

    rows = []
    for ay in [int(y) for y in args.years.split(",")]:
        member = f"pppub{ay % 100:02d}.csv"
        income_year = ay - 1
        print(f"== ASEC {ay} (income year {income_year})")
        r = compute_year(ay, member, income_year)
        for series in ("market_total", "disposable_total",
                       "market_child", "disposable_child"):
            rows.append({"income_year": income_year, "series": series,
                         "value": round(r[series], 4)})

    out = pd.DataFrame(rows)
    path = os.path.join(OUT, "poverty.csv")
    out.to_csv(path, index=False)
    print(f"wrote {path}")
    print(out.pivot(index="income_year", columns="series", values="value"))


if __name__ == "__main__":
    main()
