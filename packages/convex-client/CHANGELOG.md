# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-11

### Breaking Changes
- Replaced axios with native `fetch` — removes the axios dependency entirely
- `TransactionResult` is now a type alias for `Result` (same JSON structure)
- `Result.value` type changed from `string` to `any` to match actual peer responses

### Fixed
- **API endpoints** now match the actual Convex peer REST API:
  - Account creation: `POST /api/v1/createAccount` (was `/api/v1/account/create`)
  - Account info: `GET /api/v1/accounts/{address}` (was `/api/v1/account/{address}`)
  - Transactions: two-step `prepare` + `submit` flow (was single `/api/v1/transaction`)
- **Transaction signing** now correctly signs the hash from prepare step (was signing JSON-stringified data)
- **Browser compatibility** — removed `Buffer.from()` usage, replaced with `bytesToHex()`
- `setAddress()` now strips `#` prefix for consistency

### Added
- `Result.result` field — CVM printed representation (more accurate than `value`)
- `ResultInfo` typed interface for execution metadata (juice, fees, mem, source, trace, etc.)
- `Signer` interface for pluggable signing mechanisms (hardware wallets, extensions, HSM, etc.)
- `KeyPairSigner` class implementing Signer for local key pairs
- `transfer()` convenience method for simple coin transfers
- `transact(code: string)` overload for executing Convex Lisp code directly
- `getSequence()` helper method to get current transaction sequence number
- `setTimeout()` method to adjust request timeout
- Integration test against live peer

### Changed
- **BREAKING**: `KeyPair` constructor is now private — use factory methods instead
  - Use `KeyPair.generate()` for random keys
  - Use `KeyPair.fromSeed()` for deterministic keys
- Convex class now uses Signer abstraction internally instead of raw key pairs
- Deprecated legacy `generateKeyPair()` and `generateKeyPairFromSeed()` functions
- Deprecated `getKeyPair()` method (use `getSigner()` instead)

### Removed
- `axios` dependency (~15KB gzipped savings)

### Dependencies
- @noble/ed25519 ^2.0.0 for Ed25519 cryptography
- @noble/hashes ^1.8.0 for cryptographic hashing

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

### Dependencies
- axios ^1.6.0 for HTTP client
- @noble/ed25519 ^2.0.0 for Ed25519 cryptography
- @noble/hashes ^1.8.0 for cryptographic hashing

[0.2.0]: https://github.com/Convex-Dev/convex.ts/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Convex-Dev/convex.ts/releases/tag/v0.1.0
