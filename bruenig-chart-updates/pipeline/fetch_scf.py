#!/usr/bin/env python3
"""fetch_scf.py — wealth-share series (top 1%, top 10%, bottom 50%).

Source: Federal Reserve Distributional Financial Accounts (DFA),
  https://www.federalreserve.gov/releases/z1/dataviz/download/zips/dfa.zip
  -> dfa-networth-shares.csv (quarterly shares of net worth by percentile).

Why DFA and not the SCF summary workbook: the public SCF historical tables
(scf2022_tables_public_real_historical.xlsx) break out net-worth percentiles
only at <25/25-49.9/50-74.9/75-89.9/90-100 — there is no top-1% row. The DFA
is the Fed's SCF-derived distributional series and is exactly the granularity
Bruenig's SCF charts show (top 10% ~73%, bottom 50% ~2% in 2022).

We emit quarterly points ('YYYY:Qn'). Top 1% = TopPt1 + RemainingTop1;
top 10% = Top 1% + Next9; bottom 50% = Bottom50.

Outputs: downloads/dfa.zip, computed/wealth.csv
"""

import io
import os
import urllib.request
import zipfile

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DL = os.path.join(HERE, "downloads")
OUT = os.path.join(HERE, "computed")
URL = "https://www.federalreserve.gov/releases/z1/dataviz/download/zips/dfa.zip"
UA = {"User-Agent": "bruenig-chart-updates pipeline (research)"}


def download(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        print(f"  cached {os.path.basename(dest)} ({os.path.getsize(dest):,} B)")
        return dest
    print(f"  GET {url}")
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=300) as r:
        data = r.read()
    with open(dest, "wb") as f:
        f.write(data)
    print(f"  wrote {len(data):,} B")
    return dest


def main():
    os.makedirs(DL, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)

    zpath = download(URL, os.path.join(DL, "dfa.zip"))
    z = zipfile.ZipFile(zpath)
    with z.open("dfa-networth-shares.csv") as f:
        df = pd.read_csv(f)

    df["Net worth"] = pd.to_numeric(df["Net worth"], errors="coerce")
    wide = df.pivot(index="Date", columns="Category", values="Net worth")
    wide["Top1"] = wide["TopPt1"] + wide["RemainingTop1"]
    wide["Top10"] = wide["Top1"] + wide["Next9"]

    rows = []
    for date, r in wide.iterrows():
        for series, col in [("top1", "Top1"), ("top10", "Top10"),
                            ("bottom50", "Bottom50")]:
            rows.append({"quarter": date, "series": series,
                         "value": round(float(r[col]), 4)})
    out = pd.DataFrame(rows)
    path = os.path.join(OUT, "wealth.csv")
    out.to_csv(path, index=False)
    piv = out.pivot(index="quarter", columns="series", values="value")
    print(piv.tail(6))
    print(f"wrote {path}  ({len(out)} points, {piv.index.min()} -> {piv.index.max()})")
    # sanity: shares should sum ~100
    s = wide[["Top1", "Next9", "Next40", "Bottom50"]].iloc[-1].sum()
    print(f"sum check last quarter: {s:.1f}% (expect ~100)")


if __name__ == "__main__":
    main()
