#!/bin/bash
# Publish worker-hosted source PDFs to REMOTE R2 and verify them live.
# NOTE: `wrangler r2 object` defaults to a LOCAL simulator. Every command
# below passes --remote explicitly -- never drop those flags.
set -euo pipefail
cd "$(dirname "$0")/.."

BUCKET="landlord-directory-data"
WORKER="https://twin-cities-wage-theft-worker.a-8c6.workers.dev"
FAIL=0

for f in docs/*.pdf; do
  name="$(basename "$f")"
  if [[ ! "$name" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*\.pdf$ ]]; then
    echo "SKIP $name (route rejects this filename; use letters/numbers/._-)"
    continue
  fi
  echo "== $name"
  npx -y wrangler r2 object put "$BUCKET/docs/$name" --remote \
    --file="$f" --content-type=application/pdf 2>&1 | grep -E "complete|ERROR" | head -1
  # verify against REMOTE (not local): byte size must match the repo file
  want=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f")
  got=$(npx -y wrangler r2 object get "$BUCKET/docs/$name" --remote --file=/tmp/verify-docs-tmp >/dev/null 2>&1; stat -f%z /tmp/verify-docs-tmp 2>/dev/null || stat -c%s /tmp/verify-docs-tmp)
  rm -f /tmp/verify-docs-tmp
  if [ "$want" != "$got" ]; then
    echo "FAIL remote size $got != repo size $want"; FAIL=1; continue
  fi
  live=$(curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download}" --max-time 30 "$WORKER/docs/$name")
  echo "live: $live"
  case "$live" in 200*"application/pdf"*"$want") ;; *) echo "FAIL live check"; FAIL=1;; esac
done

exit $FAIL
