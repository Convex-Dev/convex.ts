# Release Automation Guide

This document explains how to automate releases for `@convex-world/convex-ts`.

## Quick Start

### 🚧 Development Snapshots (Automatic)

Every push to the `develop` branch automatically publishes a snapshot release:

- **Version format:** `0.1.0-dev.abc1234.1707567890` (base version + git SHA + timestamp)
- **npm tag:** `dev`
- **Installation:** `pnpm add @convex-world/convex-ts@dev`
- **GitHub:** Creates pre-release with snapshot tag

**No setup needed!** Just push to `develop`:

```bash
git checkout develop
# make changes
git commit -m "Add new feature"
git push origin develop
# Snapshot automatically published in ~2 minutes
```

Use snapshots for:
- Testing unreleased features
- Integration testing in other projects
- Sharing work-in-progress with team

---

### Option 1: Fully Automated (GitHub Actions) ⭐ Recommended

**Setup once:**

1. Configure npm Trusted Publishing (no tokens needed!):
   - Go to https://www.npmjs.com/package/@convex-world/convex-ts/access
   - Click "Publishing access" → "Configure trusted publishing"
   - Add GitHub Actions publisher:
     - Repository: `Convex-Dev/convex.ts`
     - Workflow: `release.yml`
   - Add another for `snapshot.yml`

2. That's it! The workflow is already committed.

**To release:**

```bash
# 1. Update version in package.json
cd packages/convex-client
npm version patch  # or minor, or major

# 2. Update CHANGELOG.md
# Add entry for the new version

# 3. Commit and push
git add -A
git commit -m "Bump version to v0.1.1"
git push origin master

# 4. Create and push tag
git tag v0.1.1
git push origin v0.1.1
```

GitHub Actions will automatically:
- ✅ Run tests
- ✅ Build the package
- ✅ Publish to npm
- ✅ Create GitHub release with changelog

### Option 2: Semi-Automated Script

Use the all-in-one publish script:

```bash
# Make script executable (first time only)
chmod +x scripts/publish.sh

# Run the script
./scripts/publish.sh
```

This script will:
1. ✅ Check you're on master branch
2. ✅ Check working directory is clean
3. ✅ Run tests
4. ✅ Build package
5. ✅ Verify package contents
6. ✅ Publish to npm
7. ✅ Create git tag
8. ✅ Create GitHub release (if `gh` CLI installed)
9. ✅ Push to remote

### Option 3: Manual with `gh` CLI

```bash
# 1. Publish to npm manually
cd packages/convex-client
pnpm publish --access=public

# 2. Create and push tag
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0

# 3. Create GitHub release
./scripts/create-release.sh v0.1.0
```

---

## Workflows Overview

This repo has two automated workflows:

### 1. **Snapshot Release** (`.github/workflows/snapshot.yml`)

**Trigger:** Push to `develop` branch

**Actions:**
1. Build package
2. Generate snapshot version: `{version}-dev.{sha}.{timestamp}`
3. Publish to npm with `@dev` tag
4. Create GitHub pre-release
5. Comment on related PRs

**Example versions:**
- `0.1.0-dev.abc1234.1707567890`
- `0.2.0-dev.def5678.1707567900`

**Installation:**
```bash
# Latest dev snapshot
pnpm add @convex-world/convex-ts@dev

# Specific snapshot
pnpm add @convex-world/convex-ts@0.1.0-dev.abc1234.1707567890
```

### 2. **Release** (`.github/workflows/release.yml`)

**Trigger:** Push tag matching `v*` (e.g., `v0.1.0`)

**Actions:**
1. Run tests
2. Build package
3. Extract changelog for version
4. Publish to npm with `@latest` tag
5. Create GitHub release with notes

**Example tags:**
- `v0.1.0` → Production release
- `v0.2.0-beta.1` → Beta release
- `v1.0.0` → Major release

---

## Detailed Setup Instructions

### Setting Up GitHub Actions

#### 1. Create npm Access Token

1. Go to https://www.npmjs.com/settings/[username]/tokens
2. Click "Generate New Token" → "Classic Token"
3. Select "Automation" type (recommended) or "Publish"
4. Copy the token (starts with `npm_...`)

#### 2. Add Token to GitHub Secrets

1. Go to your repo: https://github.com/Convex-Dev/convex.ts
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click "Add secret"

#### 3. Verify Workflow File

