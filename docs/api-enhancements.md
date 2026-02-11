# convex-ts API Enhancements — Design Document

## Motivation

The current `Convex` client exposes low-level primitives: `query(source)`, `transact(source)`, and `transfer(to, amount)`. Users must hand-write CVM Lisp strings for anything beyond native coin transfers.

Convex has rich on-chain libraries — fungible tokens (CAD29), a generic asset model, and CNS (Convex Name System) — that deserve first-class TypeScript wrappers. These should be:

- **Idiomatic** — feel like TypeScript, not string interpolation
- **Correct** — generate valid CVM source with proper addressing
- **Lightweight** — thin handles over `query()` / `transact()`, no extra state
- **Composable** — asset model hierarchy mirrors the CVM library hierarchy

---

## Core Pattern: Handles

Each on-chain library is exposed via a **handle** — a lightweight object bound to a specific on-chain entity (token address, CNS name) that holds a back-reference to the `Convex` client. Handles generate CVM source strings and delegate to `client.query()` or `client.transact()`.

```ts
// Create handle — no network call, just binds an address
const token = convex.fungible("#128");

// Use handle — generates CVM source, calls query/transact
await token.balance();              // query
await token.transfer("#13", 100);   // transact
```

Handles are **stateless** and **disposable** — creating one is free (no allocation, no network round-trip). They can be stored or created inline:

```ts
// Inline usage
await convex.fungible("#128").balance();

// Stored for repeated use
const gold = convex.fungible("#128");
await gold.balance();
await gold.transfer("#13", 50);
await gold.supply();
```

### Design Principle: Handle Creation is Instant and Local

Handle creation (`convex.fungible()`, `convex.asset()`, `convex.cns()`) is **synchronous** — it never makes a network call. The factory validates the argument (e.g. rejects obviously invalid addresses) and returns immediately.

CNS names like `"@gold.token"` are **not** resolved client-side. They are passed through to CVM source and resolved by the peer at execution time. This keeps handle creation instant and avoids the need for client-side caching of name resolution.

**No client-side caching.** The base client library stays cache-free. Caching belongs in higher-level layers (e.g. `convex-react` with React Query / SWR patterns) where UI rendering semantics make stale-while-revalidate natural.

---

## CVM Source Generation

### No Imports

Generated CVM source **never** uses `import`. Imports mutate the account's environment and cost extra juice. Instead, use CNS-resolved paths directly:

```lisp
;; Single call — use @library/function form
(@convex.fungible/transfer #128 #13 100)

;; Multiple calls in one transaction — local let binding
(let [fun @convex.fungible]
  (fun/transfer #128 #13 100)
  (fun/balance #128 *address*))
```

Each handle method generates a single `@library/function` call. The `let` form is reserved for future batch/multi-call support.

### Address Formatting

CVM source uses `toAddress()` which produces `#42` (numeric) or `@convex.core` (CNS). REST API paths use `toNumericAddress()` which produces a plain number.

### Injection Safety

Handle methods interpolate user-provided values into CVM source strings. Two defences:

**1. Input validation (primary defence).** `toAddress()` rejects anything that doesn't match `#\d+` or `@[a-zA-Z][a-zA-Z0-9._-]*`. `BalanceLike` validation rejects non-numeric strings. CNS names are validated against a strict pattern. This blocks injection vectors at the input boundary.

`FungibleToken` and `CnsHandle` validate all inputs — no raw strings reach CVM source. `AssetHandle` is the one exception: its quantity parameter accepts raw CVM strings for NFT quantities, which are inherently unvalidatable (any CVM value is legal).

**2. `(query ...)` sandboxing (for unvalidated input in transactions).** The CVM `(query ...)` form evaluates its body but **rolls back all state changes**. This is useful specifically when:
- The input is not fully validated (i.e. raw CVM string), AND
- The code is submitted as a transaction (queries are already read-only at the protocol level)

