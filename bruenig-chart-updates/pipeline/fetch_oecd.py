#!/usr/bin/env python3
"""fetch_oecd.py — international market vs disposable poverty rates.

Source: OECD Income Distribution Database via SDMX-ML REST API.
  Dataflow: OECD.WISE.INE,DSD_WISE_IDD@DF_IDD
  Endpoint: https://sdmx.oecd.org/public/rest/v1/data/
    OECD.WISE.INE,DSD_WISE_IDD@DF_IDD/<key>
  Key dims: REF_AREA.FREQ.MEASURE.STATISTICAL_OPERATION.UNIT_MEASURE.AGE
            .METHODOLOGY.DEFINITION.POVERTY_LINE
  Poverty key: .A.PR_INC_DISP+PR_INC_MRKT._Z.PT_POP._T.METH2012.D_CUR.PL_50
  (all areas, annual, poverty rate, % of population, total age,
   post-2012 income definition, current definition, 50%-of-median line)
  Gini key:    .A.INC_MRKT_GINI._Z.0_TO_1.Y18T65+Y_GT65+_T.METH2012.D_CUR._Z
  (market-income Gini by age group — reproduces Bruenig's OECD age-group
   chart from "Crunching the Numbers on Predistribution")

Measures: PR_INC_DISP (disposable income poverty), PR_INC_MRKT (market
income poverty), INC_MRKT_GINI (market-income Gini).

Outputs: downloads/oecd_idd_pov.csv, downloads/oecd_idd_gini_age.csv,
         computed/intl.csv      (columns: ref_area, measure, year, value)
         computed/intl_gini.csv (columns: ref_area, age, year, value)
"""

import os
import urllib.request

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DL = os.path.join(HERE, "downloads")
OUT = os.path.join(HERE, "computed")
BASE = "https://sdmx.oecd.org/public/rest/v1/data"
FLOW = "OECD.WISE.INE,DSD_WISE_IDD@DF_IDD"
KEY = ".A.PR_INC_DISP+PR_INC_MRKT._Z.PT_POP._T.METH2012.D_CUR.PL_50"
GINI_KEY = ".A.INC_MRKT_GINI._Z.0_TO_1.Y18T65+Y_GT65+_T.METH2012.D_CUR._Z"
UA = {"User-Agent": "bruenig-chart-updates pipeline (research)"}

# OECD members + key partners we keep for the chart (drop aggregates).
AGGREGATES = {"OECD", "EU27_2020", "OECD38", "EA19", "G4E", "E4M", "G7",
              "OECD25", "OECD22", "OECD26", "EU15", "EU21_2020"}


def download(url, dest, accept="text/csv"):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        print(f"  cached {os.path.basename(dest)} ({os.path.getsize(dest):,} B)")
        return dest
    print(f"  GET {url}")
    req = urllib.request.Request(url, headers={**UA, "Accept": accept})
    with urllib.request.urlopen(req, timeout=300) as r:
        data = r.read()
    text = data.decode("utf-8", "replace")
    if "NoRecordsFound" in text or text.lstrip().startswith("<"):
        raise RuntimeError(f"no usable data: {text[:200]}")
    with open(dest, "wb") as f:
        f.write(data)
    print(f"  wrote {len(data):,} B")
    return dest


def main():
    os.makedirs(DL, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)

    path = download(f"{BASE}/{FLOW}/{KEY}", os.path.join(DL, "oecd_idd_pov.csv"))
    df = pd.read_csv(path)
    df = df[~df["REF_AREA"].isin(AGGREGATES)]
    df = df[["REF_AREA", "MEASURE", "TIME_PERIOD", "OBS_VALUE"]].rename(
        columns={"REF_AREA": "ref_area", "MEASURE": "measure",
                 "TIME_PERIOD": "year", "OBS_VALUE": "value"})
    df["year"] = df["year"].astype(int)
    df["value"] = df["value"].astype(float).round(4)

    out_path = os.path.join(OUT, "intl.csv")
    df.to_csv(out_path, index=False)
    latest = df.groupby("ref_area")["year"].max()
    print(f"areas: {df['ref_area'].nunique()}, years {df.year.min()}-"
          f"{df.year.max()}, latest-per-area max {latest.max()}")
    usa = df[(df.ref_area == "USA")].pivot(index="year", columns="measure",
                                           values="value")
    print("USA:", usa.tail(3).to_string())
    print(f"wrote {out_path}")

    # --- market-income Gini by age group (Bruenig's OECD chart) ---
    gpath = download(f"{BASE}/{FLOW}/{GINI_KEY}",
                     os.path.join(DL, "oecd_idd_gini_age.csv"))
    g = pd.read_csv(gpath)
    g = g[~g["REF_AREA"].isin(AGGREGATES)]
    g = g[["REF_AREA", "AGE", "TIME_PERIOD", "OBS_VALUE"]].rename(
        columns={"REF_AREA": "ref_area", "AGE": "age",
                 "TIME_PERIOD": "year", "OBS_VALUE": "value"})
    g["year"] = g["year"].astype(int)
    g["value"] = g["value"].astype(float).round(6)
    gout = os.path.join(OUT, "intl_gini.csv")
    g.to_csv(gout, index=False)
    print(f"areas: {g['ref_area'].nunique()}, ages: "
          f"{sorted(g['age'].unique())}, years {g.year.min()}-{g.year.max()}")
    print("USA gini:",
          g[g.ref_area == 'USA'].pivot(index='year', columns='age',
                                       values='value').tail(3).to_string())
    print(f"wrote {gout}")


if __name__ == "__main__":
    main()
