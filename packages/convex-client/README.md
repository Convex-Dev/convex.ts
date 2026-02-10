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

### Read-Only Query (No Account Needed)

The simplest way to get started is with read-only queries:

```typescript
import { Convex } from '@convex-world/convex-ts';

// Connect to the Convex network
const convex = new Convex('https://peer.convex.live');

// Query an account balance (read-only, no keys needed)
const result = await convex.query('(balance #9)');
console.log('Balance:', result.value);

// Query other network state
const coinSupply = await convex.query('(call *registry* (lookup :CAD001))');
```

### Using Your Existing Account

If you have a Convex account and private key:

```typescript
import { Convex, KeyPair } from '@convex-world/convex-ts';

// Connect to peer
const convex = new Convex('https://peer.convex.live');

// Create KeyPair from your existing keys
const myKeyPair = await KeyPair.fromHex({
  publicKey: 'your-public-key-hex',
  privateKey: 'your-private-key-hex'
});

convex.setAccount('#1678', myKeyPair);

// Now you can transact
const result = await convex.transact({
  to: '#456',
  amount: 1_000_000,  // 1 Convex Coin (amounts are in copper)
  data: { memo: 'Payment' }
});

console.log('Transaction hash:', result.hash);
```

### Loading Keys from Seed

```typescript
import { Convex, KeyPair } from '@convex-world/convex-ts';

// Derive key pair from your Ed25519 seed (32 bytes)
const seed = new Uint8Array([/* your 32-byte seed */]);
const keyPair = KeyPair.fromSeed(seed);

// Or from hex seed
const keyPair = KeyPair.fromSeed('0123456789abcdef...');

// Connect and use your account
const convex = new Convex('https://peer.convex.live');
convex.setAccount('#1678', keyPair);

// Query your balance
const info = await convex.getAccountInfo();
console.log('Balance:', info.balance / 1_000_000, 'Convex Coins');
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

- 🔍 **Read-Only Queries** - Query network state without an account
- 🔐 **Account Management** - Use your existing Convex account
- 🔑 **Ed25519 Cryptography** - Industry-standard key generation and signing
- 💸 **Transactions** - Submit and track transactions with full type safety
- 🎨 **Identicons** - Generate unique visual identifiers for addresses
- 💾 **Secure Keystore** - Encrypted key storage and management
- 📘 **Full TypeScript Support** - Complete type definitions included
- 🌐 **Modern ESM** - ES module support for modern JavaScript
- 🧪 **Production Ready** - Used with live Convex networks

## 📖 Complete API Reference

### Connecting to the Network

```typescript
import { Convex } from '@convex-world/convex-ts';

// Connect to production network
const convex = new Convex('https://peer.convex.live');

// Connect with custom options
const convex = new Convex('https://peer.convex.live', {
  timeout: 30000,  // Request timeout in milliseconds
  headers: {
    'X-Custom-Header': 'value'
  }
});

// Change timeout after creation
convex.setTimeout(60000);  // 60 seconds
```

**Network URLs:**
- Production: `https://peer.convex.live`
- Testnet: `https://testnet.convex.live` (has faucet for testing)
- Local: `http://localhost:8080` (for development)

### Account Setup

#### Using an Existing Account

Most users already have a Convex account. Set it up like this:

```typescript
import { KeyPair } from '@convex-world/convex-ts';

// You need:
// 1. Your account address (e.g., "#1678")
// 2. Your Ed25519 seed (32 bytes)

// From seed hex string (recommended)
const keyPair = KeyPair.fromSeed('your-32-byte-seed-hex');

// Or from seed bytes
const keyPair = KeyPair.fromSeed(
  new Uint8Array([/* 32 seed bytes */])
);

// Note: Public key is automatically derived from seed
convex.setAccount('#1678', keyPair);
```

#### Using Custom Signers

For hardware wallets, browser extensions, or other signing mechanisms:

