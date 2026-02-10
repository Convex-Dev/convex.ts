# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `Signer` interface for pluggable signing mechanisms (hardware wallets, extensions, HSM, etc.)
- `KeyPairSigner` class implementing Signer for local key pairs
- `signFor(message, publicKey)` method on Signer to support multi-key signers
- `KeyPair.fromPrivateKey()` factory method (public key is derived)
- `setSigner()` method on Convex class to set signer independently
- `useAddress()` method on Convex class to change address without changing signer
- `getSigner()` method on Convex class to get current signer
- `Hex` type for flexible input (accepts both `Uint8Array` and hex strings)
- Convenience properties `publicKeyHex` and `privateKeyHex` for KeyPair
- Export methods `toHex()` and `toObject()` for KeyPair serialization
- `transfer()` convenience method for simple coin transfers
- `transact(code: string)` overload for executing Convex Lisp code directly
- `getSequence()` helper method to get current transaction sequence number
- `setTimeout()` method to adjust request timeout

### Changed
- **BREAKING**: `KeyPair` constructor is now private - use factory methods instead
  - Use `KeyPair.generate()` for random keys
  - Use `KeyPair.fromSeed()` or `KeyPair.fromPrivateKey()` for deterministic keys
- **BREAKING**: `useAccount()` is now async and accepts Signer, KeyPair, or plain object
- **BREAKING**: Keystore methods `getUnlockedKeyPair()` and `isUnlocked()` are now async
- Convex class now uses Signer abstraction internally instead of raw key pairs
- Signer can manage multiple keys (use `signFor` to specify which key)
- Public key is always derived from private key (prevents invalid state)
- Updated README with modern KeyPair class examples and Signer usage
- Deprecated legacy `generateKeyPair()` and `generateKeyPairFromSeed()` functions
- Deprecated `getKeyPair()` method (use `getSigner()` instead)

### Fixed
- Keystore methods now properly construct `KeyPair` instances using factory methods
- Demo site updated to use new KeyPair API

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
