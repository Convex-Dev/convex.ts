# @convex-world/convex-ts

[![npm version](https://img.shields.io/npm/v/@convex-world/convex-ts.svg)](https://www.npmjs.com/package/@convex-world/convex-ts)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/Convex-Dev/convex.ts/blob/master/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

> Official TypeScript/JavaScript client for the [Convex](https://convex.world) decentralized lattice network.

**Convex** is building fair, inclusive, efficient, and sustainable economic systems based on decentralized technology for the 21st century. Convex is a deterministic economic system shared by humans and autonomous agents, where both participate under the same rules, the same physics, and the same finality.

📚 **[Full Documentation](https://docs.convex.world)** | 🌐 **[Website](https://convex.world)** | 💬 **[Discord Community](https://discord.com/invite/xfYGq4CT7v)**

---

## ⚡ Quick Start

### Installation

```bash
npm install @convex-world/convex-ts
```

### Your First Convex Application

```typescript
import { Convex } from '@convex-world/convex-ts';

// Connect to the Convex network
const convex = new Convex('https://convex.world');

// Create a new account with initial balance
const account = await convex.createAccount(10_000_000);
console.log('New account address:', account.address);
console.log('Initial balance:', account.balance, 'copper coins');

// Query your balance
const info = await convex.getAccountInfo();
console.log('Current balance:', info.balance);

// Submit a transaction
const result = await convex.submitTransaction({
  to: '#123',
  amount: 1_000_000,
  data: { memo: 'My first transaction!' }
});

console.log('Transaction completed:', result.hash);
```

## 🎯 What is Convex?

[Convex](https://convex.world) is a decentralized lattice network that provides:

- **Deterministic Execution** - Same input, same output, every time
- **Lattice Technology** - Advanced data structures that enable true decentralization
- **Convergent Proof of Stake** - Fair and efficient consensus mechanism
- **Self-Sovereign Accounts** - You control your own digital identity and assets
- **Convex Lisp** - Powerful smart contract language based on lambda calculus

Learn more in the [Convex Documentation](https://docs.convex.world).

## ✨ Features

- 🔐 **Account Management** - Create and manage self-sovereign accounts
- 🔑 **Ed25519 Cryptography** - Industry-standard key generation and signing
- 💸 **Transactions** - Submit and track transactions with full type safety
- 🔍 **Network Queries** - Execute Convex Lisp queries on network state
- 🎨 **Identicons** - Generate unique visual identifiers for addresses
- 💾 **Secure Keystore** - Encrypted key storage and management
- 📘 **Full TypeScript Support** - Complete type definitions included
- 🌐 **Modern ESM** - ES module support for modern JavaScript
- 🧪 **Production Ready** - Battle-tested and used in production applications

## 📖 Complete API Reference

### Connecting to the Network

```typescript
import { Convex } from '@convex-world/convex-ts';

// Connect to production network
const convex = new Convex('https://convex.world');

// Connect with custom options
const convex = new Convex('https://convex.world', {
  timeout: 30000,  // Request timeout in milliseconds
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

### Account Management

#### Creating an Account

```typescript
// Create account with initial balance (in copper coins)
// 1 Convex Coin = 1,000,000 copper coins
const account = await convex.createAccount(10_000_000);

console.log('Address:', account.address);      // e.g., "#1337"
console.log('Balance:', account.balance);      // 10000000
console.log('Sequence:', account.sequence);    // 0
console.log('Public Key:', account.publicKey); // hex string
```

#### Getting Account Information

```typescript
const info = await convex.getAccountInfo();

console.log('Current balance:', info.balance);
console.log('Transaction sequence:', info.sequence);
```

#### Accessing Your Keys

```typescript
const keyPair = convex.getKeyPair();

console.log('Public key:', Buffer.from(keyPair.publicKey).toString('hex'));
// Private key is also available but should be kept secure!
```

### Transactions

#### Submitting a Transaction

```typescript
const result = await convex.submitTransaction({
  to: '#456',              // Destination address
  amount: 1_000_000,       // Amount in copper coins
  sequence: 1,             // Optional: transaction sequence number
  data: {                  // Optional: additional data
    memo: 'Payment for services',
    invoice: 'INV-001'
  }
});

if (result.status === 'success') {
  console.log('Transaction hash:', result.hash);
  console.log('Result:', result.result);
} else {
  console.error('Transaction failed:', result.error);
}
```

### Queries

Execute Convex Lisp queries to read network state:

```typescript
// Query your own balance
const balance = await convex.query({
  source: '(balance *address*)'
});

// Query another account's balance
const otherBalance = await convex.query({
  address: '#123',
  source: '(balance #123)'
});

// More complex queries
const result = await convex.query({
  source: '(map inc [1 2 3 4 5])'  // Returns [2 3 4 5 6]
});

console.log('Query result:', result.value);
```

Learn more about Convex Lisp in the [documentation](https://docs.convex.world).

### Cryptography

#### Key Pair Generation

```typescript
import { generateKeyPair } from '@convex-world/convex-ts';

const keyPair = await generateKeyPair();

console.log('Public key:', Buffer.from(keyPair.publicKey).toString('hex'));
console.log('Private key:', Buffer.from(keyPair.privateKey).toString('hex'));
```

#### Signing and Verification

```typescript
import { sign, verify } from '@convex-world/convex-ts';

const message = 'Hello, Convex!';

// Sign a message
const signature = await sign(message, keyPair.privateKey);

// Verify the signature
const isValid = await verify(signature, message, keyPair.publicKey);
console.log('Signature valid:', isValid);  // true
```

### Keystore Management

Securely store and manage your cryptographic keys:

```typescript
import { Keystore } from '@convex-world/convex-ts';

// Create a new encrypted keystore
const keystore = await Keystore.create('my-secure-password');

// Save to file
await keystore.save('./my-keystore.json');

// Load from file
const loaded = await Keystore.load('./my-keystore.json', 'my-secure-password');

// Export as JSON string
const json = await keystore.export('my-secure-password');

// Import from JSON string
const imported = await Keystore.import(json, 'my-secure-password');
```

### Identicons

Generate unique visual identifiers for addresses:

```typescript
import { generateIdenticonGrid } from '@convex-world/convex-ts';

const address = Buffer.from('1234567890abcdef', 'hex');
const grid = generateIdenticonGrid(address, 7);  // 7x7 grid

// Use the grid to render an identicon in your UI
// Each element is an RGB color value
```

## 🔧 TypeScript Support

This library is written in TypeScript and includes complete type definitions:

```typescript
import type {
  ClientOptions,
  KeyPair,
  AccountInfo,
  Transaction,
  TransactionResult,
  Query,
  Result,
  Address
} from '@convex-world/convex-ts';

// Type-safe development
const tx: Transaction = {
  to: '#123',
  amount: 1000000
};

const handleResult = (result: TransactionResult) => {
  if (result.status === 'success') {
    // TypeScript knows result.hash exists here
    console.log(result.hash);
  } else {
    // TypeScript knows result.error exists here
    console.error(result.error);
  }
};
```

## 🛡️ Error Handling

All API methods can throw errors. Always wrap in try-catch:

```typescript
try {
  const account = await convex.createAccount(10_000_000);
  console.log('Account created:', account.address);
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to create account:', error.message);
  }
}
```

Common error scenarios:
- Network connectivity issues
- Invalid addresses or amounts
- Insufficient balance
- Invalid signatures
- Peer unavailable

## 📝 Examples

### Complete Application

```typescript
import { Convex, generateKeyPair } from '@convex-world/convex-ts';

async function transferFunds() {
  // Connect to network
  const convex = new Convex('https://convex.world');

  try {
    // Create account with 10 Convex Coins
    const account = await convex.createAccount(10_000_000);
    console.log('✅ Account created:', account.address);
    console.log('   Balance:', account.balance / 1_000_000, 'Convex Coins');

    // Wait a moment for network propagation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Transfer 1 Convex Coin to another address
    const result = await convex.submitTransaction({
      to: '#456',
      amount: 1_000_000,
      data: { memo: 'Transfer example' }
    });

    if (result.status === 'success') {
      console.log('✅ Transaction successful!');
      console.log('   Hash:', result.hash);

      // Check new balance
      const info = await convex.getAccountInfo();
      console.log('   New balance:', info.balance / 1_000_000, 'Convex Coins');
    } else {
      console.error('❌ Transaction failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

transferFunds();
```

### Using with React

```typescript
import { useState, useEffect } from 'react';
import { Convex } from '@convex-world/convex-ts';

function ConvexWallet() {
  const [convex] = useState(() => new Convex('https://convex.world'));
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    async function loadAccount() {
      try {
        const account = await convex.createAccount(10_000_000);
        const info = await convex.getAccountInfo();
        setBalance(info.balance);
      } catch (error) {
        console.error('Failed to load account:', error);
      }
    }
    loadAccount();
  }, [convex]);

  return (
    <div>
      <h1>My Convex Wallet</h1>
      {balance !== null ? (
        <p>Balance: {(balance / 1_000_000).toFixed(2)} Convex Coins</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
```

## 🔗 Resources

- **📚 Documentation** - [docs.convex.world](https://docs.convex.world)
- **🌐 Website** - [convex.world](https://convex.world)
- **💬 Discord Community** - [Join our Discord](https://discord.com/invite/xfYGq4CT7v)
- **🐙 GitHub** - [Convex-Dev/convex.ts](https://github.com/Convex-Dev/convex.ts)
- **📦 npm Package** - [@convex-world/convex-ts](https://www.npmjs.com/package/@convex-world/convex-ts)

## 🤝 Contributing

We welcome contributions! Please see the [main repository](https://github.com/Convex-Dev/convex.ts) for:

- Development guidelines
- Code of conduct
- How to submit pull requests
- Issue reporting

## 📄 License

Apache-2.0 License - see [LICENSE](https://github.com/Convex-Dev/convex.ts/blob/master/LICENSE) for details.

## 🙏 Acknowledgments

Built with ❤️ by the [Convex Foundation](https://convex.world) and the open-source community.

Special thanks to all [contributors](https://github.com/Convex-Dev/convex.ts/graphs/contributors) who have helped make this library better!

---

**Ready to build on Convex?** Start with our [Getting Started Guide](https://docs.convex.world/getting-started) or join our [Discord](https://discord.com/invite/xfYGq4CT7v) to connect with the community! 🚀
