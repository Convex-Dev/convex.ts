# Setting Up Trusted Publishing for npm

npm now uses **Trusted Publishing** (OIDC) instead of access tokens. This is more secure - GitHub Actions authenticates directly with npm, no secrets needed!

## What is Trusted Publishing?

- **No tokens to manage** - Uses OpenID Connect (OIDC) for authentication
- **More secure** - No credentials stored in GitHub secrets
- **Automatic provenance** - Cryptographically verifiable build provenance
- **No 2FA issues** - Authentication happens via OIDC

## Setup Instructions

### Step 1: Initial Package Publication

⚠️ **Important:** You must publish version 0.1.0 manually first, then configure trusted publishing.

```bash
# One-time manual publish (requires your npm credentials)
cd packages/convex-client
pnpm publish --access=public

# Enter your npm credentials when prompted
# This creates the package on npm
```

### Step 2: Configure Trusted Publishing on npm

1. **Go to your package settings:**
   - URL: https://www.npmjs.com/package/@convex-world/convex-ts/access
   - Or: Navigate to package → Settings tab → Publishing access

2. **Enable Trusted Publishing:**
   - Look for "Publishing access" section
   - Click "Configure trusted publishing"

3. **Add GitHub Actions Publisher (for production releases):**
   - Click "Add" or "New publisher"
   - Select provider: **GitHub Actions**
   - Fill in:
     - **Owner:** `Convex-Dev`
     - **Repository:** `convex.ts`
     - **Workflow file:** `release.yml`
     - **Environment:** Leave blank
   - Click "Add publisher"

4. **Add another publisher (for snapshot releases):**
   - Click "Add" again
   - Same settings but change:
     - **Workflow file:** `snapshot.yml`
   - Click "Add publisher"

### Step 3: Verify Workflows

The workflows are already configured with `--provenance` flag and `id-token: write` permission.

**Files already configured:**
- ✅ `.github/workflows/release.yml`
- ✅ `.github/workflows/snapshot.yml`

### Step 4: Test

Push to develop to trigger a snapshot release:

```bash
git commit --allow-empty -m "Test trusted publishing"
git push origin develop
```

Check: https://github.com/Convex-Dev/convex.ts/actions

## How It Works

```
┌─────────────────┐
│ GitHub Actions  │
│                 │
│  1. Workflow    │
│     runs        │
└────────┬────────┘
         │
         │ 2. Requests OIDC token
         │    from GitHub
         ▼
┌─────────────────┐
│    GitHub       │
│                 │
│  3. Issues JWT  │
│     token with  │
│     identity    │
└────────┬────────┘
         │
         │ 4. Presents token to npm
         ▼
┌─────────────────┐
│      npm        │
│                 │
│  5. Verifies    │
│     identity    │
│                 │
│  6. Allows      │
│     publish ✓   │
└─────────────────┘
```

## Benefits

### Security
- ✅ No long-lived tokens to leak
- ✅ No secrets in GitHub
- ✅ Automatic credential rotation
- ✅ Fine-grained access control

### Provenance
- ✅ Cryptographic proof of package origin
- ✅ Build transparency
- ✅ Supply chain security
- ✅ Verifiable builds

Users can verify provenance:
```bash
npm info @convex-world/convex-ts --json | jq .dist.attestations
```

## Troubleshooting

### "Permission denied" error

**Problem:** Workflow fails with permission denied.

**Solution:** Ensure workflow has `id-token: write` permission:
```yaml
permissions:
  contents: write
  id-token: write  # Required!
```

### "Package not found" during setup

**Problem:** Can't configure trusted publishing because package doesn't exist.

**Solution:** Publish v0.1.0 manually first (step 1), then configure trusted publishing.

### "Publisher not found" error

**Problem:** npm can't verify the workflow.

**Solutions:**
- Verify repository name is exactly: `Convex-Dev/convex.ts`
- Verify workflow file name matches: `release.yml` or `snapshot.yml`
- Wait a few minutes for npm to sync
- Try re-adding the publisher

### Still asks for OTP/token

**Problem:** Workflow still fails with OTP request.

**Solutions:**
1. Verify trusted publishing is configured on npm
2. Check workflow has `--provenance` flag
3. Ensure `id-token: write` permission is set
4. Verify you're publishing from the correct workflow

### "Provenance generation failed"

**Problem:** `--provenance` flag fails.

**Solutions:**
- Requires pnpm 8.7.0+ (you have 10.12.4 ✓)
- Requires public package (`--access=public`) ✓
- Must be running in GitHub Actions
- Check `id-token: write` permission

## Migrating from Tokens

If you previously set up `NPM_TOKEN`:

1. **Remove the secret:**
   - Go to: https://github.com/Convex-Dev/convex.ts/settings/secrets/actions
   - Click on `NPM_TOKEN`
   - Click "Remove secret"

2. **Revoke the token:**
   - Go to: https://www.npmjs.com/settings/convexbase/tokens
   - Find the token
   - Click "Delete"

3. Workflows will now use trusted publishing automatically

## References

- **npm Trusted Publishing:** https://docs.npmjs.com/generating-provenance-statements
- **GitHub OIDC:** https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect
- **pnpm provenance:** https://pnpm.io/cli/publish#--provenance
