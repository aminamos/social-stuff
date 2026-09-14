# Twin Cities Housing & Labor Unified Registry (4th worker)

One site to browse all cities/areas for **bad landlords**, **wage theft**, and
**landlords who do both**. Merges the three standalone workers; those three stay
deployed and untouched — all future routes land here.

- Same D1 (`social-housing-db`) and R2 (`landlord-directory-data`) bindings as the other three.
- Crons merged: housing `0 4 * * *` + `*/15 * * * *`, labor `0 5 * * *`, crossover `0 6 * * *`.
- Deploy: `npm run deploy` (or `wrangler deploy`) from this directory.
- Init/upgrade D1: `wrangler d1 execute social-housing-db --file=schema.sql`
  (adds `provenance_type`/`source_docket_url` on `wage_theft_records`, plus
  `worker_reports` and `sync_logs` — the base schema lacked them even though the
  standalone workers query them).

## UIs

| Path | UI |
| --- | --- |
| `/` | Unified: bad landlords / wage theft / dual offenders tabs + city browser |
| `/housing` | Standalone housing registry UI (as before) |
| `/labor` | Standalone wage-theft UI (as before) |
| `/crossover` | Standalone crossover matrix UI (as before) |

## Routes

Housing (unchanged from `mpls-rental-sync-worker`):
`/search`, `/cities`, `/violations`, `/feeds`, `/sync` (POST, authed),
`/sync/:feed` (authed), `/sync/status` (now also includes `sync_history`),
`/wage-theft?q=`, `/wage-theft/top`.

Labor (from `twin-cities-wage-theft-worker`):
`/cases`, `/offenders/top`, `/export.csv`, `/export.md` (= labor dossier, unchanged),
`/seed` (POST), `/sync/live` (GET/POST), `/labor/stats`, `/labor/export.md` (alias),
`/labor/seed` (POST alias), `/labor/sync/live` (alias), `/labor/sync/status`.

Crossover (from `twin-cities-slumlord-labor-matrix`):
`/matrix`, `/crossover/stats`, `/crossover/export.md`.
Note: the crossover UI's export link was remapped to `/crossover/export.md`
because bare `/export.md` is the labor dossier in both standalone workers.

Unified (new — future work goes under `/api/*`):
`/api/cities` (housing + labor coverage per city/area),
`/api/landlords` (bad-landlord search + `?city=`),
`/api/wage-theft` (case search + `?city=` `?agency=` `?repeat=true`),
`/api/crossover` (live D1 dual-offender join + curated dossier),
`/api/crossover-curated` (alias of `/matrix` JSON),
`/api/stats`, `/api/reports` (POST; `POST /report` kept as legacy alias accepting
both the labor and crossover report bodies).

`/stats` returns a merged `stats` object (housing + labor keys are disjoint, so
both legacy UIs render from it) plus `housing` / `labor` / `crossover` breakdowns.

## Source layout

Copied (not moved) from the standalone workers so they keep deploying:
`src/housing/*` ← `cloudflare/src/*`, `src/labor/*` ← `cloudflare-wage-theft/src/*`,
`src/crossover/*` ← `cloudflare-crossover/src/*` (UI + curated matrix data).
New code lives in `src/index.ts` (router) and `src/ui-unified.ts`.
Only edits to copies: crossover UI export link → `/crossover/export.md`,
labor UI sync-status link → `/labor/sync/status`.
