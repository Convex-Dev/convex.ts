# Type Export Organization

This document describes the type organization and export strategy for `@convex-world/convex-ts`.

## Design Principles

1. **Single Source of Truth** - Each type is defined in exactly one location
2. **Centralized Types** - Public types live in `types.ts` for discoverability
3. **No Duplicates** - Avoid duplicate type definitions across files
4. **Clear Re-exports** - Use re-exports for convenience, not duplication

## Type Definitions

### types.ts (Central Type Repository)

All public types are defined or re-exported from `types.ts`:

```typescript
// Configuration
export interface ClientOptions { ... }

// Primitive types
export type Address = Uint8Array;
export type Hex = Uint8Array | string;

// Key pair types
export interface IKeyPair { ... }              // Legacy interface
export type { KeyPair } from './KeyPair.js';   // Modern class (re-exported)

// Convex API types
export interface AccountInfo { ... }
export interface Transaction { ... }
export interface TransactionResult { ... }
export interface Query { ... }
export interface Result { ... }
```

### KeyPair.ts (KeyPair Class Implementation)

Defines the `KeyPair` class and imports types from `types.ts`:

```typescript
import type { Hex } from './types.js';

export class KeyPair {
  // Implementation uses Hex type from types.ts
}
```

**Note:** `KeyPair.ts` does NOT re-define `Hex` or `IKeyPair`. It imports `Hex` from `types.ts`.

### crypto.ts (Cryptographic Functions)

Imports types from `types.ts`:

```typescript
import { type IKeyPair, type Hex } from './types.js';

export function sign(message: Hex, privateKey: Uint8Array): Promise<Bytes>;
export function verify(message: Hex, signature: Hex, publicKey: Hex): Promise<boolean>;
```

### keystore.ts (Key Storage)

Imports `KeyPair` class directly:

```typescript
import { KeyPair } from './KeyPair.js';

export abstract class KeyStore {
  abstract getKeyPair(alias: string, password: string): Promise<KeyPair | null>;
}
```

### index.ts (Public API)

Main entry point that exports everything users need:

```typescript
export { Convex } from './convex.js';           // Main class
export { KeyPair } from './KeyPair.js';         // KeyPair class
export * from './types.js';                     // All types (includes Hex, IKeyPair, KeyPair type)
export * from './crypto.js';                    // Crypto utilities
export * from './identicon.js';                 // Identicon generation
export * from './keystore.js';                  // Key storage
```

## Import Patterns

### For Users (External)

Users import from the package root:

```typescript
import {
  Convex,           // Main class
  KeyPair,          // KeyPair class
  type Hex,         // Type for bytes or hex strings
  type IKeyPair,    // Legacy interface
  type AccountInfo, // Account type
  // ... other types
} from '@convex-world/convex-ts';
```

### For Developers (Internal)

Within the codebase:

```typescript
// Import types from types.ts
import type { Hex, IKeyPair } from './types.js';

// Import KeyPair class from KeyPair.ts
import { KeyPair } from './KeyPair.js';

// Import crypto functions from crypto.ts
import { sign, verify, hexToBytes, bytesToHex } from './crypto.js';
```

## Type Hierarchy

```
types.ts (source of truth)
  ├─ Hex (type) ────────────────┐
  ├─ IKeyPair (interface) ──────┼─── Used by crypto.ts
  └─ KeyPair (re-export) ───────┘
                                 │
KeyPair.ts                       │
  └─ KeyPair (class) ─────────── imports Hex from types.ts
                                 │
crypto.ts                        │
  ├─ sign() ────────────────────┘
  ├─ verify()
  └─ hexToBytes()
```

## Validation

To verify type consistency, run:

```bash
pnpm build  # TypeScript compilation catches inconsistencies
```

All types should have a single canonical definition with clear import paths.
