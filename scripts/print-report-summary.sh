#!/usr/bin/env bash
set -euo pipefail
REPORT=${1:-}
if [[ -z "$REPORT" ]]; then
  # Try latest unified path under out/qa/<RUN_ID>/iter-*/report/index.html, fallback to legacy
  LATEST=$(ls -t out/qa/*/iter-*/report/index.html 2>/dev/null | head -n 1 || true)
  if [[ -n "$LATEST" ]]; then REPORT="$LATEST"; else REPORT="out/playwright-report/index.html"; fi
fi
if [[ ! -f "$REPORT" ]]; then
  echo "NO_REPORT"; exit 1; fi
# Extract test titles and statuses from the report html
# This is a heuristic: look for JSON blobs or data-status attributes
grep -Eo 'data-status=\"[a-z]+\"|>T[123][^<]*<' "$REPORT" | sed 's/^.*data-status=\"/STATUS=/; s/\"$//; s/^>//; s/<$//' | paste - - - - 2>/dev/null || true