The workflow file is at `.github/workflows/release.yml`. It triggers on tags matching `v*`.

#### 4. Test the Workflow

```bash
# Create a test tag (you can delete it later)
git tag v0.1.0-test
git push origin v0.1.0-test

# Watch the workflow run at:
# https://github.com/Convex-Dev/convex.ts/actions
```

### Installing `gh` CLI (for manual scripts)

The GitHub CLI tool is needed for manual release creation.

**macOS:**
```bash
brew install gh
gh auth login
```

**Windows:**
```bash
winget install --id GitHub.cli
gh auth login
```

**Linux:**
```bash
# Debian/Ubuntu
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

gh auth login
```

---

## Release Workflow Comparison

| Method | Setup Effort | Automation Level | Control | Best For |
|--------|--------------|------------------|---------|----------|
| **GitHub Actions** | Medium (one-time) | 🤖🤖🤖 Full | Low | Regular releases, team projects |
| **Publish Script** | Low | 🤖🤖 High | Medium | Quick releases, solo dev |
| **Manual + gh CLI** | Low | 🤖 Partial | High | One-off releases, learning |
| **Fully Manual** | None | Manual | Full | Testing, special cases |

---

## Release Checklist

Before any release, ensure:

- [ ] All tests pass: `pnpm test`
- [ ] Version bumped in `packages/convex-client/package.json`
- [ ] `CHANGELOG.md` updated with new version
- [ ] All changes committed and pushed to `master`
- [ ] Working directory is clean: `git status`

---

## Troubleshooting

### GitHub Actions workflow doesn't trigger

**Problem:** Pushed tag but no workflow runs.

**Solution:** Check that:
1. Workflow file exists at `.github/workflows/release.yml`
2. Tag matches pattern `v*` (e.g., `v0.1.0`, not `0.1.0`)
3. Workflow is enabled in repo settings

### npm publish fails with 401 error

**Problem:** Authentication error during publish.

**Solution:**
- Verify `NPM_TOKEN` secret is set correctly
- Check token hasn't expired
- Ensure token has publish permissions
- Verify you're a member of `@convex-world` org

### GitHub release creation fails

**Problem:** `gh` command not found or fails.

**Solution:**
- Install `gh` CLI: https://cli.github.com/
- Authenticate: `gh auth login`
- Verify permissions: `gh auth status`

### Script permission denied

**Problem:** `./scripts/publish.sh: Permission denied`

**Solution:**
```bash
chmod +x scripts/publish.sh
chmod +x scripts/create-release.sh
```

### Version tag already exists

**Problem:** `Tag v0.1.0 already exists`

**Solution:**
```bash
# Delete local tag
git tag -d v0.1.0

# Delete remote tag (careful!)
git push origin :refs/tags/v0.1.0

# Or bump to next version
npm version patch
```

### Snapshot release not appearing

**Problem:** Pushed to `develop` but no snapshot published.

**Solution:**
1. Check workflow runs: https://github.com/Convex-Dev/convex.ts/actions
2. Verify `NPM_TOKEN` secret is set
3. Check build doesn't fail
4. Ensure commit actually pushed to `develop` branch

### Want to test snapshot locally before pushing

**Solution:**
```bash
# Build locally with snapshot version
cd packages/convex-client
npm version 0.1.0-dev.local.$(date +%s) --no-git-tag-version
pnpm build
pnpm pack

# Test in another project
cd /path/to/test-project
pnpm add /path/to/convex.ts/packages/convex-client/convex-world-convex-ts-*.tgz

# Reset version (don't commit this)
cd /path/to/convex.ts/packages/convex-client
git restore package.json
```

---

## Advanced: Semantic Release

For fully automated versioning and changelog generation, consider [semantic-release](https://github.com/semantic-release/semantic-release):

```bash
pnpm add -D semantic-release @semantic-release/changelog @semantic-release/git
```

**Pros:**
- Automatic version bumping based on commit messages
- Auto-generated changelogs
- Completely hands-off releases

**Cons:**
- Requires conventional commit messages
- Less control over versions
- More complex setup

---

## Resources

- **GitHub Actions docs:** https://docs.github.com/en/actions
- **GitHub CLI docs:** https://cli.github.com/manual/
- **npm tokens:** https://docs.npmjs.com/creating-and-viewing-access-tokens
- **Semantic versioning:** https://semver.org/
- **Conventional commits:** https://www.conventionalcommits.org/
