import { INDEX_HTML } from "./ui";
import {
  geocodeAddress,
  parcelAtPoint,
  parcelsByAddressFragment,
  countResidentialParcelsWithin,
  toParcelFacts,
  type GeocodeCandidate,
} from "./gis";
import {
  evaluate,
  defaultParams,
  type ParcelFacts,
  type RuleParams,
  type Scenario,
} from "./rules";
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

/**
 * Rule parameters from D1 `rule_params` (seeded to the compiled defaults).
 * Fee/threshold changes need an UPDATE, not a redeploy. Falls back to the
 * compiled defaults when the binding is absent or the query fails.
 */
async function loadParams(env: Env): Promise<{ params: RuleParams; source: "d1" | "defaults" }> {
  const params = defaultParams();
  if (!env.DB) return { params, source: "defaults" };
  try {
    const { results } = await env.DB.prepare(
      "SELECT key, value FROM rule_params",
    ).all<{ key: string; value: string }>();
    const map = new Map(results.map((r) => [r.key, JSON.parse(r.value) as number]));
    const num = (k: string, fallback: number) => {
      const v = map.get(k);
      return typeof v === "number" && Number.isFinite(v) ? v : fallback;
    };
    params.fees.strLicenseAnnual = num("fees.strLicenseAnnual", params.fees.strLicenseAnnual);
    params.fees.strLicenseLateFee = num("fees.strLicenseLateFee", params.fees.strLicenseLateFee);
    params.fees.rentalRegistrationPerUnit = num("fees.rentalRegistrationPerUnit", params.fees.rentalRegistrationPerUnit);
    params.fees.rentalRegistrationLate = num("fees.rentalRegistrationLate", params.fees.rentalRegistrationLate);
    params.fees.lodgingTaxRate = num("fees.lodgingTaxRate", params.fees.lodgingTaxRate);
    params.spacingFeet = num("spacing.feet", params.spacingFeet);
    params.noticeRadiusFeet = num("notice.radiusFeet", params.noticeRadiusFeet);
    params.winterDays = num("cap.winterDays", params.winterDays);
    params.summerDays = num("cap.summerDays", params.summerDays);
    params.winterSpacing = num("cap.winterSpacing", params.winterSpacing);
    params.summerSpacing = num("cap.summerSpacing", params.summerSpacing);
    params.strMaxNights = num("str.maxNights", params.strMaxNights);
    params.maxUnrelatedAdults = num("occupancy.maxUnrelatedAdults", params.maxUnrelatedAdults);
    return { params, source: "d1" };
  } catch {
    return { params, source: "defaults" };
  }
}

function logLookup(
  env: Env,
  ctx: ExecutionContext,
  input: string,
  parcel: ParcelFacts | null,
  verdict: string,
  scenario: Scenario,
  narrativeSource: string,
): void {
  if (!env.DB) return;
  ctx.waitUntil(
    env.DB.prepare(
      `INSERT INTO lookups (address_input, matched_address, parcel_id, city, verdict, scenario_json, narrative_source)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        input,
        parcel?.siteAddress ?? null,
        parcel?.parcelId ?? null,
        parcel?.siteCity ?? null,
        verdict,
        JSON.stringify(scenario),
        narrativeSource,
      )
      .run()
      .catch(() => {}),
  );
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

async function handleFeasibility(url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const address = (url.searchParams.get("address") ?? "").trim();
  if (!address) return err("Missing ?address= parameter");
  const scenario = parseScenario(url);

  let resolved;
  try {
    resolved = await resolveParcel(address);
  } catch (e) {
    return err(`County GIS lookup failed: ${(e as Error).message}`, 502);
  }
  const { params, source: paramsSource } = await loadParams(env);

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
        countResidentialParcelsWithin(lon, lat, params.noticeRadiusFeet),
        countResidentialParcelsWithin(lon, lat, params.spacingFeet),
      ]);
      context = { noticeParcels300ft: n300, spacingZoneParcels500ft: n500 };
    } catch {
      // non-fatal
    }
  }

  const engine = evaluate(parcel, scenario, params);
  const narrative = await narrate(env, parcel, scenario, engine);

  logLookup(env, ctx, address, parcel, engine.verdict, scenario, narrative.source);

  return json({
    input: { address },
    scenario,
    paramsSource,
    geocode,
    parcel,
    context,
    engine,
    narrative,
    generatedAt: new Date().toISOString(),
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
        return handleFeasibility(url, env, ctx);
      case "/api/geocode": {
        const a = (url.searchParams.get("address") ?? "").trim();
        if (!a) return err("Missing ?address=");
        return json({ candidates: await geocodeAddress(a) });
      }
      case "/api/rules": {
        const { params, source } = await loadParams(env);
        return json({ params, paramsSource: source });
      }
      case "/api/sources": {
        if (!env.DB) return err("Registry unavailable", 503);
        const { results } = await env.DB.prepare(
          "SELECT r2_key, title, source_url, fetched_at, content_type, notes FROM source_documents ORDER BY r2_key",
        ).all();
        return json({
          documents: (results as Array<Record<string, unknown>>).map((r) => ({
            ...r,
            download: `/docs/${r.r2_key}`,
          })),
        });
      }
      case "/api/lookups": {
        if (!env.DB) return err("Registry unavailable", 503);
        const { results } = await env.DB.prepare(
          "SELECT requested_at, address_input, matched_address, city, verdict FROM lookups ORDER BY id DESC LIMIT 20",
        ).all();
        return json({ lookups: results });
      }
      default:
        if (url.pathname.startsWith("/docs/")) {
          const key = decodeURIComponent(url.pathname.slice("/docs/".length));
          if (!key || key.includes("..")) return err("Bad key", 400);
          const obj = await env.DOCS.get(key);
          if (!obj) return err("Document not found", 404);
          return new Response(obj.body, {
            headers: {
              "content-type":
                obj.httpMetadata?.contentType ?? "application/octet-stream",
              "cache-control": "public, max-age=86400",
              "etag": obj.httpEtag,
            },
          });
        }
        return err("Not found", 404);
    }
  },
} satisfies ExportedHandler<Env>;
