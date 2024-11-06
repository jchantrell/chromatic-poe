#!/usr/bin/env bash
set -e

echo "Installing dependencies"
pnpm install --frozen-lockfile
pnpm i -g pathofexile-dat

echo "Fetching game files"
pnpm gamefiles

echo "Setting up local DB"
pnpm db

echo "Extracting spritesheets"
pnpm sprites

echo "Extracting images"
pnpm images
