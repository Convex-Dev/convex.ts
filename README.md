# convex.ts

[![npm version](https://badge.fury.io/js/@convex-world%2Fconvex-ts.svg)](https://www.npmjs.com/package/@convex-world/convex-ts)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

Official TypeScript/JavaScript client libraries for the [Convex](https://convex.world) decentralized lattice network.

📚 [Documentation](https://docs.convex.world) | 💬 [Discord](https://discord.com/invite/xfYGq4CT7v) | 🌐 [Website](https://convex.world)

---

## Packages

| Package | Description | Documentation |
|---------|-------------|---------------|
| **[@convex-world/convex-ts](packages/convex-client)** | Core TypeScript/JavaScript client library | [README](packages/convex-client/README.md) |
| **[@convex-world/convex-react](packages/convex-react)** | React hooks and components | [README](packages/convex-react/README.md) |
| **[demo-site](packages/demo-site)** | Next.js demo application | [README](packages/demo-site/README.md) |

## Quick Start

### Using the Client Library

```bash
npm install @convex-world/convex-ts
```

```typescript
import { Convex } from '@convex-world/convex-ts';

const convex = new Convex('https://peer.convex.live');
const result = await convex.query('(balance #13)');
```

**→ [See the client README for complete documentation](packages/convex-client/README.md)**

### Running the Demo

```bash
pnpm install
pnpm demo  # Opens http://localhost:3000
```

## Development

This is a **pnpm workspace monorepo**. To contribute:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests (requires Docker)
docker-compose up -d
pnpm -r test

# Run demo site
pnpm demo
```

**→ See [CLAUDE.md](CLAUDE.md) for detailed development guidelines**

## Resources

- **Documentation**: [docs.convex.world](https://docs.convex.world)
- **Community**: [Discord](https://discord.com/invite/xfYGq4CT7v)
- **Core Platform**: [github.com/Convex-Dev/convex](https://github.com/Convex-Dev/convex) (Java)

## License

Apache-2.0 - see [LICENSE](LICENSE) for details.