Queries sent via `client.query()` are inherently read-only — the peer won't commit state changes regardless. So `(query ...)` wrapping is redundant there.

For `AssetHandle` transaction methods that accept raw CVM quantity strings, `(query ...)` can sandbox the unvalidated portion:

```lisp
;; The quantity expression is evaluated in a query sandbox,
;; preventing injected side-effects within the quantity argument
(@convex.asset/transfer #13 #128 (query <user-provided-quantity>))
```

Note: transactions require signing, so injection would only affect the caller's own account, further limiting blast radius.

---

## Consistent `balance` / `transfer` Across All Levels

The `balance(holder?)` and `transfer(to, quantity)` methods have **identical signatures** at every level — base client, generic asset, fungible token. Only the underlying CVM source differs:

```ts
// Native CVM coins
await convex.balance();                       // *balance*
await convex.balance("#13");                  // (balance #13)
await convex.transfer("#13", 100);            // (transfer #13 100)

// Fungible token (CAD29)
await convex.fungible("#128").balance();               // (@convex.fungible/balance #128 *address*)
await convex.fungible("#128").balance("#13");           // (@convex.fungible/balance #128 #13)
await convex.fungible("#128").transfer("#13", 100);     // (@convex.fungible/transfer #128 #13 100)

// Generic asset (works with any asset type)
await convex.asset("#256").balance();                   // (@convex.asset/balance #256 *address*)
await convex.asset("#256").balance("#13");               // (@convex.asset/balance #256 #13)
await convex.asset("#256").transfer("#13", #{1 3 7});    // (@convex.asset/transfer #13 #256 #{1 3 7})
```

### Base Convex Methods

The `Convex` class gains `balance()` to complement the existing `transfer()`:

```ts
class Convex {
  /** Query native CVM coin balance */
  async balance(holder?: AddressLike): Promise<Result> { ... }

  /** Transfer native CVM coins (already exists) */
  async transfer(to: AddressLike, amount: BalanceLike): Promise<Result> { ... }
}
```

| Call | CVM source |
|------|-----------|
| `convex.balance()` | `*balance*` |
| `convex.balance("#13")` | `(balance #13)` |
| `convex.transfer("#13", 100)` | `(transfer #13 100)` |

### Quantity Types

CVM asset quantities are **arbitrary values** — not just integers. Fungible tokens use longs, but NFTs can use sets of keywords, vectors, or any CVM value:

```lisp
100                              ;; fungible: long integer
#{1 3 7}                         ;; NFT: set of integer IDs
#{:foo :bar}                     ;; NFT: set of keywords
#{[:PUT 100 6785687 :NOLIMIT]}   ;; NFT: set of vectors
```

This drives a two-tier type strategy:

#### `BalanceLike` — for fungible amounts (validated)

```ts
type BalanceLike = number | bigint | string;
```

| Input | Use case | Formatting |
|-------|----------|-----------|
| `number` | Common small amounts: `100` | `String(n)` — validated integer, `n >= 0` |
| `bigint` | Large/precise amounts: `1000000000000000000n` | `n.toString()` — validated `n >= 0` |
| `string` | Passthrough / large values: `"1000000000000000000"` | Validated `/^\d+$/`, passed through |

Used by `FungibleToken` and `Convex.transfer()`. Rejects negatives, non-integers, non-numeric strings.

**Note:** `number` is unsafe above `Number.MAX_SAFE_INTEGER` (2^53). Values above this threshold should use `bigint` or `string` to avoid silent precision loss.

#### Raw CVM quantity — for generic assets (unvalidated)

`AssetHandle` quantity parameters accept `number | bigint | string`:

- `number` / `bigint` → formatted as integer (same as `BalanceLike`)
- `string` → **passed through verbatim** as raw CVM source

