# convex.ts

[![npm version](https://badge.fury.io/js/@convex-world%2Fconvex-ts.svg)](https://www.npmjs.com/package/@convex-world/convex-ts)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

Official TypeScript/JavaScript client library for the [Convex](https://convex.world) decentralized lattice network.

**Convex** is building fair, inclusive, efficient, and sustainable economic systems based on decentralized technology. This library provides idiomatic TypeScript/JavaScript APIs for interacting with the Convex network.

📚 [Convex Documentation](https://docs.convex.world) | 💬 [Discord](https://discord.com/invite/xfYGq4CT7v) | 🐙 [GitHub](https://github.com/Convex-Dev/convex.ts)

## Installation

```bash
# Using pnpm
pnpm add @convex-world/convex-ts

# Using npm
npm install @convex-world/convex-ts

# Using yarn
yarn add @convex-world/convex-ts
```

## Features

- 🔐 **Account Management** - Create and manage Convex accounts
- 🔑 **Cryptography** - Ed25519 key pair generation and signing
- 💸 **Transactions** - Submit and track transactions on the network
- 🔍 **Queries** - Query network state and account information
- 🎨 **Identicons** - Generate visual identicons for addresses
- 💾 **Key Storage** - Secure keystore functionality
- 📘 **TypeScript** - Full type definitions included
- 🌐 **ESM** - Modern ES module support
- 🧪 **Tested** - Comprehensive test coverage

## Quick Start

### Basic Usage

```typescript
import { Convex } from '@convex-world/convex-ts';

// Connect to a Convex peer
const convex = new Convex('https://convex.world', {
  timeout: 30000  // Optional: request timeout in ms
});

// Create a new account (generates key pair automatically)
const account = await convex.createAccount(10000000);
console.log('Account created:', account.address);

// Get account information
const accountInfo = await convex.getAccountInfo();
console.log('Balance:', accountInfo.balance);

// Submit a transaction
const result = await convex.submitTransaction({
  to: '#123',        // Destination address
  amount: 1000000,   // Amount in copper coins
  data: { memo: 'Hello Convex!' }
});
console.log('Transaction hash:', result.hash);

// Query network state
const queryResult = await convex.query({
  source: '(balance *address*)'  // Convex Lisp query
});
console.log('Query result:', queryResult.value);
```

### Key Management

```typescript
import { generateKeyPair, sign, verify } from '@convex-world/convex-ts';

// Generate a new key pair
const keyPair = await generateKeyPair();
console.log('Public key:', Buffer.from(keyPair.publicKey).toString('hex'));

// Sign data
const message = 'Hello Convex!';
const signature = await sign(message, keyPair.privateKey);

// Verify signature
const isValid = await verify(signature, message, keyPair.publicKey);
console.log('Signature valid:', isValid);
```

### Keystore Usage

```typescript
import { Keystore } from '@convex-world/convex-ts';

// Create a keystore
const keystore = await Keystore.create('mypassword123');

// Save to encrypted file
await keystore.save('./my-keystore.json');

// Load from file
const loaded = await Keystore.load('./my-keystore.json', 'mypassword123');

// Export/import keys
const exported = await keystore.export('mypassword123');
const imported = await Keystore.import(exported, 'mypassword123');
```

### CommonJS Usage

While this package is ESM-first, you can use it in CommonJS projects:

```javascript
const { Convex } = require('@convex-world/convex-ts');

const convex = new Convex('https://convex.world');

convex.createAccount(10000000)
  .then(account => console.log('Account:', account))
  .catch(error => console.error('Error:', error));
```

## Packages

This is a monorepo containing multiple packages:

| Package | npm | Description | Status |
|---------|-----|-------------|--------|
| **convex-client** | [@convex-world/convex-ts](https://www.npmjs.com/package/@convex-world/convex-ts) | Core TypeScript client | ✅ Published |
| **convex-react** | `@convex-world/convex-react` | React hooks & components | 🚧 In development |
| **demo-site** | - | Next.js demo application | 🚧 In development |

## Development

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [pnpm](https://pnpm.io/) (v8 or later)
- Node.js (v16 or later)

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build
```

### Building Individual Packages

```bash
# Build the convex-client package
pnpm --filter @convex-world/convex-ts build

# Build the convex-react package
pnpm --filter @convex-world/convex-react build

# Build the demo-site package
pnpm --filter @convex-world/demo-site build
```

### Running the Demo Site

The demo site showcases the Convex client library with a simple key pair generation interface.

#### Development Mode

```bash
# Start the demo site in development mode
pnpm demo

# Or run directly in the demo-site directory
cd packages/demo-site
pnpm dev
```

The demo site will be available at `http://localhost:3000`

#### Production Build

```bash
# Build the demo site for production
pnpm --filter @convex-world/demo-site build

# Start the production server
pnpm --filter @convex-world/demo-site start
```

#### Demo Site Features

- **Key Pair Generation**: Demonstrates cryptographic key pair generation using the Convex client
- **Real-time Updates**: Shows live key generation with loading states
- **TypeScript Integration**: Full type safety with the Convex client library

### Running Tests

The tests require a local Convex peer running in Docker. Follow these steps:

1. Start Docker Desktop and ensure it's running

2. Start the local Convex peer:
```bash
docker-compose up -d
```

3. Verify the peer is running:
```bash
# Check container status
docker ps | grep convex-peer

# Check API endpoint
curl http://localhost:8080/api/v1/status
```

4. Run the tests:
```bash
# Run all tests
pnpm test

# Run tests with local peer
CONVEX_PEER_URL=http://localhost:8080 pnpm test

# Run tests for specific package
pnpm --filter @convex-world/convex-ts test
```

### Project Structure

```
convex.ts/
├── packages/
│   ├── convex-client/     # Main TypeScript client library
│   ├── convex-react/      # React hooks and components
│   └── demo-site/         # Next.js demo application
├── scripts/               # Build and utility scripts
└── docker-compose.yml     # Local Convex peer setup
```

### Troubleshooting

If you can't access the Convex peer:

1. Check Docker container status:
```bash
docker-compose ps
```

2. Check container logs:
```bash
docker-compose logs
```

3. Ensure ports are properly exposed:
```bash
# Stop the container
docker-compose down

# Start with verbose output
docker-compose up
```

4. If you still can't connect, try:
   - Restarting Docker Desktop
   - Running `docker-compose down` followed by `docker-compose up -d`
   - Checking your firewall settings for ports 18888 and 18889

#### Demo Site Issues

If the demo site won't start:

1. Ensure all dependencies are installed:
```bash
pnpm install
```

2. Build the client library first:
```bash
pnpm --filter @convex-world/convex-ts build
```

3. Check for port conflicts:
```bash
# Check if port 3000 is in use
netstat -an | grep :3000
```

4. Clear Next.js cache:
```bash
cd packages/demo-site
rm -rf .next
pnpm dev
```

## API Reference

### `Convex` Class

Main client for interacting with the Convex network.

#### Constructor

```typescript
new Convex(peerUrl: string, options?: ClientOptions)
```

**Parameters:**
- `peerUrl`: URL of the Convex peer (e.g., `'https://convex.world'`)
- `options`: Optional configuration
  - `timeout?: number` - Request timeout in milliseconds (default: 30000)
  - `headers?: Record<string, string>` - Custom HTTP headers

#### Methods

##### `createAccount(initialBalance?: number): Promise<AccountInfo>`

Creates a new account with an auto-generated key pair.

**Parameters:**
- `initialBalance`: Optional initial balance in copper coins (1 Convex Coin = 1,000,000 copper)

**Returns:** Account information including address, balance, and public key

##### `getAccountInfo(): Promise<AccountInfo>`

Retrieves current account information.

**Returns:** Updated account information

##### `submitTransaction(tx: Transaction): Promise<TransactionResult>`

Submits a signed transaction to the network.

**Parameters:**
- `tx`: Transaction object
  - `to?: string` - Destination address
  - `amount?: number` - Amount to transfer
  - `sequence?: number` - Transaction sequence number
  - `data?: any` - Additional transaction data

**Returns:** Transaction result with hash and status

##### `query(query: Query): Promise<Result>`

Executes a query on the network.

**Parameters:**
- `query`: Query object
  - `address?: string` - Address context for query
  - `source?: any` - Convex Lisp query source

**Returns:** Query result value

##### `getKeyPair(): KeyPair`

Returns the current key pair.

**Returns:** Key pair object with `privateKey` and `publicKey`

### Cryptography Functions

```typescript
// Generate a new Ed25519 key pair
generateKeyPair(): Promise<KeyPair>

// Sign a message
sign(message: string, privateKey: Uint8Array): Promise<Uint8Array>

// Verify a signature
verify(signature: Uint8Array, message: string, publicKey: Uint8Array): Promise<boolean>
```

### `Keystore` Class

Secure encrypted key storage.

```typescript
// Create a new keystore
static create(password: string): Promise<Keystore>

// Load from file
static load(filePath: string, password: string): Promise<Keystore>

// Import from JSON
static import(json: string, password: string): Promise<Keystore>

// Save to file
save(filePath: string): Promise<void>

// Export to JSON
export(password: string): Promise<string>
```

### TypeScript Types

All TypeScript interfaces are exported for your convenience:

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

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Convex-Dev/convex.ts.git
cd convex.ts

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests (requires Docker for local peer)
docker-compose up -d
pnpm test
```

See [CLAUDE.md](CLAUDE.md) for detailed development guidelines.

## Support

- 📚 [Documentation](https://docs.convex.world)
- 💬 [Discord Community](https://discord.com/invite/xfYGq4CT7v)
- 🐛 [Issue Tracker](https://github.com/Convex-Dev/convex.ts/issues)
- 🌐 [Convex Website](https://convex.world)

## Related Projects

- [convex](https://github.com/Convex-Dev/convex) - Core Convex network implementation (Java)
- [convex.world](https://github.com/Convex-Dev/convex.world) - Main website
- [design](https://github.com/Convex-Dev/design) - Architecture documentation

## License

Apache License 2.0 - see [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the [Convex Foundation](https://convex.world) 