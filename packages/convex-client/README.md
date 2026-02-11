# @convex-world/convex-ts

[![npm version](https://img.shields.io/npm/v/@convex-world/convex-ts.svg)](https://www.npmjs.com/package/@convex-world/convex-ts)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/Convex-Dev/convex.ts/blob/master/LICENSE)

Official TypeScript/JavaScript client for the [Convex](https://convex.world) decentralised lattice network.

**[Documentation](https://docs.convex.world)** | **[Website](https://convex.world)** | **[Discord](https://discord.com/invite/xfYGq4CT7v)**

## Quick Start

### Installation

```bash
npm install @convex-world/convex-ts
```

### Read-Only Query (No Account Needed)

```typescript
import { Convex } from '@convex-world/convex-ts';

const convex = new Convex('https://peer.convex.live');

// Query an account balance (free, no keys needed)
const result = await convex.query('(balance #9)');
console.log('Balance:', result.value);

// The result field has the CVM printed representation (more precise)
console.log('Result:', result.result);
```

### Using an Existing Account

If you have a Convex account and Ed25519 seed (private key):

```typescript
import { Convex, KeyPair } from '@convex-world/convex-ts';

const convex = new Convex('https://peer.convex.live');

// Create KeyPair from your 32-byte Ed25519 seed (hex string or Uint8Array)
const keyPair = KeyPair.fromSeed('your-64-char-hex-seed...');

// Set your account address and key pair
convex.setAccount('#1678', keyPair);

// Submit a transaction (Convex Lisp code)
const result = await convex.transact('(transfer #456 1000000000)');

if (!result.errorCode) {
  console.log('Success! Result:', result.result);
  console.log('Juice used:', result.info?.juice);
} else {
  console.error('Error:', result.errorCode, result.value);
}
```

### Creating a New Account

```typescript
import { Convex } from '@convex-world/convex-ts';

const convex = new Convex('https://peer.convex.live');

// Creates a new account with a generated key pair
// Optional: request faucet funds (in coppers)
const account = await convex.createAccount(100_000_000);

console.log('Address:', account.address);
console.log('Public key:', account.publicKey);
console.log('Balance:', account.balance);
```

## API Reference

### Connecting to the Network

```typescript
import { Convex } from '@convex-world/convex-ts';

// Connect to production network
const convex = new Convex('https://peer.convex.live');

// With options
const convex = new Convex('https://peer.convex.live', {
  timeout: 30000,
  headers: { 'X-Custom-Header': 'value' }
});

// Change timeout after creation
convex.setTimeout(60000);
```

**Peer URLs:**
- Production: `https://peer.convex.live`
- Local development: `http://localhost:8080` (via Docker)

### Queries (Free, Read-Only)

Queries don't modify state and don't require signing:

```typescript
// Simple expression
const result = await convex.query('(+ 1 2 3)');
// result.value = 6

// Account balance
const balance = await convex.query('(balance #9)');

// With address context
const result = await convex.query({
  address: '#1678',
  source: '*balance*'
});

// Network state
const timestamp = await convex.query('*timestamp*');
const juicePrice = await convex.query('*juice-price*');
```

**Result fields:**
- `value` - JSON-converted CVM value (numbers, strings, booleans map directly)
- `result` - CVM printed representation as a string (more accurate than `value`)
- `errorCode` - Error keyword string (e.g. `"NOBODY"`, `"SYNTAX"`), absent on success
- `info` - Execution metadata (`juice`, `fees`, `mem`, `source`, `trace`)

### Transactions

Transactions modify state and require an account with signing:

```typescript
// Execute Convex Lisp code
const result = await convex.transact('(transfer #456 1000000000)');

// Convenience transfer method
const result = await convex.transfer('#456', 1_000_000_000);

// Deploy code
await convex.transact('(def my-fn (fn [x] (* x 2)))');

// Call a smart contract
await convex.transact('(call #789 (my-fn 42))');
```

Transactions use a two-step prepare/submit flow internally:
1. `POST /api/v1/transaction/prepare` - get a hash for the transaction
2. Sign the hash with Ed25519
3. `POST /api/v1/transaction/submit` - submit with signature

### Account Setup

```typescript
import { KeyPair } from '@convex-world/convex-ts';

// Generate a new random key pair
const keyPair = KeyPair.generate();

// Or derive deterministically from a seed (32 bytes, hex or Uint8Array)
const keyPair = KeyPair.fromSeed('0123456789abcdef...');
const keyPair = KeyPair.fromSeed(new Uint8Array(32));

// Set account: address + key pair
convex.setAccount('#1678', keyPair);

// Or set separately
convex.setSigner(keyPair);
convex.setAddress('#1678');

// Get account info from the network
const info = await convex.getAccountInfo();
console.log('Balance:', info.balance, 'coppers');
console.log('Sequence:', info.sequence);
```

> **Note:** Convex amounts are in coppers. 1 Convex Coin = 10^9 coppers.

### Key Pair

```typescript
import { KeyPair } from '@convex-world/convex-ts';

const keyPair = KeyPair.generate();

// Access keys
console.log('Public key:', keyPair.publicKeyHex);   // hex string
console.log('Public key:', keyPair.publicKey);       // Uint8Array

// Export
const { publicKey, privateKey } = keyPair.toHex();   // both as hex strings
const obj = keyPair.toObject();                       // both as Uint8Array

// String representation (shows public key only, for safety)
console.log(keyPair.toString());
// KeyPair { publicKey: abcd1234ef567890... }
```

### Custom Signers

For hardware wallets, browser extensions, or other signing mechanisms:

```typescript
import { type Signer } from '@convex-world/convex-ts';

class HardwareWalletSigner implements Signer {
  getPublicKey(): Uint8Array {
    return this.cachedPublicKey;
  }

  async sign(message: Uint8Array): Promise<Uint8Array> {
    return await this.wallet.sign(message);
  }

  async signFor(publicKey: Hex, message: Uint8Array): Promise<Uint8Array> {
    return await this.wallet.signWithKey(message, publicKey);
  }
}

convex.setSigner(new HardwareWalletSigner());
convex.setAddress('#1678');
```

### Signing and Verification

```typescript
import { sign, verify, hexToBytes } from '@convex-world/convex-ts';

// Sign raw bytes
const message = new Uint8Array([1, 2, 3]);
const signature = await sign(message, keyPair.privateKey);

// Verify
const valid = await verify(signature, message, keyPair.publicKey);
```

### Encrypted Key Storage (Browser)

Store keys securely in the browser using AES-GCM encryption:

```typescript
import { LocalStorageKeyStore, KeyPair } from '@convex-world/convex-ts';

const keystore = new LocalStorageKeyStore();
const keyPair = KeyPair.generate();

// Store encrypted (requires password)
await keystore.storeKeyPair('my-account', keyPair, 'my-password');

// Retrieve (requires password to decrypt)
const restored = await keystore.getKeyPair('my-account', 'my-password');

// Unlock to session storage (quick access without re-entering password)
await keystore.unlock('my-account', 'my-password');
const unlocked = keystore.getUnlockedKeyPair('my-account');

// Lock (clears from session storage)
keystore.lock('my-account');

// List stored keys
const aliases = await keystore.listAliases();

// Get public key without password
const pubKey = keystore.getPublicKey('my-account');
```

### Identicons

Generate deterministic visual identifiers for addresses:

```typescript
import { generateIdenticonGrid, hexToBytes } from '@convex-world/convex-ts';

const addressBytes = hexToBytes('1234567890abcdef1234567890abcdef');
const grid = generateIdenticonGrid(addressBytes, 7);  // 7x7 grid of RGB values
```

## TypeScript Support

Full type definitions are included:

```typescript
import type {
  ClientOptions,
  AccountInfo,
  Transaction,
  Result,
  TransactionResult,
  ResultInfo,
  Query,
} from '@convex-world/convex-ts';
```

`TransactionResult` is a type alias for `Result` — both queries and transactions return the same JSON structure from the peer API.

## Error Handling

```typescript
try {
  const result = await convex.transact('(transfer #456 1000000000)');

  if (result.errorCode) {
    // CVM-level error (e.g. insufficient funds)
    console.error('CVM error:', result.errorCode, result.value);
  } else {
    console.log('Success:', result.result);
  }
} catch (error) {
  // Network/HTTP error
  console.error('Request failed:', error);
}
```

## Resources

- [Convex Documentation](https://docs.convex.world)
- [Convex Website](https://convex.world)
- [Discord Community](https://discord.com/invite/xfYGq4CT7v)
- [GitHub](https://github.com/Convex-Dev/convex.ts)
- [npm Package](https://www.npmjs.com/package/@convex-world/convex-ts)

## License

Apache-2.0 — see [LICENSE](https://github.com/Convex-Dev/convex.ts/blob/master/LICENSE).
