# Estimating AI Models' Environmental Footprint Without Lab Disclosures

Research notes, September 2026. Question: what do Meta, OpenAI, Anthropic, and
Google publish about the social/environmental impact of training and inference,
and how can the gaps be estimated from third-party data?

## 1. Disclosure status (verified September 2026)

- **Muse Spark safety & preparedness report** (May 2026, 11,469 lines
  extracted): full-text search for environment, climate, carbon, emission,
  energy, electricity, water, sustainability, training compute, inference cost,
  social/societal impact, labor, equity returns nothing relevant. "Environment"
  appears only as agent/sandbox/deployment environment; "inference compute"
  only as eval-scaling analysis; "impact" only as weapons-impact categories.
  No training/inference footprint section exists.
- **Muse Spark 1.3 pages** (announcement, Artificial Analysis, eesel
  breakdown): same search, zero relevant hits.
- **Meta:** last direct training disclosure is Llama 3 (8B + 70B pretraining
  ≈ 2,290 tCO₂eq, Dubey et al. 2024). Llama 4 discloses tokens (>30T) but not
  energy/carbon/water. Corporate sustainability reports give aggregate
  data-center energy only.
- **OpenAI:** no model-specific energy data since GPT-3 (2020). Only current
  figure is Sam Altman's June 2025 blog claim: ~0.34 Wh + ~0.000085 gal water
  per average ChatGPT query. No methodology, no per-model training data, no
  GPT-5/GPT-6 disclosure. Published GPT-4o footprint numbers
  (~392–463 GWh/yr, ~138–163 ktCO₂/yr) are third-party estimates (Jegham et
  al.), not OpenAI data.
- **Anthropic:** Claude 3 model card sustainability section is qualitative
  only (offsets + renewable cloud). No Scope figures, no per-token data.
- **Google (partial exception):** August 2025 Gemini inference methodology:
  median Gemini Apps text prompt = 0.24 Wh, 0.03 gCO₂e, 0.26 mL water, with
  33x/44x efficiency gains May 2024–May 2025. Inference-only, text-only;
  training excluded.
- **Mistral (only full current disclosure):** July 2025 Large 2 LCA with
  ADEME/Carbone 4: training ≈ 20.4 ktCO₂e + 281,000 m³ water; per 400-token
  Le Chat response ≈ 1.14 gCO₂e + 45 mL water; training + inference = 85.5%
  of GHG, servers/manufacturing = 11%.
- Context: May 2025 usage-weighted analysis finds ~84% of LLM usage flows
  through models with no disclosure, ~2% with direct disclosure. A 2025
  CNaught assessment found 10 of 13 AI companies disclosed zero environmental
  metrics to customers.

## 2. Estimation methods

Two independent paths, then cross-check. Figures below are methods and
published anchor factors, not lab disclosures.

### 2.1 Training: compute → energy → emissions → water

- Compute: FLOPs ≈ 6 × params × tokens (dense Transformer; adjust for MoE
  with active params).
- Energy: E (kWh) = N_GPUs × P_GPU (kW) × hours × PUE × overhead. Overhead
  ≈ 1.2–1.4x for CPU, DRAM, network, idle provisioning when only
  accelerator power is known.
- Carbon: tCO₂e = E × carbon intensity (kg/kWh). Report location-based (grid
  average, e.g. Electricity Maps) and market-based (provider claim)
  separately.
- Water: m³ = E × WUE (L/kWh) + manufacturing share if doing full LCA.

Input priority:

1. Lab-stated GPU type/count, time, tokens, location (Llama 2/3 papers).
2. Leaks/adjacent disclosure (e.g. GPT-4 ≈ 25k A100 × 90–100 days).
3. Proxy: same-size open model with known training (e.g. Llama 3.1 405B
   ≈ 8,200–8,900 tCO₂e) scaled by 6ND ratio.
4. Calculators: Green Algorithms, CodeCarbon, ML CO₂ Impact.

For undisclosed frontier models: parameter estimate × token estimate × GPU
efficiency, published as a range across PUE 1.1–1.4 and CI 0.2–0.5 kg/kWh.
Add ~11% for embodied server emissions if claiming lifecycle (Mistral LCA).

### 2.2 Inference: per-query → annual

a) **Bottom-up benchmark.** Run an open proxy of similar active-params on a
metered GPU, measure with nvidia-smi or CodeCarbon across output lengths and
batch sizes. Anchors: ML.Energy leaderboard; Jegham et al.; Mistral 1.14
gCO₂e + 45 mL per 400 tokens; Google 0.24 Wh median as efficient lower bound.
b) **Top-down allocation.** Corporate sustainability report (aggregate MWh,
WUE, fleet CI) × AI share (IEA, Verdantix, Bloomberg) ÷ query volume. Gives
fleet-average per-query; compare against (a).
c) **Price-implied.** $/1M tokens → margin and $/kWh assumptions → upper
bound on kWh/1M tokens. Sanity check only.

Annualize: per-query Wh × queries/day × 365. Separate text vs.
reasoning/image/video — reasoning multiplies tokens and energy ~5–70x.

### 2.3 Minimum credible estimate table

Per model publish: assumed active params, tokens in/out, GPU, batch, PUE,
CI (location + market), WUE, boundary (chip-only vs. full data center), and
min–max. Grade sources direct lab data > indirect compute data > pure
estimate (prompt-carbon methodology).

## 3. Supply-chain anchors per lab (fleet totals are public; per-model allocations are not)

### Meta — owns data centers, buys Nvidia + builds own chips

- Fleet: ~350k H100 target by end-2024, ~600k H100-equivalents incl. other
  silicon. Documented: two 24,576-H100 Llama-3 clusters (Grand Teton
  platform); one 129,000-H100 cluster across five adjacent DCs. Llama 3
  training used ~50k H100s.