```typescript
import { type Signer } from '@convex-world/convex-ts';

// Implement custom signer
class HardwareWalletSigner implements Signer {
  async getPublicKey(): Promise<Uint8Array> {
    // Get public key from hardware wallet
    return await this.wallet.getPublicKey();
  }

  async sign(message: Uint8Array): Promise<Uint8Array> {
    // Sign with hardware wallet (may prompt user)
    return await this.wallet.sign(message);
  }

  async signFor(message: Uint8Array, publicKey: Hex): Promise<Uint8Array> {
    // Sign with specific key (for multi-key wallets)
    return await this.wallet.signWithKey(message, publicKey);
  }
}

// Use custom signer
const signer = new HardwareWalletSigner();
convex.setSigner(signer);
convex.setAddress('#1678');
```

#### Reusing Signer for Multiple Addresses

Same signer can sign for multiple accounts:

```typescript
const keyPair = KeyPair.fromSeed(mySeed);
convex.setSigner(keyPair);  // Set signer once

// Use different addresses with same signer
convex.setAddress('#1678');
await convex.transfer('#456', 1_000_000);

convex.setAddress('#9999');  // Switch to different address
await convex.transfer('#456', 500_000);
```

#### Deriving from Seed

If you have an Ed25519 seed (32 bytes):

```typescript
import { KeyPair } from '@convex-world/convex-ts';

// From bytes
const seed = new Uint8Array([/* your 32-byte seed */]);
const keyPair = KeyPair.fromSeed(seed);

// Or from hex string
const keyPair = KeyPair.fromSeed('0123456789abcdef...');

convex.setAccount('#1678', keyPair);
```

#### Getting Account Information

```typescript
const info = await convex.getAccountInfo();

console.log('Address:', info.address);
console.log('Balance:', info.balance / 1_000_000, 'Convex Coins');
console.log('Sequence:', info.sequence);  // Transaction counter
```

> **Note:** Amounts are in "copper coins" where 1 Convex Coin = 1,000,000 copper.

### Queries (Read-Only)

Query network state without needing an account or keys:

```typescript
// Query any account's balance
const balance = await convex.query('(balance #9)');

// Query smart contracts
const registryInfo = await convex.query('(call *registry* (cns-resolve :example.domain))');

// Execute Convex Lisp expressions
const mathResult = await convex.query('(+ 1 2 3)');  // Returns 6

// Query with address context (use object form when needed)
const result = await convex.query({
  address: '#1678',
  source: '*balance*'  // Uses context address
});

console.log('Result:', result.value);
```

