#!/usr/bin/env bash
#
# Build mockup-player.html from modular src/ files.
# Concatenates CSS and JS in dependency order, injects into template.
#
# Usage: ./build.sh
# Output: mockup-player.html (single self-contained file)

set -euo pipefail

SRC="src"
OUT="mockup-player.html"
TEMPLATE="$SRC/index.html"

# ---- CSS order ----
CSS_FILES=(
  "$SRC/styles/base.css"
  "$SRC/styles/toolbar.css"
  "$SRC/styles/panels.css"
  "$SRC/styles/stage.css"
  "$SRC/styles/timeline.css"
  "$SRC/styles/modals.css"
  "$SRC/styles/components.css"
)

# ---- JS order (matching original file order for correct initialization) ----
# utils.js        — showToast, rrPath, pillPath, formatTime (no deps)
# devices.js      — DEVICES registry, social presets (no deps)
# state.js        — state object, undo/redo (function decls, safe early)
# timeline.js     — virtual timeline engine (let vtTime etc., before render)
# render.js       — DOM refs, render scale, render layers, main render loop
# effects.js      — hand overlay, gradients, particles, LUT, chroma, templates, shared AudioContext
# beat-detector.js — real-time audio beat detection (uses audioAnalyser from effects.js)
# devices-draw.js — drawIPhone16 etc., frame cache
# layers.js       — unified layers panel, text, logo, canvas dragging
# annotations.js  — annotation tools, timing controls
# facecam.js      — webcam/video facecam
# export.js       — screenshot, thumbnail, video/mp4 export
# assets.js       — asset browser, IndexedDB, manifest
# ui.js           — all controls, event handlers, init
JS_FILES=(
  "$SRC/js/utils.js"
  "$SRC/js/devices.js"
  "$SRC/js/state.js"
  "$SRC/js/timeline.js"
  "$SRC/js/render.js"
  "$SRC/js/effects.js"
  "$SRC/js/beat-detector.js"
  "$SRC/js/devices-draw.js"
  "$SRC/js/layers.js"
  "$SRC/js/annotations.js"
  "$SRC/js/facecam.js"
  "$SRC/js/export.js"
  "$SRC/js/assets.js"
  "$SRC/js/ui.js"
)

BODY="$SRC/_body.html"

# ---- Validate all source files exist ----
missing=0
for f in "${CSS_FILES[@]}" "${JS_FILES[@]}" "$BODY" "$TEMPLATE"; do
  if [ ! -f "$f" ]; then
    echo "ERROR: Missing file: $f"
    missing=1
  fi
done
if [ "$missing" -eq 1 ]; then
  echo "Build aborted."
  exit 1
fi

# ---- Build temp concatenated files ----
TMP_CSS=$(mktemp)
TMP_JS=$(mktemp)
trap 'rm -f "$TMP_CSS" "$TMP_JS"' EXIT

for f in "${CSS_FILES[@]}"; do
  cat "$f" >> "$TMP_CSS"
  echo "" >> "$TMP_CSS"
done

for f in "${JS_FILES[@]}"; do
  cat "$f" >> "$TMP_JS"
  echo "" >> "$TMP_JS"
done

# ---- Assemble output using Python for reliable multiline injection ----
python3 -c "
import sys

template = open('$TEMPLATE').read()
css = open('$TMP_CSS').read()
js = open('$TMP_JS').read()
body = open('$BODY').read()

output = template.replace('/* __CSS_INJECT__ */', css)
output = output.replace('<!-- __HTML_INJECT__ -->', body)
output = output.replace('// __JS_INJECT__', js)

with open('$OUT', 'w') as f:
    f.write(output)
"

# ---- Stats ----
css_lines=0
for f in "${CSS_FILES[@]}"; do
  css_lines=$((css_lines + $(wc -l < "$f")))
done

js_lines=0
for f in "${JS_FILES[@]}"; do
  js_lines=$((js_lines + $(wc -l < "$f")))
done

body_lines=$(wc -l < "$BODY")
total=$(wc -l < "$OUT")

echo "Built $OUT"
echo "  CSS:  $css_lines lines (${#CSS_FILES[@]} files)"
echo "  JS:   $js_lines lines (${#JS_FILES[@]} files)"
echo "  HTML: $body_lines lines"
echo "  Total: $total lines"