- Sites: new AI builds in Kuna ID, Temple TX, Davenport IA, Cheyenne WY.
  Flagship: Hyperion, Richland Parish LA — 4M sq ft, expanded July 2026 to
  5 GW / >$50B.
- Power relevance: Entergy adding ~$3.2B of gas plants (two near site), so
  Louisiana training power is gas-marginal regardless of fleet-average clean
  claims.
- Muse Spark: only published claim is "order of magnitude less compute than
  Llama 4 Maverick." Combine with H100 ~700W, Meta PUE ~1.1, MISO South
  grid intensity for the range.

### OpenAI — rents everything; Azure → Stargate multi-cloud

- Azure-exclusive until Jan 2025; now Microsoft has right of first refusal
  and OpenAI may use rivals.
- Stargate Abilene TX (flagship): Crusoe builds, Oracle operates on OCI,
  8 halls toward ~1.4 GW; 64,000 GB200s targeted by end-2026. Full-build
  press claims of 400–450k GPUs are unmetered — treat as claim.
- Expansion: 5 further sites (Shackelford TX, Doña Ana NM, Midwest/Ohio,
  Michigan 1 GW) toward 7–10 GW, $400–500B. Suppliers: Oracle 4.5 GW pact,
  CoreWeave +$6.5B, Nvidia pact to 10 GW, AMD 6 GW, Broadcom custom chips
  from H2 2026.
- GPT-6 Astra training reported (single weak source) as ~100k+ Grace
  Blackwell GPUs, likely Abilene — upper-bound scenario only.
- Illustrative math (not a GPT-6 claim): 64k × ~1.5 kW/system × 24h × 90d
  × PUE 1.2 ≈ 250 GWh; × ERCOT ~0.4 kg/kWh ≈ ~100 ktCO₂. Vary days, PUE
  1.15–1.3, CI 0.3–0.5 for the band.

### Anthropic — rents; AWS primary, Google second, Nvidia third

- AWS primary training partner: Project Rainier up to 5 GW, ~1 GW Trainium
  by end-2026.
- Google Cloud: up to 1M TPUs, tens of $B, >1 GW online in 2026. Mix:
  Trainium + TPU + Nvidia GPUs. Reported sites NY/TX/LA/IN with Google as
  financial backstop (single source — flag it).
- Claude 5.x: no training location disclosed. Bound with Trainium2
  (~800W–1kW system) vs TPU v6/v7, AWS vs Google PUE/CI.

### Google — owns data centers, designs its own chips

- Gemini trains end-to-end on TPUs; Gemini 3 primary sites New Albany and
  Columbus, Ohio. Generations: Trillium (v6), Ironwood (v7), TPU 8t training
  / 8i inference (April 2026); distributed training claimed past 1M TPUs.
- Metered anchor: Mayes County OK — 8× TPU v4 pods = 32,768 chips,
  PUE 1.10, ~90% hourly carbon-free. Exception: some sovereign Gemini
  deployments run on Nvidia Blackwell via Virgo fabric, not TPUs.
- Use 0.24 Wh/prompt as efficient-inference lower bound, PJM/Ohio grid
  intensity for location-based upper bound.

## 4. Muse Spark 1.3 notes (model in daily use; released Sept 2, 2026)

- Proprietary reasoning model; Muse Code + Meta Model API; 1M-token
  context, text+image+video input. Open weights on roadmap, not shipped.
- Changes vs 1.2: long-horizon agentic work, clarifying questions, ~20%
  fewer tool calls / ~25% fewer tokens on coding tasks, better
  prompt-injection resistance and irreversible-action calibration.
- Third-party: Artificial Analysis lists max (Index 48, 228 t/s, $1.60/task)
  and xhigh (45, 217 t/s, $1.37/task) tiers. MRCR long-context 98.5/98.1.
- Pricing: standard xhigh $1.25/$4.25 per 1M in/out (private); contributor
  endpoint ~$0.10/$0.20 per 1M (Meta trains on your traffic;
  community-quoted, high-confidence but unofficial). Max tier benchmarked,
  not purchasable.
- No environmental disclosure of any kind (see section 1). Estimation
  inputs: token/speed figures above, H100 power + overhead, Meta PUE ~1.1,
  training-site grid intensity.

## Appendix: disclosure-request email (BCC-able)

Subject: Request for current per-model environmental data: training and
inference energy, water, emissions

Hello,

I am writing to request current, model-level environmental data for your
deployed frontier models, covering both training and inference.

Specifically, for each current model family — Meta Muse Spark, OpenAI GPT-6
Astra / GPT-5.6, Anthropic Claude (Fable 5.1 / Mythos 5.1, Sonnet 5,
Opus 5), Google Gemini 3.x — please provide the figures below.

1. Training: total energy (MWh), water consumption (m³), GHG emissions
   (tCO₂e, location-based and market-based), hardware type/count, training
   duration, data center region(s), PUE/WUE/CIF assumptions.
2. Inference: energy, water, and emissions per query by modality and token
   bucket (median, p50/p90), with measurement boundary (accelerator, host,
   idle provisioning, data center overhead).
3. Methodology document stating scope, allocation rules, and reporting
   cadence.

Precedents show this is feasible: Google's August 2025 Gemini inference
methodology and Mistral's Large 2 lifecycle assessment with ADEME/Carbone 4.
Corporate aggregate sustainability figures and undocumented per-query claims
are not substitutes.

Third-party estimates are currently the only public source for most of your
models. Please provide lab-measured figures or state what you do not
measure.

Thank you,
Amin Amos

