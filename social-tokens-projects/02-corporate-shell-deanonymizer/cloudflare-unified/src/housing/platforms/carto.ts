import { CityAdapter } from "../canonical";
import { PageResult } from "./arcgis";
import { HttpError } from "./http";

const USER_AGENT =
  "TenantUnionResearchBot/1.0 (+https://github.com/aminamos/social-tokens-projects)";

/**
 * Page a CARTO SQL API v2 table, e.g.
 * https://phl.carto.com/api/v2/sql?q=SELECT ...
 *
 * The SQL text (with WHERE / ORDER BY / LIMIT / OFFSET) goes in the `q`
 * query param, URL-encoded. No token is needed for the public City of
 * Philadelphia tables. The API returns `{rows: [...]}` (older accounts may
 * return a bare array), so both shapes are accepted.
 */
export async function fetchPage(
  adapter: CityAdapter,
  offset: number,
): Promise<PageResult> {
  const { endpoint, dataset, pageSize, where, orderBy } = adapter.source;

  let q = `SELECT * FROM ${dataset}`;
  if (where) q += ` WHERE ${where}`;
  if (orderBy) q += ` ORDER BY ${orderBy}`;
  q += ` LIMIT ${pageSize} OFFSET ${offset}`;

  const params = new URLSearchParams({ q });

  const res = await fetch(`${endpoint}?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new HttpError(res.status, `CARTO ${res.status} ${res.statusText} at offset ${offset}`);
  }

  const data: any = await res.json();
  const rows: unknown[] = Array.isArray(data) ? data : data.rows;
  if (!Array.isArray(rows)) {
    throw new Error(`CARTO returned non-row payload at offset ${offset}`);
  }

  return {
    rows: rows as Record<string, unknown>[],
    hasMore: rows.length >= pageSize,
  };
}
