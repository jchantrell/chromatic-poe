#!/usr/bin/env bash
set -euo pipefail

# Usage: upsert-release.sh <game> <title-prefix>
# Env: GH_TOKEN, VERSION, DATA_CHANGED, GITHUB_REPOSITORY
GAME="$1"
TITLE_PREFIX="$2"
TAG="data-${GAME}-${VERSION}"
OUTPUT_DIR="app/data/output"

# Always publish manifest.json (advances checkedAt for cadence). Publish data
# files only when content changed, keeping ladder freshness without churn.
if [ "${DATA_CHANGED}" = "true" ]; then
  ASSETS=("$OUTPUT_DIR"/*.json)
else
  ASSETS=("$OUTPUT_DIR/manifest.json")
fi

if gh release view "$TAG" --repo "$GITHUB_REPOSITORY" &>/dev/null; then
  gh release upload "$TAG" "${ASSETS[@]}" --clobber --repo "$GITHUB_REPOSITORY"
else
  gh release create "$TAG" "$OUTPUT_DIR"/*.json --latest=false \
    --title "${TITLE_PREFIX} Data ${VERSION}" \
    --notes "Auto-generated game data for ${TITLE_PREFIX} patch ${VERSION}" \
    --repo "$GITHUB_REPOSITORY"
fi

# Pointer release the app resolves to find the newest built version per game.
POINTER_TAG="data-${GAME}-latest"
echo "{\"version\":\"${VERSION}\"}" > latest.json
if gh release view "$POINTER_TAG" --repo "$GITHUB_REPOSITORY" &>/dev/null; then
  gh release upload "$POINTER_TAG" latest.json --clobber --repo "$GITHUB_REPOSITORY"
else
  gh release create "$POINTER_TAG" latest.json --latest=false \
    --title "${TITLE_PREFIX} Latest Data Pointer" \
    --notes "Points to the newest built ${TITLE_PREFIX} data release." \
    --repo "$GITHUB_REPOSITORY"
fi
