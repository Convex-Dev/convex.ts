# convex.ts — Future Work

Tracked items for future development, roughly prioritised.

## High Priority

### React Hooks (`convex-react`)
The React package currently only has `Identicon` and `NetworkSelector` components. The main value-add would be hooks:
- `useConvex()` — context provider/consumer
- `useQuery(source)` — reactive query with loading/error states
- `useTransact()` — transaction submission helper
- `useAccount()` — current account info

### CI/CD Workflows
No `.github/workflows/` directory. Recommended minimum:
- Lint + typecheck on PR
- Run unit tests on push
- Integration tests against test peer on push to master
- Automated npm publish on tag

### MemoryKeyStore / FileKeyStore
`LocalStorageKeyStore` requires browser `localStorage`. A `MemoryKeyStore` (for testing/CLI) or `FileKeyStore` (for Node.js) would make the keystore abstraction useful outside the browser.

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
