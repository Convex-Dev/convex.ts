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

# Build all packages
pnpm run build
```

### Building Individual Packages

```bash
# Build the convex-client package
pnpm --filter @convex-world/convex-client build

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
pnpm --filter @convex-world/convex-client test
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
pnpm --filter @convex-world/convex-client build
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