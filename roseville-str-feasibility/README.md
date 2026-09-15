# Roseville Rental Feasibility Engine

Serverless Cloudflare Worker that answers one question for a Roseville, MN
property address: **what does City Code Chapters 907/908/909 actually allow
here, and what is the real revenue ceiling?**

Investors routinely model Roseville STRs with a naive ~75% Airbnb occupancy
pro-forma. Chapter 909 (as amended by Ordinance 1657, eff. 2024-02-12) makes
that wrong: non-owner-occupied dwellings may commence at most **one rental per
7 days Oct 1–May 1** and **one per 10 days May 1–Oct 1**, plus a **500-ft
spacing rule** against other licensed STRs and a license that **does not
transfer on sale**.

## Stack

- **Cloudflare Worker** (TypeScript), no framework
- **Ramsey County open data** — `LOC_Locator_Composite` geocoder +
  OpenData FeatureServer layer 12 (attributed parcels: homestead flag,
  dwelling type, living units, land use, tax class, sale history)
- **Deterministic rules engine** (`src/rules.ts`) — every constraint cites its
  code section
- **Workers AI** (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) — narrates the
  computed verdict; constrained to engine output, deterministic template
  fallback when the binding is unavailable

## Endpoints

| Route | Description |
|---|---|
| `GET /` | Calculator UI |
| `GET /api/feasibility?address=&adr=&stay=&ownerOccupied=` | Full pipeline: geocode → parcel → engine → narrative |
| `GET /api/geocode?address=` | County geocoder candidates |
| `GET /api/rules` | Engine constants (fees, seasonal windows) |

## Regulatory model

- **STR** = non-owner-occupied dwelling rented ≤30 consecutive days (909.02).
  Requires annual Ch. 909 license ($540, Fee Schedule §314.05).
- **Frequency cap**: one rental commencement per 7 consecutive days
  Oct 1–May 1 (212-day window), per 10 days May 1–Oct 1 (153-day window).
  Cycle = `max(stay_length, spacing)`; a 2-night stay burns a whole slot.
- **500-ft spacing**: no new license within 500 ft of another licensed STR
  (909.03.B; grandfathered for licenses held on 2024-01-01). Licensed STRs are
  not published as open data — engine reports the count of residential parcels
  inside the zone and links the Accela license search.
- **Occupancy**: ≤4 unrelated adults or one family per unit (909.03.A.6).
- **Lodging tax**: 3% of gross on rentals <30 days, monthly return + guest
  register (909.05.B, 909.12, Ch. 312).
- **>30-day stays** exit the STR regime → Ch. 907 registration
  ($45/unit/yr, 1–4 units), Ch. 908 license (5+ units), or Ch. 317
  extended-stay lodging license.
- **909.08 exemptions**: rooms in owner-occupied homes, owner-present stays,
  non-detached ADUs, rent-backs, month-to-month from >30-day leases.
- **License does not transfer on sale** — buyer must apply within 30 days and
  cannot host until issued (909.06.C). Unlicensed operation → license
  ineffective for 90 days (909.06.F) + per-day misdemeanor exposure.
- Neighbor notification to all 1–4 unit residential properties within 300 ft
  within 10 days of approval and every renewal (909.07.C) — the engine counts
  affected parcels live.

## Dev

```bash
npm install
npm test          # engine unit tests (tsx, no CF needed)
npm run check     # tsc --noEmit
npm run dev       # wrangler dev (AI binding runs remote, may incur usage)
npm run deploy
```

## Caveats

- Fee figures are encoded from the published fee schedule; confirm against the
  current §314.05 before relying on them.
- The 500-ft spacing check and zoning-district confirmation are flagged as
  manual verification steps — Roseville publishes neither as open data.
- Not legal advice.