```ts
// FungibleToken — string is validated as numeric integer
await convex.fungible("#128").transfer("#13", 100);                    // OK
await convex.fungible("#128").transfer("#13", "1000000000000000000");   // OK
await convex.fungible("#128").transfer("#13", "#{:foo}");              // ERROR

// AssetHandle — string is raw CVM source, no validation
await convex.asset("#256").transfer("#13", "#{:foo :bar}");            // OK (NFT set)
await convex.asset("#256").transfer("#13", 100);                       // OK (fungible)
await convex.asset("#256").transfer("#13", "#{[:PUT 100 6785687]}");   // OK (complex NFT)
```

---

## Error Handling and Return Types

### One Rule

**All methods throw `ConvexError` on CVM errors.** There is no distinction between "raw" and "convenience" methods — `query()`, `transact()`, `token.balance()`, and `convex.transfer()` all behave the same way.

On success, every method returns `Promise<Result>` (guaranteed no `errorCode`). On CVM error, every method throws `ConvexError` which wraps the full `Result` — the caller can inspect error details, juice consumed, trace, etc.

`ConvexError` covers both CVM-level errors (e.g. `FUNDS`, `STATE`, `NOBODY`) and peer-level errors that occur before CVM execution (e.g. `LOAD` for parse failures, sequence errors). The REST API returns the same `errorCode` / `info` shape for both — the client doesn't need to distinguish.

Network/infrastructure failures (fetch timeout, HTTP 500, no account set) throw standard `Error`.

### ConvexError

Wraps the full `Result` from a failed CVM operation:

```ts
export class ConvexError extends Error {
  constructor(public readonly result: Result) {
    super(`CVM error: ${result.errorCode}`);
  }

  /** Error code shortcut (e.g. "FUNDS", "NOBODY", "STATE") */
  get code(): string | undefined { return this.result.errorCode; }

  /** Execution info shortcut (juice, fees, trace, etc.) */
  get info(): ResultInfo | undefined { return this.result.info; }
}
```

Convenience accessors for the common fields, full `Result` for everything else:

```ts
try {
  await token.transfer("#13", 100);
} catch (e) {
  if (e instanceof ConvexError) {
    e.code              // "FUNDS" (shortcut)
    e.info?.juice       // juice consumed before failure (shortcut)
    e.info?.fees        // fees burned (shortcut)
    e.info?.trace       // stack trace (shortcut)
    e.result.errorCode  // "FUNDS" (full access)
    e.result.result     // CVM printed error value (full access)
  }
}
```

### Return Types on Handles

All handle methods return `Promise<Result>` on success. The `Result` is guaranteed to have no `errorCode`.

For **query** methods, the interesting field is `result.value` (the data):

```ts
const r = await token.balance();
console.log(r.value);   // 1000000 (number for fungible, array for NFT)
console.log(r.result);  // "1000000" (CVM printed form)
```

For **transaction** methods, the interesting fields are the metadata:

```ts
const r = await token.transfer("#13", 100);
console.log(r.value);       // return value of the transaction
console.log(r.info?.tx);    // transaction hash
console.log(r.info?.juice); // juice consumed
console.log(r.info?.fees);  // fees paid
```

### Summary

```
                             CVM success    CVM error
                             ───────────    ─────────
convex.query(source)         Result         throws ConvexError
convex.transact(source)      Result         throws ConvexError
convex.balance()             Result         throws ConvexError
convex.transfer()            Result         throws ConvexError
token.balance()              Result         throws ConvexError
token.transfer()             Result         throws ConvexError
cns.resolve()                Result         throws ConvexError
```

Uniform behaviour everywhere. For exploratory use where CVM errors are expected, use try/catch:

```ts
try {
  await convex.query('(/ 1 0)');
} catch (e) {
  if (e instanceof ConvexError) {
    console.log(e.code);          // "ARITHMETIC"
    console.log(e.result.info);   // juice, trace, etc.
  }
}
```

---

## API Design

### 1. `convex.fungible(token)` — Fungible Token Handle

