from __future__ import annotations

import re
from typing import List, Dict, Any, Optional
import httpx

from .base import BaseExtractor
from ..models.schema import Property, ShellEntity, Person, OwnershipEdge, RelationType

# Endpoints
RAMSEY_PARCELS_URL = "https://gis.ramseycountymn.gov/server/rest/services/MapRamsey/MapRamseyOperational_AttributedParcel/FeatureServer/4/query"
STPAUL_COFO_URL = "https://services1.arcgis.com/9meaaHE3uiba0zr8/arcgis/rest/services/Certificate_of_Occupancy_-_Residential/FeatureServer/0/query"
BROOKLYN_PARK_RENTALS_URL = "https://servergis.brooklynpark.org/arcgis/rest/services/Public/Misc/MapServer/6/query"
HENNEPIN_PARCELS_URL = "https://gis.hennepin.us/arcgis/rest/services/HennepinData/LAND_PROPERTY/MapServer/1/query"
MINNEAPOLIS_RENTAL_LICENSES_URL = "https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Active_Rental_Licenses/FeatureServer/0/query"


# Complete list of municipalities in Hennepin County (47 cities/townships)
HENNEPIN_MUNICIPALITIES = [
    "MINNEAPOLIS", "BLOOMINGTON", "PLYMOUTH", "MAPLE GROVE", "BROOKLYN PARK",
    "EDEN PRAIRIE", "EDINA", "MINNETONKA", "ST. LOUIS PARK", "RICHFIELD",
    "CHAMPLIN", "BROOKLYN CENTER", "GOLDEN VALLEY", "CRYSTAL", "ROGERS",
    "NEW HOPE", "ROBBINSDALE", "HOPKINS", "DAYTON", "CORCORAN", "MOUND",
    "MINNETRISTA", "ORONO", "MEDINA", "SHOREWOOD", "ST. ANTHONY", "WAYZATA",
    "INDEPENDENCE", "DEEPHAVEN", "GREENFIELD", "ST. BONIFACIUS", "EXCELSIOR",
    "OSSEO", "LONG LAKE", "TONKA BAY", "MAPLE PLAIN", "SPRING PARK",
    "GREENWOOD", "MINNETONKA BEACH", "LORETTO", "HANOVER", "WOODLAND",
    "MEDICINE LAKE", "ROCKFORD", "MET AIRPORT", "FORT SNELLING", "CHANHASSEN"
]

# Complete list of municipalities in Ramsey County (19 cities/townships)
RAMSEY_MUNICIPALITIES = [
    "SAINT PAUL", "MAPLEWOOD", "ROSEVILLE", "SHOREVIEW", "WHITE BEAR LAKE",
    "NEW BRIGHTON", "VADNAIS HEIGHTS", "WHITE BEAR TOWNSHIP", "NORTH SAINT PAUL",
    "MOUNDS VIEW", "LITTLE CANADA", "ARDEN HILLS", "NORTH OAKS", "FALCON HEIGHTS",
    "LAUDERDALE", "SAINT ANTHONY", "GEM LAKE", "SPRING LAKE PARK", "BLAINE"
]


