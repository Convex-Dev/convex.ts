# convex.ts — Future Work

Tracked items for future development, roughly prioritised.

## High Priority

### FileKeyStore
`MemoryKeyStore` and `LocalStorageKeyStore` are done. A `FileKeyStore` for Node.js (JSON file on disk) would complete the keystore trio for CLI and server use cases.

## Medium Priority

### Subscription / WebSocket Support
The peer REST API is request/response only. When WebSocket subscriptions become available, the client should support reactive state watching.

### Query Result Typing
`Result.value` is `any`. Consider generic typing (`query<T>()`) or runtime type narrowing helpers for common patterns.

### `ResultInfo` Fields
`ResultInfo.trace` is typed `any` and `eaddr` is `string` — these should be refined based on actual CVM response shapes.

### Transfer Receipts
`transfer()` and `transact()` return `Result`. Consider a richer receipt type with typed fields for common transaction outcomes.

### API Reference Documentation
The design docs link to `./api-reference` which doesn't exist yet. Auto-generate from TSDoc comments or write manually.

## Low Priority

### BIP39 Mnemonic Support
Currently documented as a pattern in the accounts guide but not built-in. Consider a `KeyPair.fromMnemonic()` factory.

### Batch Query Helper
A utility to batch multiple queries into a single `(do ...)` expression and parse results back out, reducing round-trips.

### Connection Pooling / Keep-Alive
The client creates a new fetch request for each operation. For high-throughput use cases, connection reuse optimisation may help.

### Convex Lisp Formatter
A utility to safely interpolate TypeScript values into Convex Lisp source strings, preventing injection.

### Design Docs Cleanup
Pre-existing broken links across the design repo (Java, Python, peer-operations pages). The TypeScript pages are clean but other SDK pages have stale cross-references.