Wraps `@convex.fungible/*` functions for CAD29 fungible tokens.

```ts
const token = convex.fungible("#128");
```

#### Methods

| Method | Returns | CVM | Type |
|--------|---------|-----|------|
| `balance(holder?)` | `Promise<Result>` | `(@convex.fungible/balance #128 ...)` | query |
| `transfer(to, amount)` | `Promise<Result>` | `(@convex.fungible/transfer #128 #13 100)` | transact |
| `mint(amount)` | `Promise<Result>` | `(@convex.fungible/mint #128 100)` | transact |
| `burn(amount)` | `Promise<Result>` | `(@convex.fungible/burn #128 100)` | transact |
| `supply()` | `Promise<Result>` | `(@convex.fungible/total-supply #128)` | query |
| `decimals()` | `Promise<Result>` | `(@convex.fungible/decimals #128)` | query |

All methods throw `ConvexError` on CVM error. On success, return `Result` (no `errorCode`).

#### Behaviour

- `balance()` with no argument queries the client's own address (substitutes `*address*` in CVM source, which the CVM resolves to the caller).
- `balance(holder)` queries a specific address.
- `transfer`, `mint`, `burn` require the client to have an account and signer set.

#### Example

```ts
const convex = new Convex("https://peer.convex.live");
convex.setAccount(myAddress, myKeyPair);

const gold = convex.fungible("#128");

// Check balance — throws on error, .value is the data
const bal = await gold.balance();
console.log(bal.value); // 1000000

// Transfer — throws on error, .info has tx metadata
const tx = await gold.transfer("#13", 500);
console.log(tx.info?.tx); // transaction hash

// Check supply
const sup = await gold.supply();
console.log(sup.value); // 1000000000
```

---

### 2. `convex.asset(token)` — Generic Asset Handle

Wraps `@convex.asset/*` functions. Works with **any** asset type (fungible tokens, NFTs, multi-tokens, etc.) through the generic asset interface.

```ts
const asset = convex.asset("#128");
```

#### Methods

| Method | Returns | CVM | Type |
|--------|---------|-----|------|
| `balance(holder?)` | `Promise<Result>` | `(@convex.asset/balance #128 ...)` | query |
| `transfer(to, quantity)` | `Promise<Result>` | `(@convex.asset/transfer #13 #128 100)` | transact |
| `offer(to, quantity)` | `Promise<Result>` | `(@convex.asset/offer #13 #128 100)` | transact |
| `accept(from, quantity)` | `Promise<Result>` | `(@convex.asset/accept #13 #128 100)` | transact |
| `supply()` | `Promise<Result>` | `(@convex.asset/total-supply #128)` | query |
| `owns(quantity, holder?)` | `Promise<Result>` | `(@convex.asset/owns? ...)` | query |
| `mint(quantity)` | `Promise<Result>` | `(@convex.asset/mint #128 100)` | transact |
| `burn(quantity)` | `Promise<Result>` | `(@convex.asset/burn #128 100)` | transact |

All `quantity` parameters accept `AssetQuantity` (`number | number[]`). For fungible tokens pass a number (`100`). For NFTs pass an array of IDs (`[1, 3, 7]`) which is formatted as CVM set `#{1 3 7}`.

#### Note on Argument Order

The CVM `convex.asset` and `convex.fungible` libraries use **different argument orders**:

```lisp
;; convex.asset: receiver first, then [path quantity]
(@convex.asset/transfer #13 #128 100)

;; convex.fungible: token first, then target, then amount
(@convex.fungible/transfer #128 #13 100)
```

The TypeScript handles normalise this — both present the same user-facing signature: `handle.transfer(to, amount)`. The handle knows which CVM argument order to use.

---

### 3. Relationship: FungibleToken extends AssetHandle

`FungibleToken` IS-A `AssetHandle` — a fungible token is an asset. The class hierarchy mirrors the CVM library hierarchy:

