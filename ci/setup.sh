#!/usr/bin/env bash
set -e

echo "Installing dependencies"
pnpm install --frozen-lockfile

echo "Fetching game files from patch servers"
mkdir -p packages/assets/poe2/images packages/assets/poe2/spritesheets
pushd packages/data/poe2
npx pathofexile-dat
popd

echo "Extracting game file data to Chromatic format"
pnpm dat
