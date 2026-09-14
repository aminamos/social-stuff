import { CityAdapter } from "../canonical";
import { PageResult } from "./arcgis";
import { HttpError } from "./http";

const USER_AGENT =
  "TenantUnionResearchBot/1.0 (+https://github.com/aminamos/social-tokens-projects)";

/**
 * Page a Socrata (SODA) resource, e.g.
 * https://data.cityofnewyork.us/resource/wvxf-dwi5.json
 *
 * An app token is optional but raises the throttling ceiling. It is passed in
 * by the sync engine from the SOCRATA_APP_TOKEN secret when configured.
 */
export async function fetchPage(
  adapter: CityAdapter,
  offset: number,
  appToken?: string,
): Promise<PageResult> {
  const { endpoint, pageSize, where, orderBy } = adapter.source;

  const params = new URLSearchParams({
    $limit: String(pageSize),
    $offset: String(offset),
  });
  if (where) params.set("$where", where);
  if (orderBy) params.set("$order", orderBy);

  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
  };
  if (appToken) headers["X-App-Token"] = appToken;

  const res = await fetch(`${endpoint}?${params.toString()}`, { headers });
  if (!res.ok) {
    throw new HttpError(res.status, `Socrata ${res.status} ${res.statusText} at offset ${offset}`);
  }

  const data: any = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`Socrata returned non-array payload at offset ${offset}`);
  }

  return { rows: data, hasMore: data.length >= pageSize };
}
