# Working agreements

- Bias to action: if the user hands over something relevant, add it without asking. Do not ask about obvious additions — just make them and report what changed.
- If there is an obvious bug, fix it.
- If there is an uncovered test area, write the test.
- Only ask when a choice would change scope, cost, or shape and cannot be reasonably defaulted or reversed.

# Cloudflare guardrails (learned from a real incident)

- Wrangler 4 `r2 object`, `kv`, and `d1 execute` / `d1 migrations apply` /
  `d1 export` default to the LOCAL simulator. Run data-plane commands via
  `./scripts/wr` (refuses to run without explicit `--local`/`--remote`) and
  always pass `--remote` for real data. R2 uploads MUST be verified with a
  `--remote` read (byte-size check) before declaring success.
- Never add a bare (flagless) data-plane wrangler command to any doc, script,
  or comment: `scripts/check_wrangler_scope.py` (CI: `wrangler-scope`) fails
  the build on them.
- `.wrangler/` is gitignored local simulator state. Never `rm -rf .wrangler`
  from the repo root — scope any cleanup to the specific project dir
  (e.g. `rm -rf <project>/.wrangler`), and prefer leaving it alone since it
  regenerates on next `wrangler dev`.
- No dev/prod split: every worker's `npm run dev` runs `wrangler dev
  --remote` (code executes locally, D1/R2/AI bindings hit production — all
  writes are prod writes). Bare `wrangler dev` is refused machine-wide by the
  scope guard; set `WR_ALLOW_LOCAL_DEV=1` for a deliberate simulator session.
