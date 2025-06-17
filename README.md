# Convex TypeScript Client

A TypeScript/JavaScript client library for interacting with the Convex DLT network.

See: [Convex Docs](https://docs.convex.world)

## Installation

```bash
pnpm add convex-ts
```

## Usage

### TypeScript

```typescript
import { Convex } from 'convex-ts';

// Connect to a Convex peer
const convex = new Convex('https://convex.world');

// Create a new account with initial balance (on test network)
await convex.createAccount(10000000);

// Get account information
const accountInfo = await convex.getAccountInfo();

// Submit a transaction
const result = await convex.submitTransaction({
  // transaction details
});
```

### JavaScript (ESM)

```javascript
import { Convex } from 'convex-ts';

// Connect to a Convex peer
const convex = new Convex('https://convex.world');

// Create a new account with initial balance (on test network)
await convex.createAccount(10000000);
```

### JavaScript (CommonJS)

```javascript
const { Convex } = require('convex-ts');

// Connect to a Convex peer
const convex = new Convex('https://convex.world');

// Create a new account with initial balance (on test network)
convex.createAccount(10000000)
  .then(account => console.log(account));
```

## Features

- Connect to Convex network peers
- Account management
- Transaction submission and tracking
- Cryptographic key pair generation and management
- Query state and history
- Full TypeScript type definitions
- Supports both ESM and CommonJS

## Development

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [pnpm](https://pnpm.io/) (v8 or later)
- Node.js (v16 or later)

### Setup

```bash
# Install dependencies
pnpm install

# Build the library
pnpm run build
```

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
# Run tests with local peer
CONVEX_PEER_URL=http://localhost:8080 pnpm test
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

## API Documentation

### Convex

The main class for interacting with the Convex network.

#### Constructor

```typescript
new Convex(peerUrl: string, options?: ClientOptions)
```

#### Methods

- `createAccount(initialBalance?: number): Promise<Account>`
- `getAccountInfo(): Promise<AccountInfo>`
- `submitTransaction(tx: Transaction): Promise<TransactionResult>`
- `getKeyPair(): KeyPair`
- `query(query: Query): Promise<QueryResult>`

## License

Apache License 2.0 