```
AssetHandle                         @convex.asset/*
  └── FungibleToken                 @convex.fungible/*
```

`FungibleToken` **overrides** the base asset methods with `@convex.fungible/*` calls, which are more efficient for fungible tokens (direct dispatch rather than generic asset resolution). It also **adds** fungible-specific methods (`mint`, `burn`, `supply`, `decimals`).

```ts
// Both work — FungibleToken is a subtype of AssetHandle
function showBalance(asset: AssetHandle) {
  return asset.balance();
}

showBalance(convex.asset("#128"));     // uses @convex.asset/balance
showBalance(convex.fungible("#128"));  // uses @convex.fungible/balance (faster)
```

If you know an address is a fungible token, prefer `convex.fungible()`. If you don't know the asset type, use `convex.asset()`.

---

### 4. `convex.cns(name)` — CNS Handle

Wraps `@convex.cns/*` functions for the Convex Name System.

```ts
const entry = convex.cns("user.mike");
```

The `name` parameter is a **dotted path** without the `@` prefix — just the name portion.

#### Methods

| Method | Returns | CVM | Type |
|--------|---------|-----|------|
| `resolve()` | `Promise<Result>` | `(@convex.cns/get-path 'user.mike)` | query |
| `set(value)` | `Promise<Result>` | `(@convex.cns/set-path 'user.mike ...)` | transact |
| `setController(ctrl)` | `Promise<Result>` | `(@convex.cns/set-controller ...)` | transact |

#### Example

```ts
// Resolve a CNS name
const entry = convex.cns("convex.core");
const result = await entry.resolve();
console.log(result.result); // "#8"

// Register a name (requires permission)
convex.setAccount(myAddr, myKeyPair);
const myEntry = convex.cns("user.mike");
await myEntry.set("#1678");
```

#### Note

For simple resolution, `convex.query("@convex.core")` already works — the CVM resolves `@name` expressions natively. The `cns()` handle is for programmatic CNS management (set, update, controller changes).

---

## Implementation

### Class Structure

```
src/
├── convex.ts           # Convex class + factory methods
├── AssetHandle.ts      # Generic asset handle
├── FungibleToken.ts    # Fungible token handle (extends AssetHandle)
├── CnsHandle.ts        # CNS handle
└── types.ts            # Shared types
```

### Factory Methods on Convex

```ts
class Convex {
  // ... existing methods ...

  /** Create a generic asset handle */
  asset(token: AddressLike): AssetHandle {
    return new AssetHandle(this, token);
  }

  /** Create a fungible token handle (CAD29) */
  fungible(token: AddressLike): FungibleToken {
    return new FungibleToken(this, token);
  }

  /** Create a CNS handle */
  cns(name: string): CnsHandle {
    return new CnsHandle(this, name);
  }
}
```

### Internal Access

Handles need to call `client.query()` and `client.transact()`, which are public methods — no special access needed. The `toAddress()` helper is module-internal to `convex.ts` and will need to be shared (either exported or moved to a utils module).

### Error Checking Helper

All methods use a shared helper to check results and throw:

```ts
/** Throw ConvexError if result has an errorCode, otherwise return the result */
function throwIfError(result: Result): Result {
  if (result.errorCode) {
    throw new ConvexError(result);
  }
  return result;
}
```

Applied in `query()` and `transact()` before returning, so all callers get consistent behaviour:

