#!/usr/bin/env bash
set -e

POE_PATCH_URL="https://poe-versions.obsoleet.org/"
POE1_VERSION=$(curl -s $POE_PATCH_URL | jq -r '.poe')
POE2_VERSION=$(curl -s $POE_PATCH_URL | jq -r '.poe2')


rm -f chromatic.db

echo "Installing dependencies"
pnpm install --frozen-lockfile

echo "Fetching game files from patch servers"
mkdir -p packages/assets/poe2/images
pushd packages/data/poe2
echo "Using PoE2 version: $POE2_VERSION"
cat config.json | jq '.patch = "'$POE2_VERSION'"' > temp.json && mv temp.json config.json
npx pathofexile-dat
popd

echo "Extracting game file data to Chromatic format"
pnpm dat
