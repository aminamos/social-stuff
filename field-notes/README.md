# Field Notes · AI & Earth

An evidence-first guide to AI, energy, water, materials, and people — with an
interactive estimator converting everyday energy use (e.g. AC hours not run)
into inference-token equivalents, plus an ask-a-question panel.

- **Live:** https://field-notes.awdnowusaa.cc/
- **Cloudflare worker:** `field-notes-ai-earth` (account `8c6…1ade58`)
- **Custom domain:** `field-notes.awdnowusaa.cc`

## snapshot/

`snapshot/` is a byte-for-byte capture (2026-09-14) of the files served by the
deployed worker: `index.html` plus the React bundle in `assets/`. Cloudflare
does not offer worker-source download, so this snapshot stands in until the
original build source (the machine that ran `wrangler deploy`) is located and
committed here.

To serve the snapshot locally for reference:

```bash
cd snapshot && python3 -m http.server 8080
```

## Reconnecting the source

1. Find the checkout containing this worker's React source + `wrangler.toml`
   (`name = "field-notes-ai-earth"`).
2. Copy it into this repo root (keeping `snapshot/` for provenance).
3. `wrangler deploy` to update the live worker.
