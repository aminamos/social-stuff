import { CityAdapter, PlatformId } from "../canonical";
import { PageResult } from "./arcgis";
import * as arcgis from "./arcgis";
import * as socrata from "./socrata";
import * as carto from "./carto";
import { withRetry } from "./http";

export type { PageResult };

export interface FetchOptions {
  /** Socrata app token, when configured. */
  socrataAppToken?: string;
}

/**
 * Dispatch to the client for a source platform. Adding a platform means adding
 * one entry here and one file; adapters never change. Transient failures (429,
 * 5xx) are retried with backoff.
 */
export async function fetchPage(
  platform: PlatformId,
  adapter: CityAdapter,
  offset: number,
  opts: FetchOptions = {},
): Promise<PageResult> {
  return withRetry(() => {
    switch (platform) {
      case "arcgis":
        return arcgis.fetchPage(adapter, offset);
      case "socrata":
        return socrata.fetchPage(adapter, offset, opts.socrataAppToken);
      case "carto":
        return carto.fetchPage(adapter, offset);
      case "ckan":
        throw new Error("CKAN client not implemented yet");
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  });
}
