#!/usr/bin/env bash
set -e

if [ "$RUNNER_OS" == "Windows" ]; then
	pnpm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"
else
	pnpm config set script-shell "/usr/bin/bash"
fi

echo "Installing dependencies"
pnpm install --frozen-lockfile

echo "Fetching game files"
pnpm gamefiles

echo "Setting up local DB"
pnpm db

echo "Extracting spritesheets"
pnpm sprites

echo "Extracting images"
pnpm images
