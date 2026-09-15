import { INDEX_HTML } from "./ui";
import {
  geocodeAddress,
  parcelAtPoint,
  parcelsByAddressFragment,
  countResidentialParcelsWithin,
  toParcelFacts,
  type GeocodeCandidate,
} from "./gis";
import { evaluate, FEES, SEASONS, type ParcelFacts, type Scenario } from "./rules";
import { narrate } from "./report";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: JSON_HEADERS });
}

function err(message: string, status = 400, extra?: Record<string, unknown>): Response {
  return json({ error: message, ...extra }, status);
}

function parseScenario(url: URL): Scenario {
  const stay = Number(url.searchParams.get("stay") ?? "3");
  const adr = Number(url.searchParams.get("adr") ?? "185");
  const oo = url.searchParams.get("ownerOccupied") ?? "auto";
  const strategy = url.searchParams.get("strategy") ?? "auto";
  return {
    ownerOccupied: oo === "yes" || oo === "no" ? oo : "auto",
    avgStayNights: Number.isFinite(stay) ? Math.min(Math.max(stay, 1), 30) : 3,
    adr: Number.isFinite(adr) ? Math.min(Math.max(adr, 0), 5000) : 185,
    strategy:
      strategy === "str" || strategy === "midterm" ? strategy : "auto",
  };
}

/** Resolve an address string to the best Roseville parcel. */
async function resolveParcel(address: string): Promise<{
  parcel: ParcelFacts | null;
  geocode: GeocodeCandidate | null;
  candidates: GeocodeCandidate[];
}> {
  const candidates = await geocodeAddress(address);
  const best = candidates[0] ?? null;
  if (best) {
    const hits = await parcelAtPoint(best.lon, best.lat);
    const roseville = hits.find(
      (h) => String(h.SiteCityName ?? "").toUpperCase() === "ROSEVILLE",
    );
    if (roseville) {
      return { parcel: toParcelFacts(roseville), geocode: best, candidates };
    }
    if (hits.length) {
      // geocoded fine but the parcel is in another city — still report it
      return { parcel: toParcelFacts(hits[0]), geocode: best, candidates };
    }
  }
  // Fallback: attribute search on the street fragment
  const frag = address.replace(/[,;].*$/, "").trim();
  if (frag) {
    const hits = await parcelsByAddressFragment(frag);
    if (hits.length) {
      return { parcel: toParcelFacts(hits[0]), geocode: best, candidates };
    }
  }
  return { parcel: null, geocode: best, candidates };
}

async function handleFeasibility(url: URL, env: Env): Promise<Response> {
  const address = (url.searchParams.get("address") ?? "").trim();
  if (!address) return err("Missing ?address= parameter");
  const scenario = parseScenario(url);

  let resolved;
  try {
    resolved = await resolveParcel(address);
  } catch (e) {
    return err(`County GIS lookup failed: ${(e as Error).message}`, 502);
  }

  const { parcel, geocode, candidates } = resolved;
  if (!parcel) {
    return err("No Roseville parcel matched that address.", 404, {
      candidates: candidates.slice(0, 5),
    });
  }

  // Neighbor-notification + spacing context (best-effort; never fatal).
  let context: Record<string, number | null> = {
    noticeParcels300ft: null,
    spacingZoneParcels500ft: null,
  };
  const lon = parcel.longitude ?? geocode?.lon;
  const lat = parcel.latitude ?? geocode?.lat;
  if (lon != null && lat != null) {
    try {
      const [n300, n500] = await Promise.all([
        countResidentialParcelsWithin(lon, lat, 300),
        countResidentialParcelsWithin(lon, lat, 500),
      ]);
      context = { noticeParcels300ft: n300, spacingZoneParcels500ft: n500 };
    } catch {
      // non-fatal
    }
  }

  const engine = evaluate(parcel, scenario);
  const narrative = await narrate(env, parcel, scenario, engine);

  return json({
    input: { address },
    scenario,
    geocode,
    parcel,
    context,
    engine,
    narrative,
    generatedAt: new Date().toISOString(),
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: { ...JSON_HEADERS, "access-control-allow-methods": "GET,OPTIONS" },
      });
    }
    if (request.method !== "GET") return err("GET only", 405);

    switch (url.pathname) {
      case "/":
        return new Response(INDEX_HTML, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      case "/api/feasibility":
        return handleFeasibility(url, env);
      case "/api/geocode": {
        const a = (url.searchParams.get("address") ?? "").trim();
        if (!a) return err("Missing ?address=");
        return json({ candidates: await geocodeAddress(a) });
      }
      case "/api/rules":
        return json({ fees: FEES, seasons: SEASONS });
      default:
        return err("Not found", 404);
    }
  },
} satisfies ExportedHandler<Env>;