Learn more about Convex Lisp in the [documentation](https://docs.convex.world).

### Transactions

Submit transactions to modify network state:

```typescript
const result = await convex.transact({
  to: '#456',              // Destination address
  amount: 1_000_000,       // Amount in copper (1 Convex Coin)
  sequence: undefined,     // Optional: auto-increments
  data: {                  // Optional: additional data
    memo: 'Payment for services',
    invoice: 'INV-001'
  }
});

if (result.status === 'success') {
  console.log('✅ Transaction successful!');
  console.log('   Hash:', result.hash);
  console.log('   Result:', result.result);
} else {
  console.error('❌ Transaction failed:', result.error);
}
```

**Common Transaction Patterns:**

```typescript
// Simple transfer (convenience method)
await convex.transfer('#456', 1_000_000);

// Execute Convex Lisp code
await convex.transact('(transfer #456 1000000)');

// Deploy code
await convex.transact('(def my-function (fn [x] (* x 2)))');

// Call a smart contract
await convex.transact('(call #789 (my-function arg1 arg2))');

// Complex transaction with data
await convex.transact({
  to: '#789',
  amount: 1_000_000,
  data: { memo: 'Payment' }
});
```

#### Transaction Sequence Numbers

```typescript
// Get current sequence number
const seq = await convex.getSequence();
console.log('Next transaction sequence:', seq);

// Explicitly set sequence (rarely needed, auto-managed)
await convex.transact({
  to: '#456',
  amount: 1_000_000,
  sequence: seq
});
```

### Cryptography

#### Key Pair Generation

```typescript
import { KeyPair } from '@convex-world/convex-ts';

// Generate random key pair
const keyPair = KeyPair.generate();

// Access keys as hex strings (convenient)
console.log('Public key:', keyPair.publicKeyHex);
console.log('Private key:', keyPair.privateKeyHex);

// Access keys as Uint8Array
console.log('Public key bytes:', keyPair.publicKey);
console.log('Private key bytes:', keyPair.privateKey);

// Generate from seed (deterministic)
const seed = new Uint8Array(32);  // Your seed bytes
const keyPair = KeyPair.fromSeed(seed);

// Or from hex seed
const keyPair = KeyPair.fromSeed('0123456789abcdef...');

// Import from hex strings
const keyPair = await KeyPair.fromHex({
  publicKey: 'abcd1234...',
  privateKey: '5678ef90...'
});

// Export as hex
const { publicKey, privateKey } = keyPair.toHex();

// Export as plain object (for backward compatibility)
const obj = keyPair.toObject();  // { publicKey: Uint8Array, privateKey: Uint8Array }
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
  Result
} from '@convex-world/convex-ts';

// Type-safe development
const tx: Transaction = {
  to: '#123',
  amount: 1000000
};

const handleResult = (result: TransactionResult) => {
  if (result.status === 'success') {
    console.log(result.hash);
  } else {
    console.error(result.error);
  }
};
```

## 🛡️ Error Handling

All API methods can throw errors. Always wrap in try-catch:

```typescript
try {
  const result = await convex.transact({
    to: '#123',
    amount: 1_000_000
  });
  console.log('Success:', result.hash);
} catch (error) {
  if (error instanceof Error) {
    console.error('Transaction failed:', error.message);
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
import { Convex, KeyPair } from '@convex-world/convex-ts';

async function main() {
  // Connect to network
  const convex = new Convex('https://peer.convex.live');

  try {
    // Set up with your account using seed from environment
    const seedHex = process.env.CONVEX_SEED!;
    const keyPair = KeyPair.fromSeed(seedHex);
    convex.setAccount('#1678', keyPair);

    // Check balance
    const info = await convex.getAccountInfo();
    console.log('Balance:', info.balance / 1_000_000, 'Convex Coins');

    // Transfer funds
    const result = await convex.transfer('#456', 1_000_000);

    if (result.status === 'success') {
      console.log('✅ Transaction successful!');
      console.log('   Hash:', result.hash);
    } else {
      console.error('❌ Failed:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### Using with React

```typescript
import { useState, useEffect } from 'react';
import { Convex } from '@convex-world/convex-ts';

function ConvexWallet({ accountAddress, keyPair }) {
  const [convex] = useState(() => new Convex('https://peer.convex.live'));
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    async function loadAccount() {
      try {
        convex.setAccount(accountAddress, keyPair);
        const info = await convex.getAccountInfo();
        setBalance(info.balance);
      } catch (error) {
        console.error('Failed to load account:', error);
      }
    }
    loadAccount();
  }, [convex, accountAddress, keyPair]);

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

### Read-Only Dashboard

Query network data without authentication:

```typescript
import { Convex } from '@convex-world/convex-ts';

async function displayNetworkStats() {
  const convex = new Convex('https://peer.convex.live');

  // Query multiple accounts
  const addresses = ['#9', '#10', '#11'];

  for (const addr of addresses) {
    const result = await convex.query({
      address: addr,
      source: `(balance ${addr})`
    });
    console.log(`${addr}: ${result.value} copper`);
  }

  // Query global state
  const supply = await convex.query('(call *registry* (lookup :CAD001))');
  console.log('Coin supply:', supply.value);
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
