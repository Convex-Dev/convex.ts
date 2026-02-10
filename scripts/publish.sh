#!/bin/bash
set -e

# Complete publishing workflow for @convex-world/convex-ts
# This script:
# 1. Runs tests
# 2. Builds the package
# 3. Publishes to npm
# 4. Creates git tag
# 5. Creates GitHub release
# 6. Pushes to remote

PACKAGE_DIR="packages/convex-client"
PACKAGE_JSON="$PACKAGE_DIR/package.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting publish workflow for @convex-world/convex-ts${NC}"

# Check we're on master branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "master" ]; then
  echo -e "${RED}❌ Error: Must be on master branch (currently on $BRANCH)${NC}"
  exit 1
fi

# Check working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}❌ Error: Working directory is not clean${NC}"
  git status --short
  exit 1
fi

# Get version from package.json
VERSION=$(node -p "require('./$PACKAGE_JSON').version")
TAG="v$VERSION"

echo -e "${YELLOW}📦 Version: $VERSION${NC}"
echo -e "${YELLOW}🏷️  Tag: $TAG${NC}"

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo -e "${RED}❌ Error: Tag $TAG already exists${NC}"
  exit 1
fi

# Confirm with user
echo ""
read -p "Continue with publishing v$VERSION? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

# Step 1: Run tests
echo -e "\n${GREEN}1️⃣  Running tests...${NC}"
pnpm test || {
  echo -e "${RED}❌ Tests failed${NC}"
  exit 1
}

# Step 2: Build package
echo -e "\n${GREEN}2️⃣  Building package...${NC}"
cd "$PACKAGE_DIR"
rm -rf dist
pnpm build
cd ../..

# Step 3: Verify package contents
echo -e "\n${GREEN}3️⃣  Verifying package contents...${NC}"
cd "$PACKAGE_DIR"
pnpm pack
TARBALL=$(ls convex-world-convex-ts-*.tgz)
echo "Package contents:"
tar -tzf "$TARBALL" | head -20
rm "$TARBALL"
cd ../..

# Step 4: Publish to npm
echo -e "\n${GREEN}4️⃣  Publishing to npm...${NC}"
cd "$PACKAGE_DIR"
pnpm publish --access=public || {
  echo -e "${RED}❌ npm publish failed${NC}"
  exit 1
}
cd ../..

echo -e "${GREEN}✅ Published to npm: https://www.npmjs.com/package/@convex-world/convex-ts${NC}"

# Step 5: Create git tag
echo -e "\n${GREEN}5️⃣  Creating git tag...${NC}"
git tag -a "$TAG" -m "Release $TAG"

# Step 6: Create GitHub release
echo -e "\n${GREEN}6️⃣  Creating GitHub release...${NC}"

# Extract changelog for this version
CHANGELOG_FILE="$PACKAGE_DIR/CHANGELOG.md"
RELEASE_NOTES=$(sed -n "/## \[$VERSION\]/,/## \[/p" "$CHANGELOG_FILE" | sed '1d;$d')

if command -v gh &> /dev/null; then
  gh release create "$TAG" \
    --title "Release $TAG" \
    --notes "$RELEASE_NOTES"
  echo -e "${GREEN}✅ GitHub release created${NC}"
else
  echo -e "${YELLOW}⚠️  gh CLI not found, skipping GitHub release${NC}"
  echo -e "${YELLOW}   Install gh CLI: https://cli.github.com/${NC}"
fi

# Step 7: Push to remote
echo -e "\n${GREEN}7️⃣  Pushing to remote...${NC}"
git push origin master --tags

echo -e "\n${GREEN}🎉 Publishing complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📦 Package: https://www.npmjs.com/package/@convex-world/convex-ts"
echo -e "🏷️  Release: https://github.com/Convex-Dev/convex.ts/releases/tag/$TAG"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
