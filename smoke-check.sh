#!/usr/bin/env bash
#
# Lightweight smoke checks for Mockup Studio
# Usage: ./smoke-check.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "[1/4] Building bundled app..."
./build.sh >/tmp/mockup-studio-smoke-build.log

echo "[2/4] Syntax checking JS modules..."
for f in src/js/*.js; do
  node --check "$f"
done

echo "[3/4] Verifying key files exist..."
test -f mockup-player.html
test -f src/js/export.js
test -f src/js/state.js
test -f src/js/timeline.js
test -f src/js/timeline-enhanced.js

echo "[4/4] Quick source sanity checks..."
rg -q "function startMp4Export" src/js/export.js
rg -q "function applyStateToUI" src/js/state.js
rg -q "function makeClipTrimDraggable" src/js/timeline.js

echo "Smoke checks passed."
