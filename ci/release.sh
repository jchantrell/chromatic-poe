#!/usr/bin/env bash

if [ -z "$1" ]; then
	echo "Please provide a tag."
	echo "Usage: ./release.sh v[X.Y.Z]"
	exit
fi

# update version numbers
echo "Preparing $1..."
msg="# managed by release.sh"
sed -i "s/^version = \".*\"/version = \"${1#v}\"/" apps/backend*/Cargo.toml
sed -E -i "s/\"version\": \".+\"/\"version\": \"${1#v}\"/" package.json

# update the changelog
pnpm git-cliff --config cliff.toml --tag "$1" >CHANGELOG.md
git add -A && git commit -m "chore(release): $1"
git show
export GIT_CLIFF_TEMPLATE="\
	{% for group, commits in commits | group_by(attribute=\"group\") %}
	{{ group | upper_first }}\
	{% for commit in commits %}
		- {% if commit.breaking %}(breaking) {% endif %}{{ commit.message | upper_first }} ({{ commit.id | truncate(length=7, end=\"\") }})\
	{% endfor %}
	{% endfor %}"

# sign git tag
changelog=$(pnpm git-cliff --config cliff.toml --unreleased --strip all)
git -c user.signingkey="/home/joel/.ssh/id_ed25519" \
	tag -s -a "$1" -m "Release $1" -m "$changelog"
git tag -v "$1"
echo "Done!"