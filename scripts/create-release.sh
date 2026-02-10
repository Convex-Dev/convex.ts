#!/bin/bash
set -e

# Script to create a GitHub release from a git tag
# Usage: ./scripts/create-release.sh v0.1.0

if [ -z "$1" ]; then
  echo "Usage: $0 <version-tag>"
  echo "Example: $0 v0.1.0"
  exit 1
fi

TAG="$1"
VERSION="${TAG#v}" # Remove 'v' prefix

echo "Creating GitHub release for $TAG..."

# Extract changelog for this version
CHANGELOG_FILE="packages/convex-client/CHANGELOG.md"

if [ ! -f "$CHANGELOG_FILE" ]; then
  echo "Error: $CHANGELOG_FILE not found"
  exit 1
fi

# Extract the section between ## [VERSION] and the next ## [
RELEASE_NOTES=$(sed -n "/## \[$VERSION\]/,/## \[/p" "$CHANGELOG_FILE" | sed '1d;$d')

if [ -z "$RELEASE_NOTES" ]; then
  echo "Error: No changelog entry found for version $VERSION"
  echo "Please update $CHANGELOG_FILE"
  exit 1
fi

# Create the release using gh CLI
gh release create "$TAG" \
  --title "Release $TAG" \
  --notes "$RELEASE_NOTES" \
  --verify-tag

echo "✅ GitHub release created: https://github.com/Convex-Dev/convex.ts/releases/tag/$TAG"
