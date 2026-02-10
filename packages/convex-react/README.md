# Convex React Components

This package provides React components for building Convex applications.

## NetworkSelector

A React component that allows users to select and manage Convex network configurations.

### Features

- **Network Selection**: Choose from predefined networks or add custom ones
- **History Management**: Automatically saves and loads previously used networks
- **Custom Networks**: Add new network configurations with custom names and hostnames
- **Minimal Styling**: Clean, minimal CSS classes that can be easily customized

### Usage

```tsx
import { NetworkSelector, NetworkConfig } from '@convex-world/convex-react';

function App() {
  const handleNetworkChange = (config: NetworkConfig) => {
    console.log('Selected network:', config.name, config.hostname);
    // Initialize your Convex client with the selected network
  };

  return (
    <div>
      <h2>Select Network</h2>
      <NetworkSelector 
        onNetworkChange={handleNetworkChange}
        placeholder="Choose a network..."
        maxHistory={5}
      />
    </div>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onNetworkChange` | `(config: NetworkConfig) => void` | Required | Callback when a network is selected |
| `className` | `string` | `""` | Additional CSS classes |
| `placeholder` | `string` | `"Select or enter network..."` | Placeholder text for the selector |
| `maxHistory` | `number` | `5` | Maximum number of custom networks to remember |

### NetworkConfig Interface

```typescript
interface NetworkConfig {
  name: string;      // Display name for the network
  hostname: string;  // Network hostname (e.g., "http://peer.convex.live:8080")
}
```

### Default Networks

The component comes with these predefined networks:

- **Protonet**: `http://peer.convex.live:8080`
- **Testnet**: `http://testnet.convex.live:8080`
- **Local**: `http://localhost:8080`

### Styling

The component uses minimal CSS classes that can be easily customized:

- `.network-selector` - Main container
- `.network-selector-button` - Dropdown button
- `.network-selector-list` - Network list dropdown
- `.network-selector-item` - Individual network item
- `.network-selector-custom` - Custom network form
- `.network-selector-input` - Form inputs
- `.network-selector-submit` - Submit button
- `.network-selector-remove` - Remove button for custom networks

### Storage

Network history is automatically saved to `localStorage` under the key `'convex-network-history'`. The component handles loading and saving automatically.

### Example Integration

```tsx
import { NetworkSelector, NetworkConfig } from '@convex-world/convex-react';
import { ConvexClient } from '@convex-world/convex-ts';

function ConvexApp() {
  const [client, setClient] = useState<ConvexClient | null>(null);

  const handleNetworkChange = (config: NetworkConfig) => {
    // Create new client with selected network
    const newClient = new ConvexClient(config.hostname);
    setClient(newClient);
  };

  return (
    <div>
      <NetworkSelector onNetworkChange={handleNetworkChange} />
      {client && <YourApp client={client} />}
    </div>
  );
}
``` 