```ts
// In Convex class — all inputs validated, no (query) needed:
async balance(holder?: AddressLike): Promise<Result> {
  const source = holder != null
    ? `(balance ${toAddress(holder)})`
    : '*balance*';
  return throwIfError(await this.query(source));
}

async transfer(to: AddressLike, amount: BalanceLike): Promise<Result> {
  return throwIfError(await this.transact(
    `(transfer ${toAddress(to)} ${formatBalance(amount)})`
  ));
}

// In FungibleToken — all inputs validated, no (query) needed:
async balance(holder?: AddressLike): Promise<Result> {
  const addr = holder != null ? toAddress(holder) : '*address*';
  return throwIfError(await this.client.query(
    `(@convex.fungible/balance ${toAddress(this.token)} ${addr})`
  ));
}

// In AssetHandle — raw quantity in transaction, sandbox with (query):
async transfer(to: AddressLike, quantity: number | bigint | string): Promise<Result> {
  const q = typeof quantity === 'string'
    ? `(query ${quantity})`    // sandbox unvalidated CVM source
    : formatQuantity(quantity); // number/bigint are safe
  return throwIfError(await this.client.transact(
    `(@convex.asset/transfer ${toAddress(to)} ${toAddress(this.token)} ${q})`
  ));
}
```

### Quantity and Balance Formatting

```ts
/** Validated integer amount for fungible tokens and native coins */
type BalanceLike = number | bigint | string;

/** Format and validate a BalanceLike for CVM source */
function formatBalance(b: BalanceLike): string {
  if (typeof b === 'bigint') {
    if (b < 0n) throw new Error(`Negative amount: ${b}`);
    return b.toString();
  }
  if (typeof b === 'number') {
    if (!Number.isInteger(b) || b < 0) throw new Error(`Invalid amount: ${b}`);
    return String(b);
  }
  if (!/^\d+$/.test(b)) throw new Error(`Invalid amount: "${b}"`);
  return b;
}

/** Format a generic asset quantity for CVM source.
 *  number/bigint → integer string; string → verbatim CVM source */
function formatQuantity(q: number | bigint | string): string {
  if (typeof q === 'string') return q;  // raw CVM source, no validation
  if (typeof q === 'bigint') return q.toString();
  return String(q);
}
```

### AssetHandle (sketch)

```ts
export class AssetHandle {
  constructor(
    protected readonly client: Convex,
    protected readonly token: AddressLike,
  ) {}

  /** Get the token address this handle is bound to */
  getToken(): AddressLike {
    return this.token;
  }

  async balance(holder?: AddressLike): Promise<Result> {
    const addr = holder != null ? toAddress(holder) : '*address*';
    return throwIfError(await this.client.query(
      `(@convex.asset/balance ${toAddress(this.token)} ${addr})`
    ));
  }

  /** Format quantity, sandboxing raw strings with (query ...) */
  private fmtQ(quantity: number | bigint | string): string {
    if (typeof quantity === 'string') return `(query ${quantity})`;
    return formatQuantity(quantity);
  }

  async transfer(to: AddressLike, quantity: number | bigint | string): Promise<Result> {
    return throwIfError(await this.client.transact(
      `(@convex.asset/transfer ${toAddress(to)} ${toAddress(this.token)} ${this.fmtQ(quantity)})`
    ));
  }

  async offer(to: AddressLike, quantity: number | bigint | string): Promise<Result> {
    return throwIfError(await this.client.transact(
      `(@convex.asset/offer ${toAddress(to)} ${toAddress(this.token)} ${this.fmtQ(quantity)})`
    ));
  }

  async accept(from: AddressLike, quantity: number | bigint | string): Promise<Result> {
    return throwIfError(await this.client.transact(
      `(@convex.asset/accept ${toAddress(from)} ${toAddress(this.token)} ${this.fmtQ(quantity)})`
    ));
  }

  async supply(): Promise<Result> {
    return throwIfError(await this.client.query(
      `(@convex.asset/total-supply ${toAddress(this.token)})`
    ));
  }
}
```

### FungibleToken (sketch)

