# Field note: environmental impact of frontier AI models

Research notes, 2026-09-14. Question: the labs publish no model-level
environmental metrics — what can be established anyway, and how are
third parties estimating the rest?

**Headline: only one frontier-class model (Meta's Llama 3.1 405B) has an
official training disclosure. Everything else is estimation.**

Confidence labels: **FIRM** = company's own audited disclosure;
**ESTIMATE** = third-party calculation with stated methodology;
**WEAK** = press/rumor with thin sourcing.

## 1. Per-model training

### The one firm disclosure: Meta Llama 3.1 405B (FIRM)

Meta's official model card discloses, for training on H100-80GB (700W TDP):

| Model | GPU-hours | Location-based CO2e | Market-based CO2e |
|---|---|---|---|
| Llama 3.1 8B | 1.46M | 420 t | 0 t |
| Llama 3.1 70B | 7.0M | 2,040 t | 0 t |
| Llama 3.1 405B | 30.84M | 8,930 t | 0 t |
| Family total | 39.3M | 11,390 t | 0 t |

Market-based is 0 because Meta matches 100% of electricity with renewables
(accounting, not physical zero-carbon electrons). Sanity check: 30.84M h ×
0.7 kW × 1.08 PUE ≈ 23.3 GWh facility; 8,930 t ÷ 23.3 GWh ≈ 0.38 kgCO2/kWh —
consistent with a US-weighted grid. Internally consistent.

### GPT-4 / GPT-4-class — estimates only (ESTIMATE, low confidence)

OpenAI discloses nothing. Every estimate traces to one unverified rumor:
~25,000 A100 GPUs for 90–100 days. Published figures disagree by an order
of magnitude:

| Source | Energy | CO2e |
|---|---|---|
| Towards Data Science (2024) | 51.8–62.3 GWh | 12,456–14,994 t (CA grid, 240.6 g/kWh) vs 1,035–1,246 t (hydro grid, 20 g/kWh) |
| arXiv 2601.21632 (2026) | ~28.8 GWh | 11,520 t (generic grid) |
| AI Now Institute (2023) | 3.5–4.2 GWh | 1,500–1,800 t |

The FLOPs view ("From FLOPs to Footprints", arXiv 2512.04142): GPT-4 MoE
scenarios range 2.89e24–3.43e25 FLOPs on ~13T tokens. For scale, Llama 3.1
405B did ~3.8e25 FLOPs for 21.6 GWh IT — so GPT-4 plausibly lands ~10–25
GWh at A100-era efficiency; the 50–62 GWh figures look like low-utilization
upper bounds.

**Takeaway: the carbon-intensity assumption moves CO2e more than the GPU
count does — ~13x swing between California-grid and hydro-grid numbers for
the same model.**

### Claude (Anthropic), Gemini (Google), Grok (xAI)

No training energy, compute, or emissions disclosed for any Claude, Gemini,
or Grok model. No credible third-party per-model estimate exists. Scale
context only for xAI: Colossus (Memphis) built with 100,000 H100s (Sept
2024), since expanded; power requests up to ~1.1 GW for the second site.

### Reference anchors

- GPT-3 = 552 tCO2e (Patterson et al. 2021)
- BLOOM = 50.5 tCO2e (French nuclear grid)
- Mistral 7B: 8,000 H100 × 14 days → 98 MWh, 42 tCO2e (vendor disclosure)

## 2. Inference

### Measured: Google Gemini (FIRM — best data available)

Google's Aug 2025 paper "Measuring the environmental impact of delivering
AI at Google Scale" (arXiv 2508.15734), measured in production with full
stack (accelerator + host CPU/memory + idle provisioned capacity +
data-center overhead):

- **Median Gemini Apps text prompt: 0.24 Wh energy, 0.03 gCO2e, 0.26 mL
  water** (~"watching TV for <9 seconds")
- May 2024 → May 2025: median prompt energy down 33x, carbon down 44x, at
  higher quality
- Caveat: Google doesn't disclose total query volume, so fleet totals can't
  be derived from this

### Estimated: GPT-4o / ChatGPT

- **Epoch AI (Feb 2025, ESTIMATE):** ~0.3 Wh per average query (MoE ~100B
  active params, ~500-token response; GPU-server energy only, excludes
  PUE/overhead). Longer queries: 2.5–40 Wh.
- **Sam Altman, OpenAI (June 2025 blog, WEAK):** 0.34 Wh + 0.000085 gal
  (0.32 mL) water per "average" query — no methodology, model unnamed.
- The old ~3 Wh/query figure (de Vries) assumed older chips — ~10x too high
  per Epoch.
- Reasoning models cost far more: GPT-4.5 ~30 Wh for a long prompt,
  o3 ~3.9 Wh, GPT-4.1 nano ~0.45 Wh (Jehham et al. 2025).

### Rules of thumb (derived, ESTIMATE)

Frontier-class ≈ 0.001 Wh/token (~1,000 kWh per 1M tokens); 70B-class ≈
0.0003 Wh/token (~300 kWh/MTok). Output tokens cost ~5x input tokens.

## 3. Fleet/company-level (firm disclosures)

| Company | Period | Electricity | Total emissions | Water |
|---|---|---|---|---|
| Google (2026 Env Report) | 2025 data | demand +37% YoY | operational emissions −2% YoY; 9th year matching 100% electricity w/ renewables | — |
| Google (2025 Env Report) | 2024 | 32.1M MWh total (30.8M data centers, +27% YoY) | DC emissions −12% YoY, total +11% YoY; Scope 3 +22% | consumed 7.9B gal |
| Microsoft (FY2025) | to Jun 2025 | 37.0M MWh (+24%) | ~20.3M tCO2e (+25% YoY; +58% vs 2020) | 8,170 ML consumed (+22%) |
| Amazon (2024) | 2024 | not disclosed | 68.25M tCO2e (+6%; +33% vs 2019) | not disclosed |
| Meta (2024) | 2024 | 18.4M MWh | 8.2M tCO2e net; Scope 3 = 99% (embodied carbon in buildings + hardware) | — |

**Market-based ≈ 0 for all four** via RECs, but location-based Scope 2 is
5–11M tCO2e each. For any physical extrapolation, use location-based.

## 4. Water

- Direct WUE (L/kWh): AWS 0.12, Meta 0.19, Microsoft 0.27. Google
  undisclosed (implied higher).
- **Indirect (grid-embedded) water is the hidden majority:** Meta is the
  only hyperscaler reporting it — 19B gallons in 2024, >20x its direct use.
- Per-query: Google measured 0.26 mL/median Gemini prompt; Altman claims
  0.32 mL/query (no methodology).
- "Water positive by 2030" pledges count only direct operational water and
  rely on restoration projects elsewhere — they exclude the indirect water,
  which is ~3–20x larger.

## 5. How third parties estimate (methods)

1. **GPU-hours × TDP × PUE × carbon intensity.** Facility kWh = GPU-hours ×
   GPU kW × PUE (H100 = 700W; B200 = 1000–1200W; Google PUE 1.09, Meta 1.08,
   AWS 1.15). TDP is an upper bound — sustained training draw is often
   60–80%; failed runs/retries add ~10–20%+ at scale.
2. **FLOPs → energy** via measured hardware efficiency (fewer moving parts,
   still needs architecture guesses for closed models).
3. **Measured production inference** (Google's approach) — the only firm
   inference data in existence.

## 6. EU AI Act note

Annex XI requires "known or estimated energy consumption of the model" in
the technical documentation — but it goes to the AI Office and national
authorities on request, not to the public. The public gets only a
training-data summary (copyright-focused, no energy metrics). Open-source
models below the systemic-risk threshold are exempt. The Code of Practice's
Model Documentation Form even has an escape hatch: providers are exempt
from disclosing training energy if they claim to lack "critical information
from a compute or hardware provider."

## Sources

- Meta Llama 3.1 model card (github.com/meta-llama)
- Google, "Measuring the environmental impact of delivering AI at Google
  Scale", arXiv 2508.15734 (Aug 2025)
- Google Environmental Reports 2025 & 2026 (blog.google / sustainability.google)
- Microsoft FY2025 Sustainability Report; Amazon 2024 Sustainability Report;
  Meta 2025 Sustainability Report (2024 data)
- Epoch AI via TechCrunch (Feb 2025); Towards Data Science GPT-4 analyses
- arXiv 2601.21632, 2507.20018v1, 2512.04142, 2505.09598v6; Patterson et al.
  2021; Jehham et al. 2025; Rystad Energy (2025)
