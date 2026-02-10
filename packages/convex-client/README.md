# @convex-world/convex-ts

[![npm version](https://img.shields.io/npm/v/@convex-world/convex-ts.svg)](https://www.npmjs.com/package/@convex-world/convex-ts)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/Convex-Dev/convex.ts/blob/master/LICENSE)

Official TypeScript/JavaScript client library for the [Convex](https://convex.world) decentralized lattice network.

## Installation

```bash
npm install @convex-world/convex-ts
# or
yarn add @convex-world/convex-ts
# or
pnpm add @convex-world/convex-ts
```

## Quick Start

```typescript
import { Convex } from '@convex-world/convex-ts';

// Connect to a Convex peer
const convex = new Convex('https://convex.world');

// Create a new account
const account = await convex.createAccount(10000000);
console.log('Account address:', account.address);

// Get account info
const info = await convex.getAccountInfo();
console.log('Balance:', info.balance);

// Submit a transaction
const result = await convex.submitTransaction({
  to: '#123',
  amount: 1000000
});
console.log('Transaction hash:', result.hash);

// Query network state
const queryResult = await convex.query({
  source: '(balance *address*)'
});
```

## Features

- 🔐 **Account Management** - Create and manage Convex accounts
- 🔑 **Cryptography** - Ed25519 key pair generation and signing
- 💸 **Transactions** - Submit and track transactions
- 🔍 **Queries** - Query network state
- 🎨 **Identicons** - Generate visual identicons for addresses
- 💾 **Key Storage** - Secure keystore functionality
- 📘 **TypeScript** - Full type definitions included
- 🌐 **ESM** - Modern ES module support

## API Reference

### `Convex` Class

#### `new Convex(peerUrl: string, options?: ClientOptions)`

Create a new Convex client instance.

```typescript
const convex = new Convex('https://convex.world', {
  timeout: 30000  // Optional: request timeout in ms
});
```

#### `createAccount(initialBalance?: number): Promise<AccountInfo>`

Create a new account with optional initial balance.

```typescript
const account = await convex.createAccount(10000000);
```

#### `getAccountInfo(): Promise<AccountInfo>`

Get current account information.

```typescript
const info = await convex.getAccountInfo();
console.log(info.balance, info.sequence);
```

#### `submitTransaction(tx: Transaction): Promise<TransactionResult>`

Submit a signed transaction.

```typescript
const result = await convex.submitTransaction({
  to: '#123',
  amount: 1000000,
  data: { memo: 'Payment' }
});
```

#### `query(query: Query): Promise<Result>`

Execute a query on the network.

```typescript
const result = await convex.query({
  source: '(balance *address*)'
});
```

#### `getKeyPair(): KeyPair`

Get the current key pair.

```typescript
const keyPair = convex.getKeyPair();
```

### Cryptography Functions

```typescript
import { generateKeyPair, sign, verify } from '@convex-world/convex-ts';

// Generate key pair
const keyPair = await generateKeyPair();

// Sign message
const signature = await sign('Hello', keyPair.privateKey);

// Verify signature
const isValid = await verify(signature, 'Hello', keyPair.publicKey);
```

### Keystore

```typescript
import { Keystore } from '@convex-world/convex-ts';

// Create keystore
const keystore = await Keystore.create('password');

// Save to file
await keystore.save('./keystore.json');

// Load from file
const loaded = await Keystore.load('./keystore.json', 'password');
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import type {
  ClientOptions,
  KeyPair,
  AccountInfo,
  Transaction,
  TransactionResult,
  Query,
  Result
} from '@convex-world/convex-ts';
```

## Error Handling

```typescript
try {
  await convex.createAccount();
} catch (error) {
  console.error('Convex API Error:', error.message);
}
```

## Examples

### Complete Example

```typescript
import { Convex } from '@convex-world/convex-ts';

async function main() {
  // Connect to peer
  const convex = new Convex('https://convex.world');

  // Create account
  const account = await convex.createAccount(10000000);
  console.log('Created account:', account.address);

  // Check balance
  const info = await convex.getAccountInfo();
  console.log('Balance:', info.balance);

  // Submit transaction
  const result = await convex.submitTransaction({
    to: '#456',
    amount: 1000
  });

  if (result.status === 'success') {
    console.log('Transaction successful:', result.hash);
  }
}

main().catch(console.error);
```

## Links

- **Documentation:** https://docs.convex.world
- **GitHub:** https://github.com/Convex-Dev/convex.ts
- **Discord:** https://discord.com/invite/xfYGq4CT7v
- **Website:** https://convex.world

## License

Apache-2.0 - see [LICENSE](https://github.com/Convex-Dev/convex.ts/blob/master/LICENSE) for details.

## Contributing

Contributions are welcome! See the [main repository](https://github.com/Convex-Dev/convex.ts) for development guidelines.

---

Built with ❤️ by the [Convex Foundation](https://convex.world)
