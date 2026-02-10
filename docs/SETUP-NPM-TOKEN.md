# Setting Up NPM_TOKEN for GitHub Actions

Follow these steps to enable automated npm publishing.

## Step 1: Create npm Access Token

1. **Log in to npm:** https://www.npmjs.com/login

2. **Go to Access Tokens:**
   - Click your profile picture (top right)
   - Select "Access Tokens"
   - Or go directly to: https://www.npmjs.com/settings/convexbase/tokens

3. **Generate New Token:**
   - Click "Generate New Token"
   - Select "Classic Token"

4. **Choose Token Type:**
   - **Automation** ⭐ (Recommended for CI/CD)
     - Can publish packages
     - Cannot change account settings
     - More secure for GitHub Actions

   OR

   - **Publish**
     - Can publish packages
     - Can manage package settings
     - More permissions than needed

5. **Copy the Token:**
   - Token looks like: `npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **Save it now!** You can't see it again
   - Store temporarily in a password manager

## Step 2: Add Token to GitHub

1. **Go to Repository Settings:**
   - Navigate to: https://github.com/Convex-Dev/convex.ts
   - Click "Settings" tab (requires admin access)

2. **Navigate to Secrets:**
   - In left sidebar: "Secrets and variables" → "Actions"
   - Make sure you're on the **"Secrets"** tab (not "Variables")

3. **Add Repository Secret:**
   - Click "New repository secret" button
   - **Name:** `NPM_TOKEN` (exactly this, case-sensitive)
   - **Value:** Paste your npm token
   - Click "Add secret"

## Step 3: Verify Setup

### Test with Snapshot Release

```bash
# Push to develop to trigger snapshot workflow
git checkout develop
git commit --allow-empty -m "Test snapshot workflow"
git push origin develop
```

**Check workflow:**
1. Go to: https://github.com/Convex-Dev/convex.ts/actions
2. Find "Snapshot Release" workflow
3. It should succeed and publish `@convex-world/convex-ts@dev`

### Test with Production Release (Optional)

```bash
# Create a test tag
git tag v0.1.0-test
git push origin v0.1.0-test
```

**Check workflow:**
1. Go to: https://github.com/Convex-Dev/convex.ts/actions
2. Find "Release" workflow
3. Should publish `@convex-world/convex-ts@0.1.0-test`

**Clean up test:**
```bash
# Delete test tag
git tag -d v0.1.0-test
git push origin :refs/tags/v0.1.0-test

# Unpublish test version (within 72 hours)
npm unpublish @convex-world/convex-ts@0.1.0-test
```

## Troubleshooting

### ❌ "npm error code E401" (Unauthorized)

**Causes:**
- Token not set correctly
- Token expired
- Token doesn't have publish permissions
- Wrong token type

**Solutions:**
1. Verify secret name is exactly `NPM_TOKEN` (case-sensitive)
2. Generate new token with "Automation" type
3. Delete old secret and add new one
4. Ensure you're a member of `@convex-world` org

### ❌ "npm error code E403" (Forbidden)

**Causes:**
- Not a member of `@convex-world` organization
- Org requires 2FA and token doesn't support it

**Solutions:**
1. Check org membership: `npm org ls convex-world`
2. Use "Automation" token type (supports 2FA)
3. Ask org owner to add you as member

### ❌ "Secret not found in workflow"

**Causes:**
- Secret added to wrong place (environment instead of repository)
- Typo in workflow file (`secrets.NPM_TOKEN`)

**Solutions:**
1. Verify it's a **Repository Secret**, not Environment Secret
2. Check workflow file references `${{ secrets.NPM_TOKEN }}`

### ❌ Token shows in logs

**If you accidentally used a Variable instead of Secret:**

1. **Revoke the token immediately:**
   - https://www.npmjs.com/settings/convexbase/tokens
   - Click "Delete" on the exposed token

2. **Generate new token**

3. **Add as Secret** (not Variable) this time

## Security Best Practices

✅ **DO:**
- Use "Automation" token type for CI/CD
- Store token as Repository Secret (encrypted)
- Generate separate tokens for different workflows
- Regularly rotate tokens (every 6-12 months)
- Revoke tokens immediately if compromised

❌ **DON'T:**
- Use "Publish" tokens (more permissions than needed)
- Store as Variable (not encrypted)
- Share tokens between projects
- Commit tokens to git (obviously!)
- Use personal tokens in shared repos

## Advanced: Environment Secrets

If you later need separate staging/production environments:

1. **Create Environment:**
   - Settings → Environments → New environment
   - Name: "production"

2. **Add Environment Secret:**
   - Click on "production" environment
   - Add secret: `NPM_TOKEN`

3. **Update Workflow:**
   ```yaml
   jobs:
     release:
       runs-on: ubuntu-latest
       environment: production  # Add this line
       steps:
         # ... rest of workflow
   ```

This adds manual approval gates and separate tokens per environment.

## References

- **npm tokens:** https://docs.npmjs.com/creating-and-viewing-access-tokens
- **GitHub secrets:** https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions
- **GitHub environments:** https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment
