import type { EngineResult, ParcelFacts, Scenario } from "./rules";

/**
 * LLM-guided layer: turns the deterministic engine output into a buyer-facing
 * verdict letter. The model is constrained to the computed facts — it explains,
 * it does not decide. Falls back to a template when Workers AI is unavailable.
 */

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

interface AiEnv {
  AI?: {
    run(
      model: string,
      input: Record<string, unknown>,
    ): Promise<{ response?: string } | string>;
  };
}

export async function narrate(
  env: AiEnv,
  parcel: ParcelFacts | null,
  scenario: Scenario,
  result: EngineResult,
): Promise<{ text: string; source: "workers-ai" | "deterministic" }> {
  if (env.AI) {
    try {
      const text = await runModel(env, parcel, scenario, result);
      if (text) return { text, source: "workers-ai" };
    } catch {
      // fall through to deterministic report
    }
  }
  return { text: fallbackNarrative(parcel, scenario, result), source: "deterministic" };
}

async function runModel(
  env: AiEnv,
  parcel: ParcelFacts | null,
  scenario: Scenario,
  r: EngineResult,
): Promise<string | null> {
  const system = `You are a Minnesota real-estate regulatory analyst writing for a prospective property buyer.
Rules of engagement:
- Use ONLY the facts in the JSON payload. Do not invent statutes, fees, or dates.
- Write plain English, 4 short paragraphs: (1) verdict & why, (2) the booking math reality vs a naive Airbnb pro-forma, (3) the 2–3 biggest execution risks including the 500-ft spacing check and license non-transfer on sale, (4) recommended path (STR license, mid-term >30-day rentals, or walk away).
- Cite code sections inline like (909.03.B).
- Never give legal advice disclaimers longer than one clause. Be direct.`;

  const user = JSON.stringify({
    address: parcel?.siteAddress,
    city: parcel?.siteCity,
    parcelId: parcel?.parcelId,
    dwellingType: parcel?.dwellingType,
    landUse: parcel?.landUseDescription,
    livingUnits: parcel?.livingUnits,
    homesteaded: parcel?.homestead,
    scenario,
    verdict: r.verdict,
    strApplies: r.strApplies,
    exemption: r.exemption,
    seasonMath: r.seasons,
    annual: r.annual,
    licensing: r.licensing,
    flags: r.flags,
  });

  const out = await env.AI!.run(MODEL, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_tokens: 700,
    temperature: 0.2,
  });

  if (typeof out === "string") return out;
  return out?.response ?? null;
}

function fallbackNarrative(
  parcel: ParcelFacts | null,
  scenario: Scenario,
  r: EngineResult,
): string {
  const addr = parcel?.siteAddress ?? "this address";
  const lines: string[] = [];
  lines.push(`VERDICT: ${r.verdict} — ${r.headline}.`);

  if (r.strApplies && r.seasons.length) {
    const [w, s] = r.seasons;
    lines.push(
      `Booking math: Roseville caps rental frequency, not just stay length. ` +
        `Oct 1–May 1 allows one rental commencement per ${w.minStartSpacingDays} days ` +
        `(max ${w.maxBookings} bookings, ~${w.sellableNights} nights at ${scenario.avgStayNights}-night stays). ` +
        `May 1–Oct 1 allows one per ${s.minStartSpacingDays} days ` +
        `(max ${s.maxBookings}, ~${s.sellableNights} nights). ` +
        `Annual: ~${r.annual.sellableNights} sellable nights ≈ ${r.annual.occupancyPct}% occupancy vs the ~75% a naive pro-forma assumes.`,
    );
    lines.push(
      `Revenue at $${scenario.adr}/night: ~$${r.annual.grossRevenue.toLocaleString()} gross, ` +
        `minus 3% lodging tax ($${r.annual.lodgingTax.toLocaleString()}) and the $${r.annual.licenseAndFees} ` +
        `license → ~$${r.annual.netRevenue.toLocaleString()} before operating costs. ` +
        `Optimized strategy (${r.seasons.map((m) => `${m.optimalStayNights}-night stays`).join(" / ")}) ` +
        `could reach ~${r.annual.optimalNights} nights ($${r.annual.optimalRevenue.toLocaleString()} gross) — ` +
        `but requires guests booking week-plus stays.`,
    );
    lines.push(
      `Key risks: the 500-ft spacing rule (909.03.B) can hard-block a new license — verify in Accela before offering. ` +
        `The license does not transfer on sale (909.06.C): you cannot host until your own license issues. ` +
        `Stays >30 days sidestep the frequency cap entirely via Ch. 907 registration ($45/unit/yr) — ` +
        `for ${scenario.avgStayNights <= 4 ? "your short-stay model, mid-term is likely the stronger play" : "flexibility, holding both options costs little"}.`,
    );
  } else {
    lines.push(r.flags.join(" "));
  }
  return lines.join("\n\n");
}
