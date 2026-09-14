import { CityAdapter } from "../canonical";
import { HttpError } from "./http";

export interface PageResult {
  rows: Record<string, unknown>[];
  hasMore: boolean;
}

const USER_AGENT =
  "TenantUnionResearchBot/1.0 (+https://github.com/aminamos/social-tokens-projects)";

/**
 * Page an ArcGIS FeatureServer layer.
 *
 * Always orders by a stable key: ArcGIS pagination without an explicit sort is
 * free to return rows in any order between requests, which silently drops and
 * duplicates records across pages.
 */
export async function fetchPage(
  adapter: CityAdapter,
  offset: number,
): Promise<PageResult> {
  const { endpoint, pageSize, where, orderBy, outFields } = adapter.source;

  const params = new URLSearchParams({
    where: where || "1=1",
    outFields: outFields || "*",
    returnGeometry: "false",
    resultOffset: String(offset),
    resultRecordCount: String(pageSize),
    f: "json",
  });
  if (orderBy) params.set("orderByFields", orderBy);

  const res = await fetch(`${endpoint}?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new HttpError(res.status, `ArcGIS ${res.status} ${res.statusText} at offset ${offset}`);
  }

  const data: any = await res.json();
  if (data.error) {
    throw new Error(`ArcGIS error at offset ${offset}: ${JSON.stringify(data.error)}`);
  }

  const features: any[] = Array.isArray(data.features) ? data.features : [];
  const rows = features.map((f) => (f && f.attributes) || {});
  const exceeded = data.exceededTransferLimit === true;

  return { rows, hasMore: rows.length >= pageSize || exceeded };
}
