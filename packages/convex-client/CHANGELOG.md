# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-02-10

### Added
- Initial release of @convex-world/convex-ts TypeScript/JavaScript client
- `Convex` class for connecting to Convex network peers
- Account management (create account, get account info)
- Transaction submission and signing
- Cryptographic key pair generation and management (Ed25519)
- Query execution for network state
- Keystore functionality for secure key storage
- Identicon generation for addresses
- Full TypeScript type definitions
- ESM module support
- Comprehensive API for interacting with Convex DLT

### Dependencies
- axios ^1.6.0 for HTTP client
- @noble/ed25519 ^2.0.0 for Ed25519 cryptography
- @noble/hashes ^1.8.0 for cryptographic hashing

[Unreleased]: https://github.com/Convex-Dev/convex.ts/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Convex-Dev/convex.ts/releases/tag/v0.1.0
