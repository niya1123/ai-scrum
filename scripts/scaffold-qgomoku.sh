#!/usr/bin/env bash
set -euo pipefail

# Idempotent scaffold for Quantum Gomoku API routes and docs.
# Safe to re-run: skips existing files.

root_dir="$(cd "$(dirname "$0")/.." && pwd)"

ensure_file() {
  local path="$1"; shift
  local content="$*"
  local dir
  dir="$(dirname "$path")"
  mkdir -p "$dir"
  if [[ -f "$path" ]]; then
    echo "[skip] exists: $path"
  else
    echo "[write] $path"
    printf "%s\n" "$content" > "$path"
  fi
}

# Sample docs (API)
ensure_file "$root_dir/docs/samples/api/quantum-gomoku.http" "### Quantum Gomoku — API Samples

@base=http://localhost:3000
@json=application/json

### Create a new game
POST {{base}}/api/quantum-gomoku/games
Accept: {{json}}

### Retrieve an existing game (replace :id)
GET {{base}}/api/quantum-gomoku/games/00000000-0000-4000-8000-000000000000
Accept: {{json}}

### Place a move (center)
POST {{base}}/api/quantum-gomoku/games/:id/moves
Content-Type: {{json}}
Accept: {{json}}

{
  \"playerId\": \"BLACK\",
  \"position\": { \"row\": 7, \"col\": 7 }
}
"

# Ensure logs dir
mkdir -p "$root_dir/out/logs"
touch "$root_dir/out/logs/.gitkeep"

echo "Scaffold complete."

