# Convex TypeScript Client

A TypeScript client library for interacting with the Convex DLT network.

## Installation

```bash
pnpm add convex-ts
```

## Usage

```typescript
import { ConvexClient } from 'convex-ts';

// Connect to a Convex peer
const client = new ConvexClient('https://convex.world');

// Create a new account with initial balance (on test network)
await client.createAccount(10000000);

// Get account information
const accountInfo = await client.getAccountInfo();

// Submit a transaction
const result = await client.submitTransaction({
  // transaction details
});
```

## Features

- Connect to Convex network peers
- Account management
- Transaction submission and tracking
- Cryptographic key pair generation and management
- Query state and history

## API Documentation

### ConvexClient

The main class for interacting with the Convex network.

#### Constructor

```typescript
new ConvexClient(peerUrl: string, options?: ClientOptions)
```

#### Methods

- `createAccount(initialBalance?: number): Promise<Account>`
- `getAccountInfo(): Promise<AccountInfo>`
- `submitTransaction(tx: Transaction): Promise<TransactionResult>`
- `getKeyPair(): KeyPair`
- `query(query: Query): Promise<QueryResult>`

## Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm run build

# Run tests
pnpm test
```

## License

Apache License 2.0 