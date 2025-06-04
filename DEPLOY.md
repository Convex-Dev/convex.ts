# Deployment Guide

This guide explains how to deploy the `convex-ts` package to npm.

## Prerequisites

1. You need an [npm account](https://www.npmjs.com/signup)
2. You need to be added as a maintainer to the package
3. Make sure you have pnpm installed globally

## Preparation

1. Ensure all changes are committed and pushed
2. Run tests to ensure everything is working:
```bash
pnpm test
```

3. Update version in `package.json` following [semver](https://semver.org/):
   - MAJOR version for incompatible API changes
   - MINOR version for backwards-compatible functionality additions
   - PATCH version for backwards-compatible bug fixes

## Building

1. Clean the previous build:
```bash
pnpm clean # removes dist directory
```

2. Build the package:
```bash
pnpm build
```

3. Review the contents of the `dist` directory to ensure all files are correctly built

## Testing the Package Locally

1. Pack the package locally:
```bash
pnpm pack
```

2. This will create a file like `convex-ts-x.y.z.tgz`

3. In another project, you can test it:
```bash
pnpm add ../path/to/convex-ts-x.y.z.tgz
```

## Publishing

1. Login to npm:
```bash
pnpm login
```

2. Publish the package:
```bash
pnpm publish --access=public
```

For a pre-release version, use:
```bash
pnpm publish --tag next --access=public
```

## After Publishing

1. Create a git tag for the version:
```bash
git tag -a vx.y.z -m "Release vx.y.z"
git push origin vx.y.z
```

2. Create a GitHub release with:
   - Version number as title
   - Changelog entries as description
   - Link to the full changelog

## Troubleshooting

### Package Name Already Exists

If the package name is taken, you can:
1. Choose a different name in `package.json`
2. Publish under a scope (e.g., `@convex/ts`)

### Authentication Issues

If you get authentication errors:
1. Run `pnpm logout` and then `pnpm login` again
2. Ensure you're added as a maintainer to the package
3. Check your npm account's 2FA settings

### Publishing Errors

1. Ensure your working directory is clean:
```bash
git status
```

2. Check if you're on the main branch:
```bash
git branch
```

3. Verify the version hasn't been published:
```bash
npm view convex-ts versions
```

## Maintenance

### Deprecating a Version

If you need to deprecate a version:
```bash
npm deprecate convex-ts@"<version>" "deprecation message"
```

### Removing a Published Version

Note: This is only possible within 72 hours of publishing:
```bash
npm unpublish convex-ts@x.y.z
```

### Security Updates

1. Regularly check for dependency updates:
```bash
pnpm audit
```

2. Fix security issues:
```bash
pnpm audit fix
```

3. Update dependencies:
```bash
pnpm update
``` 