```ts
export class FungibleToken extends AssetHandle {
  async balance(holder?: AddressLike): Promise<Result> {
    const addr = holder != null ? toAddress(holder) : '*address*';
    return throwIfError(await this.client.query(
      `(@convex.fungible/balance ${toAddress(this.token)} ${addr})`
    ));
  }

  async transfer(to: AddressLike, amount: BalanceLike): Promise<Result> {
    return throwIfError(await this.client.transact(
      `(@convex.fungible/transfer ${toAddress(this.token)} ${toAddress(to)} ${formatBalance(amount)})`
    ));
  }

  async mint(amount: BalanceLike): Promise<Result> {
    return throwIfError(await this.client.transact(
      `(@convex.fungible/mint ${toAddress(this.token)} ${formatBalance(amount)})`
    ));
  }

  async burn(amount: BalanceLike): Promise<Result> {
    return throwIfError(await this.client.transact(
      `(@convex.fungible/burn ${toAddress(this.token)} ${formatBalance(amount)})`
    ));
  }

  async supply(): Promise<Result> {
    return throwIfError(await this.client.query(
      `(@convex.fungible/total-supply ${toAddress(this.token)})`
    ));
  }

  async decimals(): Promise<Result> {
    return throwIfError(await this.client.query(
      `(@convex.fungible/decimals ${toAddress(this.token)})`
    ));
  }
}
```

### CnsHandle (sketch)

```ts
export class CnsHandle {
  constructor(
    private readonly client: Convex,
    private readonly name: string,
  ) {
    // Validate CNS name format at construction time
    if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(name)) {
      throw new Error(`Invalid CNS name: "${name}"`);
    }
  }

  async resolve(): Promise<Result> {
    return throwIfError(await this.client.query(
      `(@convex.cns/get-path '${this.name})`
    ));
  }

  async set(value: string): Promise<Result> {
    return throwIfError(await this.client.transact(
      `(@convex.cns/set-path '${this.name} ${value})`
    ));
  }

  async setController(controller: AddressLike): Promise<Result> {
    return throwIfError(await this.client.transact(
      `(@convex.cns/set-controller '${this.name} ${toAddress(controller)})`
    ));
  }
}
```

---

## Exports

All handles and their types are exported from `index.ts`:

```ts
export { AssetHandle } from './AssetHandle.js';
export { FungibleToken } from './FungibleToken.js';
export { CnsHandle } from './CnsHandle.js';
```

Users typically access handles via `convex.fungible()` etc., but direct import is available for typing:

```ts
import type { FungibleToken } from '@convex-world/convex-ts';

function transferGold(token: FungibleToken, to: string, amount: number) {
  return token.transfer(to, amount);
}
```

---

## Testing Strategy

### Unit Tests (mocked fetch)

Each handle gets a test file that mocks `fetch` and verifies:
1. Correct CVM source string is generated
2. Correct HTTP method (POST for both query and transact)
3. Correct endpoint (`/api/v1/query` vs `/api/v1/transaction/prepare`)
4. Result is passed through unchanged

### Integration Tests (live peer)

Test against `https://peer.convex.live`:
- `convex.fungible("#128").balance("#13")` — if token #128 exists
- `convex.cns("convex.core").resolve()` — should return `#8`
- `convex.asset("#128").balance("#13")` — generic path for same token

---

## Future Considerations

### NFT Handles

A future `convex.nft(addr)` could extend `AssetHandle` for non-fungible tokens, where quantities are sets of IDs rather than numbers:

```ts
const nft = convex.nft("#256");
await nft.balance();         // returns set of owned IDs
await nft.transfer("#13", #{1, 2, 3});  // transfer specific IDs
await nft.create(metadata);  // mint new NFT
```

This requires deciding how to represent CVM sets in TypeScript.

### Batch Operations

A `batch()` helper could combine multiple handle calls into a single transaction using the `let` binding form:

```ts
await convex.batch(
  gold.transfer("#13", 100),
  silver.transfer("#13", 50),
);
// Generates:
// (let [fun @convex.fungible]
//   (fun/transfer #128 #13 100)
//   (fun/transfer #256 #13 50))
```

### Subscriptions

WebSocket-based subscriptions for watching balance changes, token events, etc. Depends on peer WebSocket API support.