class MetroCountyClient(BaseExtractor):
    """Universal client for querying real property assessments, rental certificates,

    and active licensing data across all 66 municipalities in Hennepin and Ramsey counties.
    """

    def __init__(self, model_name: str = "offline", timeout: float = 20.0):
        super().__init__(task_name="metro_county_data_ingestion", model_name=model_name)
        self.timeout = timeout
        self.headers = {"User-Agent": "SocialTokensMetroExtractor/1.0"}

    # --------------------------------------------------------------------------
    # 1. RAMSEY COUNTY GIS (All 19 cities: St. Paul, Maplewood, Roseville, etc.)
    # --------------------------------------------------------------------------
    def fetch_ramsey_parcels(
        self,
        city: Optional[str] = None,
        where: str = "1=1",
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Queries Ramsey County Attributed Parcels FeatureServer."""
        conditions = [where]
        if city:
            clean_city = city.replace("'", "''").strip().upper()
            conditions.append(f"UPPER(SiteCityName) = '{clean_city}'")

        full_where = " AND ".join(conditions)
        params = {
            "where": full_where,
            "outFields": (
                "ParcelID,SiteAddress,SiteCityName,SiteZIP,OwnerName,OwnerAddress1,OwnerCityStateZIP,"
                "TaxName1,TaxAddress1,TaxCityStateZIP,LivingUnit,UseType1,DwellingType,"
                "StructureDescription,EMVTotal,TotalTax1,YearBuilt,InspectionYear"
            ),
            "returnGeometry": "false",
            "resultRecordCount": limit,
            "resultOffset": offset,
            "f": "json"
        }
        try:
            r = httpx.get(RAMSEY_PARCELS_URL, params=params, headers=self.headers, timeout=self.timeout)
            r.raise_for_status()
            features = r.json().get("features", [])
            results = [f["attributes"] for f in features if f.get("attributes")]
            raw_len = len(str(results))
            self.record_tokens(prompt_toks=max(raw_len // 4, 100), completion_toks=60)
            return results
        except Exception as e:
            print(f"[Warning] Ramsey County parcel fetch error: {e}")
            return []

    # --------------------------------------------------------------------------
    # 2. SAINT PAUL CERTIFICATE OF OCCUPANCY (12,400+ Rental Properties)
    # --------------------------------------------------------------------------
    def fetch_stpaul_cofo(
        self,
        where: str = "1=1",
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Queries Saint Paul's official Residential Certificate of Occupancy FeatureServer."""
        params = {
            "where": where,
            "outFields": "OBJECTID,PROPNAME,UNITS,PRIMOCCTYPE,ADDRESS,SUB_TYPE,STATUS,PIN,GRADE,RENEWAL_DUE",
            "returnGeometry": "false",
            "resultRecordCount": limit,
            "resultOffset": offset,
            "f": "json"
        }
        try:
            r = httpx.get(STPAUL_COFO_URL, params=params, headers=self.headers, timeout=self.timeout)
            r.raise_for_status()
            features = r.json().get("features", [])
            results = [f["attributes"] for f in features if f.get("attributes")]
            raw_len = len(str(results))
            self.record_tokens(prompt_toks=max(raw_len // 4, 100), completion_toks=60)
            return results
        except Exception as e:
            print(f"[Warning] Saint Paul C of O fetch error: {e}")
            return []

    # --------------------------------------------------------------------------
    # 3. BROOKLYN PARK RENTAL LICENSES (2,080+ Rental Properties)
    # --------------------------------------------------------------------------
    def fetch_brooklyn_park_rentals(
        self,
        where: str = "1=1",
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Queries City of Brooklyn Park Rental Licenses MapServer."""
        params = {
            "where": where,
            "outFields": (
                "OBJECTID,FullAddress,LicenseNumber,LicenseTypeCode,"
                "LicenseTypeDescription,LicenseEffectiveDate,LicenseExpirationDate,ParcelNumber"
            ),
            "returnGeometry": "false",
            "resultRecordCount": limit,
            "resultOffset": offset,
            "f": "json"
        }
        try:
            r = httpx.get(BROOKLYN_PARK_RENTALS_URL, params=params, headers=self.headers, timeout=self.timeout)
            r.raise_for_status()
            features = r.json().get("features", [])
            results = [f["attributes"] for f in features if f.get("attributes")]
            raw_len = len(str(results))
            self.record_tokens(prompt_toks=max(raw_len // 4, 100), completion_toks=60)
            return results
        except Exception as e:
            print(f"[Warning] Brooklyn Park rental fetch error: {e}")
            return []

    # --------------------------------------------------------------------------
    # 4. HENNEPIN COUNTY SUBURBS & METRO PARCELS (All 47 Cities)
    # --------------------------------------------------------------------------
    def fetch_hennepin_parcels(
        self,
        city: Optional[str] = None,
        where: str = "1=1",
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Queries Hennepin County GIS Land Property MapServer with optional municipal filter."""
        conditions = [where]
        if city:
            clean_city = city.replace("'", "''").strip().upper()
            conditions.append(f"UPPER(MUNIC_NM) LIKE '{clean_city}%'")

        full_where = " AND ".join(conditions)
        params = {
            "where": full_where,
            "outFields": (
                "PID,HOUSE_NO,STREET_NM,MUNIC_NM,ZIP_CD,OWNER_NM,TAXPAYER_NM,"
                "TAXPAYER_NM_1,MKT_VAL_TOT,PR_TYP_NM1,HMSTD_CD1,EARLIEST_DELQ_YR,BUILD_YR"
            ),
            "returnGeometry": "false",
            "resultRecordCount": limit,
            "resultOffset": offset,
            "f": "json"
        }
        try:
            r = httpx.get(HENNEPIN_PARCELS_URL, params=params, headers=self.headers, timeout=self.timeout)
            r.raise_for_status()
            features = r.json().get("features", [])
            results = [f["attributes"] for f in features if f.get("attributes")]
            raw_len = len(str(results))
            self.record_tokens(prompt_toks=max(raw_len // 4, 100), completion_toks=60)
            return results
        except Exception as e:
            print(f"[Warning] Hennepin County parcel fetch error: {e}")
            return []

    # --------------------------------------------------------------------------
    # 5. CROSS-METRO SYNDICATE DE-ANONYMIZATION SEARCH
    # --------------------------------------------------------------------------
    def search_metro_syndicate(self, query: str, limit_per_jurisdiction: int = 50) -> Dict[str, Any]:
        """Performs a comprehensive, cross-county search across:

        1. Minneapolis Active Rental Licenses
        2. Saint Paul Residential Certificates of Occupancy
        3. Brooklyn Park Rental Registry
        4. Hennepin County Real Property GIS (Suburbs + Minneapolis)
        5. Ramsey County Real Property GIS (St. Paul, Maplewood, Roseville, etc.)

        Reconstructs the multi-jurisdiction ownership graph and calculates total metro footprint.
        """
        clean_q = query.replace("'", "''").strip().upper()
        results: Dict[str, Any] = {
            "query": query,
            "minneapolis_licenses": [],
            "stpaul_licenses": [],
            "brooklyn_park_rentals": [],
            "hennepin_parcels": [],
            "ramsey_parcels": [],
            "summary": {
                "total_records": 0,
                "total_units": 0,
                "total_market_value": 0.0,
                "jurisdictions": set(),
                "owner_names": set(),
                "taxpayer_names": set(),
            }
        }

        # 1. Minneapolis Rental Licenses
        mpls_where = (
            f"UPPER(ownerName) LIKE '%{clean_q}%' "
            f"OR UPPER(applicantName) LIKE '%{clean_q}%' "
            f"OR UPPER(applicantEmail) LIKE '%{clean_q}%' "
            f"OR UPPER(address) LIKE '%{clean_q}%'"
        )
        mpls_params = {
            "where": mpls_where,
            "outFields": "apn,address,ownerName,ownerCity,applicantName,applicantEmail,licensedUnits,tier,status",
            "returnGeometry": "false",
            "resultRecordCount": limit_per_jurisdiction,
            "f": "json"
        }
        try:
            r = httpx.get(MINNEAPOLIS_RENTAL_LICENSES_URL, params=mpls_params, headers=self.headers, timeout=self.timeout)
            if r.status_code == 200:
                for f in r.json().get("features", []):
                    attr = f.get("attributes", {})
                    if attr:
                        results["minneapolis_licenses"].append(attr)
                        results["summary"]["jurisdictions"].add("Minneapolis")
                        units = int(attr.get("licensedUnits") or 1)
                        results["summary"]["total_units"] += units
                        if attr.get("ownerName"):
                            results["summary"]["owner_names"].add(attr["ownerName"])
        except Exception as e:
            print(f"[Warning] Search Minneapolis failed: {e}")

        # 2. Saint Paul C of O (search by PROPNAME or ADDRESS)
        stpaul_where = f"UPPER(PROPNAME) LIKE '%{clean_q}%' OR UPPER(ADDRESS) LIKE '%{clean_q}%'"
        stpaul_records = self.fetch_stpaul_cofo(where=stpaul_where, limit=limit_per_jurisdiction)
        for sp in stpaul_records:
            results["stpaul_licenses"].append(sp)
            results["summary"]["jurisdictions"].add("Saint Paul")
            units = int(sp.get("UNITS") or 1)
            results["summary"]["total_units"] += units
            if sp.get("PROPNAME"):
                results["summary"]["owner_names"].add(sp["PROPNAME"])

        # 3. Brooklyn Park Rentals (search by address)
        bp_where = f"UPPER(FullAddress) LIKE '%{clean_q}%'"
        bp_records = self.fetch_brooklyn_park_rentals(where=bp_where, limit=limit_per_jurisdiction)
        for bp in bp_records:
            results["brooklyn_park_rentals"].append(bp)
            results["summary"]["jurisdictions"].add("Brooklyn Park")

        # 4. Ramsey County Parcels (search OwnerName, TaxName1, SiteAddress)
        rc_where = (
            f"UPPER(OwnerName) LIKE '%{clean_q}%' "
            f"OR UPPER(TaxName1) LIKE '%{clean_q}%' "
            f"OR UPPER(SiteAddress) LIKE '%{clean_q}%'"
        )
        rc_records = self.fetch_ramsey_parcels(where=rc_where, limit=limit_per_jurisdiction)
        for rc in rc_records:
            results["ramsey_parcels"].append(rc)
            city = str(rc.get("SiteCityName") or "Ramsey County").title()
            results["summary"]["jurisdictions"].add(city)
            units = int(rc.get("LivingUnit") or 0)
            results["summary"]["total_units"] += units
            val = float(rc.get("EMVTotal") or 0.0)
            results["summary"]["total_market_value"] += val
            if rc.get("OwnerName"):
                results["summary"]["owner_names"].add(rc["OwnerName"])
            if rc.get("TaxName1"):
                results["summary"]["taxpayer_names"].add(rc["TaxName1"])

        # 5. Hennepin County Parcels (search OWNER_NM, TAXPAYER_NM, STREET_NM)
        hc_where = (
            f"UPPER(OWNER_NM) LIKE '%{clean_q}%' "
            f"OR UPPER(TAXPAYER_NM) LIKE '%{clean_q}%' "
            f"OR UPPER(TAXPAYER_NM_1) LIKE '%{clean_q}%'"
        )
        hc_records = self.fetch_hennepin_parcels(where=hc_where, limit=limit_per_jurisdiction)
        for hc in hc_records:
            results["hennepin_parcels"].append(hc)
            munic = str(hc.get("MUNIC_NM") or "Hennepin County").strip().title()
            results["summary"]["jurisdictions"].add(munic)
            val = float(hc.get("MKT_VAL_TOT") or 0.0)
            results["summary"]["total_market_value"] += val
            if hc.get("OWNER_NM"):
                results["summary"]["owner_names"].add(hc["OWNER_NM"])
            if hc.get("TAXPAYER_NM"):
                results["summary"]["taxpayer_names"].add(hc["TAXPAYER_NM"])

        # Convert sets to sorted lists for JSON serialization
        results["summary"]["jurisdictions"] = sorted(results["summary"]["jurisdictions"])
        results["summary"]["owner_names"] = sorted(results["summary"]["owner_names"])
        results["summary"]["taxpayer_names"] = sorted(results["summary"]["taxpayer_names"])
        results["summary"]["total_records"] = (
            len(results["minneapolis_licenses"]) +
            len(results["stpaul_licenses"]) +
            len(results["brooklyn_park_rentals"]) +
            len(results["hennepin_parcels"]) +
            len(results["ramsey_parcels"])
        )

        return results

    def extract(self, raw_input: Any) -> Any:
        """Implements BaseExtractor contract by performing a metro-wide syndicate search."""
        return self.search_metro_syndicate(str(raw_input))
