import { CityAdapter } from "../canonical";
import { minneapolis } from "./arcgis/minneapolis";
import { saintPaul } from "./arcgis/saint-paul";
import { detroit } from "./arcgis/detroit";
import { nashvilleStr } from "./arcgis/nashville-str";
import { seattle } from "./socrata/seattle";
import { nyc } from "./socrata/nyc";
import { austinDeficiencies } from "./socrata/austin";
import { sanFrancisco } from "./socrata/sanfrancisco";
import { buffalo } from "./socrata/buffalo";
import { denverStr } from "./socrata/denver-str";
import { cincinnati } from "./socrata/cincinnati";
import { philadelphia } from "./carto/philadelphia";

/**
 * Registry of every feed the worker ingests.
 *
 * Adapters are grouped by source platform (`adapters/<platform>/<city>.ts`).
 * Adding a city is: one adapter file, one line here. Nothing else changes.
 *
 * Batches should be reviewed by platform so a shared client is only written
 * once: ArcGIS (arcgis/), then Socrata (socrata/), then CKAN.
 */
export const ADAPTERS: CityAdapter[] = [
  minneapolis,
  saintPaul,
  detroit,
  nashvilleStr,
  seattle,
  nyc,
  // NOTE: austinRegistration (activity-grain: ~2k events on the top parcel)
  // is deliberately unregistered. Both Austin feeds key on parcelid, so
  // registering both would clobber the same parcel_ids back and forth every
  // tick. The deficiencies feed carries owner names; the activity feed does
  // not, so deficiencies wins for a landlord-identity registry.
  austinDeficiencies,
  sanFrancisco,
  buffalo,
  denverStr,
  cincinnati,
  philadelphia,
];

export function getAdapter(feedId: string): CityAdapter | undefined {
  return ADAPTERS.find((a) => a.feed.id === feedId);
}

export function feedIds(): string[] {
  return ADAPTERS.map((a) => a.feed.id);
}
