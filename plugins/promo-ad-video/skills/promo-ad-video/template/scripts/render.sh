#!/usr/bin/env bash
# Render an ad from a brief.
#   scripts/render.sh briefs/my-ad.json            -> out/my-ad.mp4
#   scripts/render.sh briefs/my-ad.json stills     -> out/my-ad-frames/*.png (quick preview, one frame per scene)
# Optional: REMOTION_BROWSER=/path/to/chrome to use an existing Chrome instead of auto-download.
set -euo pipefail
cd "$(dirname "$0")/.."

BRIEF="${1:?usage: scripts/render.sh briefs/<name>.json [stills]}"
MODE="${2:-video}"
NAME="$(basename "$BRIEF" .json)"
BROWSER_FLAG=()
[[ -n "${REMOTION_BROWSER:-}" ]] && BROWSER_FLAG=(--browser-executable="$REMOTION_BROWSER")

[[ -d node_modules ]] || npm install --silent

if [[ "$MODE" == "stills" ]]; then
  mkdir -p "out/$NAME-frames"
  # One frame ~1.2s into each scene (after entrance animations settle)
  FRAMES=$(node scripts/scene-frames.mjs "$BRIEF")
  i=1
  for f in $FRAMES; do
    npx remotion still src/index.ts Ad "out/$NAME-frames/scene-$i.png" \
      --props="$BRIEF" --frame="$f" "${BROWSER_FLAG[@]}" --log=error
    i=$((i + 1))
  done
  echo "Stills: out/$NAME-frames/"
else
  mkdir -p out
  npx remotion render src/index.ts Ad "out/$NAME.mp4" \
    --props="$BRIEF" --codec=h264 --crf=18 "${BROWSER_FLAG[@]}" --log=error
  echo "Video: out/$NAME.mp4"
fi
