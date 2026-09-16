/**
 * Ramsey County open-data client.
 *
 * - Geocoding: LOC_Locator_Composite (GeocodeServer)
 * - Parcels:   OpenData FeatureServer layer 12 (fully attributed:
 *              homestead, dwelling type, living units, land use, tax class)
 *
 * All endpoints are public, unauthenticated, and CORS-friendly.
 */

const GEOCODER =
  "https://gis.ramseycountymn.gov/server/rest/services/Geolocator/LOC_Locator_Composite/GeocodeServer";
const PARCELS =
  "https://maps.co.ramsey.mn.us/arcgis/rest/services/OpenData/OpenData/FeatureServer/12";

const PARCEL_FIELDS = [
  "ParcelID",
  "SiteAddress",
  "SiteCityName",
  "SiteZIP5",
  "HomesteadYN",
  "HomesteadDescription",
  "DwellingType",
  "StructureDescription",
  "LandUseCodeDescription",
  "UseType1",
  "LivingUnit",
  "BedRoom",
  "YearBuilt",
  "EMVTotal",
  "OwnerName",
  "OwnerCityStateZIP",
  "LastSaleDate",
  "SalePrice",
  "Latitude",
  "Longitude",
].join(",");

const UA = { "User-Agent": "roseville-str-feasibility/1.0 (civic open-data lookup)" };

export interface GeocodeCandidate {
  address: string;
  score: number;
  lon: number;
  lat: number;
  type: string;
  city: string | null;
}

export async function geocodeAddress(raw: string): Promise<GeocodeCandidate[]> {
  const q = /roseville|minnesota|\bmn\b/i.test(raw) ? raw : `${raw}, Roseville, MN`;
  const url = new URL(`${GEOCODER}/findAddressCandidates`);
  url.searchParams.set("SingleLine", q);
  url.searchParams.set("outFields", "Addr_type,City,Postal,Score");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("maxLocations", "5");
  url.searchParams.set("f", "json");

  const res = await fetch(url.toString(), { headers: UA });
  if (!res.ok) throw new Error(`Geocoder HTTP ${res.status}`);
  const data = (await res.json()) as {
    candidates?: Array<{
      address: string;
      score: number;
      location: { x: number; y: number };
      attributes: Record<string, string | number>;
    }>;
  };

  return (data.candidates ?? [])
    .filter((c) => c.score >= 60)
    .map((c) => ({
      address: c.address,
      score: c.score,
      lon: c.location.x,
      lat: c.location.y,
      type: String(c.attributes.Addr_type ?? ""),
      city: (c.attributes.City as string) ?? null,
    }));
}

export interface RawParcel {
  [k: string]: string | number | null;
}

async function parcelQuery(params: Record<string, string>): Promise<RawParcel[]> {
  const url = new URL(`${PARCELS}/query`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("f", "json");
  const res = await fetch(url.toString(), { headers: UA });
  if (!res.ok) throw new Error(`Parcel query HTTP ${res.status}`);
  const data = (await res.json()) as { features?: Array<{ attributes: RawParcel }> };
  return (data.features ?? []).map((f) => f.attributes);
}

/** Parcel polygon containing a WGS84 point. */
export function parcelAtPoint(lon: number, lat: number): Promise<RawParcel[]> {
  return parcelQuery({
    geometry: JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }),
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: PARCEL_FIELDS,
    returnGeometry: "false",
  });
}

/** Attribute fallback when the point query misses (ramps, unit addresses). */
export function parcelsByAddressFragment(fragment: string): Promise<RawParcel[]> {
  const safe = fragment.replace(/'/g, "''").toUpperCase().slice(0, 60);
  return parcelQuery({
    where: `UPPER(SiteAddress) LIKE '%${safe}%' AND UPPER(SiteCityName)='ROSEVILLE'`,
    outFields: PARCEL_FIELDS,
    returnGeometry: "false",
    resultRecordCount: "10",
  });
}

/**
 * Count residential 1-4 unit parcels within `feet` of a point — used to
 * estimate the 909.07.C neighbor-notification list (300 ft) and to size the
 * 500-ft spacing-conflict zone (909.03.B).
 */
export async function countResidentialParcelsWithin(
  lon: number,
  lat: number,
  feet: number,
): Promise<number> {
  const feats = await parcelQuery({
    geometry: JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }),
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: String(feet),
    units: "esriSRUnit_Foot",
    where: "LivingUnit BETWEEN 1 AND 4",
    outFields: "ParcelID",
    returnGeometry: "false",
    resultRecordCount: "1000",
  });
  return feats.length;
}

const num = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : Number(v);
const str = (v: unknown): string | null => (v == null || v === "" ? null : String(v));

export function toParcelFacts(a: RawParcel) {
  return {
    parcelId: str(a.ParcelID),
    siteAddress: str(a.SiteAddress),
    siteCity: str(a.SiteCityName),
    homestead: a.HomesteadYN == null ? null : String(a.HomesteadYN).toUpperCase() === "Y",
    homesteadDescription: str(a.HomesteadDescription),
    dwellingType: str(a.DwellingType),
    structureDescription: str(a.StructureDescription),
    landUseDescription: str(a.LandUseCodeDescription),
    useType: str(a.UseType1),
    livingUnits: num(a.LivingUnit),
    bedrooms: num(a.BedRoom),
    yearBuilt: num(a.YearBuilt),
    emvTotal: num(a.EMVTotal),
    ownerName: str(a.OwnerName),
    ownerCityStateZIP: str(a.OwnerCityStateZIP),
    lastSaleDate: a.LastSaleDate
      ? new Date(Number(a.LastSaleDate)).toISOString().slice(0, 10)
      : null,
    salePrice: num(a.SalePrice),
    latitude: num(a.Latitude),
    longitude: num(a.Longitude),
  };
}
