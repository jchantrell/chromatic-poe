#!/usr/bin/env bash
set -e

POE1_PATCH_URL="https://lvlvllvlvllvlvl.github.io/poecdn-bundle-index/poe1/urls.json"
POE2_PATCH_URL="https://lvlvllvlvllvlvl.github.io/poecdn-bundle-index/poe2/urls.json"
POE1_VERSION=$(curl -s $POE1_PATCH_URL | jq -r '.urls[0] | split("/")[-2]')
POE2_VERSION=$(curl -s $POE2_PATCH_URL | jq -r '.urls[0] | split("/")[-2]')


rm -f chromatic.db

echo "Installing dependencies"
pnpm install --frozen-lockfile

echo "Fetching game files from patch servers"
mkdir -p packages/assets/poe2/images
pushd packages/data/poe2
# echo "Using PoE2 version: $POE2_VERSION"
# cat config.json | jq '.patch = "'$POE2_VERSION'"' > temp.json && mv temp.json config.json
npx pathofexile-dat
popd

echo "Extracting game file data to Chromatic format"
pnpm dat
