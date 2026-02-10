# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `KeyPair` class with static factory methods (`KeyPair.generate()`, `KeyPair.fromSeed()`, `KeyPair.fromHex()`)
- `Hex` type for flexible input (accepts both `Uint8Array` and hex strings)
- Convenience properties `publicKeyHex` and `privateKeyHex` for KeyPair
- Export methods `toHex()` and `toObject()` for KeyPair serialization
- `transfer()` convenience method for simple coin transfers
- `transact(code: string)` overload for executing Convex Lisp code directly
- `getSequence()` helper method to get current transaction sequence number
- `setTimeout()` method to adjust request timeout

### Changed
- Updated README with modern KeyPair class examples
- Deprecated legacy `generateKeyPair()` and `generateKeyPairFromSeed()` functions (use `KeyPair` class instead)
- Keystore now returns `KeyPair` class instances instead of plain objects

### Fixed
- Keystore methods now properly construct `KeyPair` class instances

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
