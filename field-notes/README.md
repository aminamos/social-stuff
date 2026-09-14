# AI & Environment Research ("Field Notes: AI & Earth")

TanStack Start app with two surfaces: a calculator that converts hours of air conditioning not run into LLM tokens or queries, and a question-answering research assistant over a curated evidence library, optionally refreshed with live Kagi search. It deploys to Cloudflare Workers as `field-notes-ai-earth` (live: https://field-notes.awdnowusaa.cc). Source is housed in [`aminamos/social-stuff`](https://github.com/aminamos/social-stuff) under `field-notes/`.

## Stack

- React 19 + TypeScript, TanStack Router/Start, Vite 7.
- Cloudflare Workers via Wrangler 4 and `@cloudflare/vite-plugin`; worker entry `@tanstack/react-start/server-entry` with `nodejs_compat`.
- LLM providers called from a server function: OpenAI first, then Anthropic, then the Hugging Face router as fallbacks.

## Layout

- `src/routes/index.tsx` - the single route: equivalence table, ask form, evidence, method, and sources sections.
- `src/lib/research.ts` - curated `sourceGroups`, quick questions, method notes, Kagi search, provider calls, and the `answerResearchQuestion` server function.
- `src/lib/equivalence.ts` - place/model/device constants (EIA, Epoch AI, Oviedo 2026 figures) and the Wh-per-token math.
- `src/styles.css` - all styling; `src/router.tsx`, `src/start.ts`, `src/routeTree.gen.ts` - framework wiring.
- `wrangler.jsonc` - worker name, compatibility date/flags, and observability settings.

## Scripts

```powershell
npm install
npm run dev        # vite dev
npm run build      # vite build
npm run deploy     # build + wrangler deploy
npm run typecheck  # tsc --noEmit
npm run cf-typegen # wrangler types
```

No test script is defined.

## Configuration

`.env.example` documents the core variables:

- `META_API_KEY` - serves `Muse Spark 1.3 Free` from `https://api.meta.ai/v1/chat/completions` (Meta's model id is `muse-spark-1.3-contributor`).
- `OPENCODE_API_KEY` - serves `DeepSeek 4.1` from `https://opencode.ai/zen/go/v1/chat/completions` (model `deepseek-v4.1-flash`; the `go` route requires an `x-opencode-session` header, which the server function generates per request).
- `KAGI_API_KEY` - optional; refreshes evidence with the Kagi Search API.
- Answer models live in `answerModels` (`src/lib/research.ts`), requested directly from each provider with `reasoning_effort: high`. The picker shows model names only, and the answer card names the model the provider reported in its response.
- `.env` and `.dev.vars` exist locally and are not committed. Keep `.dev.vars` production-safe: `npm run build` copies it to `dist/server/.dev.vars`, and `wrangler deploy` uploads it as Worker secrets, so every local value becomes a production secret.

## Notes

- No tests; verify UI changes by running the dev server.
- Generated or build output present locally: `dist/`, `.tanstack/`, `.wrangler/`, and `node_modules/`.
- When every provider fails, the answer endpoint reports each provider's status and error message instead of a generic failure. The curated evidence library is still shown in the UI.

## Provenance

Housed here from `E:\development\ai-environment-research` on the Windows
machine (source of the `field-notes-ai-earth` worker deploys, last deploy
2026-09-10). Transferred 2026-09-14 at upstream commit `ee9d540` plus
uncommitted working-tree edits (`.env.example`, `README.md`,
`src/lib/research.ts`, `tsconfig.json`). Secrets (`.env`, `.dev.vars`) were
not transferred — copy `.env.example` to `.env` and fill in keys locally.
