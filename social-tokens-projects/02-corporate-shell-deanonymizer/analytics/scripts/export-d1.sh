#!/usr/bin/env bash
# Dump the remote social-housing-db D1 database to data/social-housing-db.sql.
# Uses the repo's wrangler guard: --remote is explicit and required for real
# data-plane reads. Run from anywhere; resolves paths itself.
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
UNIFIED="$HERE/../cloudflare-unified"

mkdir -p "$HERE/data"
cd "$UNIFIED"   # wrangler.toml lives here (binding name -> database id)
"$REPO/scripts/wr" d1 export social-housing-db --remote --output "$HERE/data/social-housing-db.sql"
echo "wrote $HERE/data/social-housing-db.sql"
