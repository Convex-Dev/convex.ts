import React, { useState, useEffect } from 'react';

// Inline styles for the NetworkSelector component
const styles = {
  container: {
    position: 'relative' as const,
    display: 'inline-block' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  dropdown: {
    position: 'relative' as const,
  },
  button: {
    display: 'block' as const,
    width: '100%' as const,
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: '14px',
    minWidth: '200px',
  },
  buttonHover: {
    borderColor: '#999',
  },
  custom: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    background: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '12px',
    marginTop: '4px',
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  input: {
    padding: '6px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  },
  inputFocus: {
    outline: 'none',
    borderColor: '#0066cc',
  },
  submit: {
    padding: '6px 12px',
    background: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitHover: {
    background: '#0052a3',
  },
  list: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    right: 0,
    background: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginTop: '4px',
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxHeight: '200px',
    overflowY: 'auto' as const,
    scrollbarWidth: 'none' as const, // Firefox
    msOverflowStyle: 'none' as const, // IE and Edge
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
  },
  itemHover: {
    background: '#f5f5f5',
  },
  itemContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
  },
  itemName: {
    fontWeight: 500,
    fontSize: '14px',
    color: '#222', // dark text for visibility
  },
  itemHostname: {
    fontSize: '12px',
    color: '#444', // muted dark for hostname
    marginTop: '2px',
  },
  remove: {
    background: 'none',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    fontSize: '16px',
    padding: 0,
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeHover: {
    color: '#cc0000',
  },
};

export interface NetworkConfig {
  name: string;
  hostname: string;
}

interface NetworkSelectorProps {
  onNetworkChange: (config: NetworkConfig) => void;
  className?: string;
  placeholder?: string;
  maxHistory?: number;
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  dropdownStyle?: React.CSSProperties;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

const DEFAULT_NETWORKS: NetworkConfig[] = [
  { name: "Protonet", hostname: "http://peer.convex.live:8080" },
  { name: "Testnet", hostname: "http://testnet.convex.live:8080" },
  { name: "Local", hostname: "http://localhost:8080" },
];

export default function NetworkSelector({
  onNetworkChange,
  className = "",
  placeholder = "Select or enter network...",
  maxHistory = 5,
  style,
  buttonStyle,
  dropdownStyle,
  onMouseEnter,
  onMouseLeave
}: NetworkSelectorProps) {
  const [networks, setNetworks] = useState<NetworkConfig[]>(DEFAULT_NETWORKS);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(null);
  const [customName, setCustomName] = useState("");
  const [customHostname, setCustomHostname] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load previously used networks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('convex-network-history');
      if (saved) {
        const history = JSON.parse(saved) as NetworkConfig[];
        setNetworks((prev: NetworkConfig[]) => {
          const combined = [...prev, ...history];
          // Remove duplicates based on hostname
          const unique = combined.filter((network, index, self) => 
            index === self.findIndex(n => n.hostname === network.hostname)
          );
          return unique.slice(0, maxHistory + DEFAULT_NETWORKS.length);
        });
      }
    } catch (error) {
      console.warn('Failed to load network history:', error);
    }
  }, [maxHistory]);

  const saveToHistory = (config: NetworkConfig) => {
    try {
      const saved = localStorage.getItem('convex-network-history');
      let history: NetworkConfig[] = saved ? JSON.parse(saved) : [];
      
      // Remove if already exists
      history = history.filter(n => n.hostname !== config.hostname);
      
      // Add to beginning
      history.unshift(config);
      
      // Keep only the most recent ones
      history = history.slice(0, maxHistory);
      
      localStorage.setItem('convex-network-history', JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save network history:', error);
    }
  };

  const handleNetworkSelect = (config: NetworkConfig) => {
    setSelectedNetwork(config);
    setShowCustomForm(false);
    setShowDropdown(false);
    saveToHistory(config);
    onNetworkChange(config);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim() && customHostname.trim()) {
      const newConfig: NetworkConfig = {
        name: customName.trim(),
        hostname: customHostname.trim()
      };
      
      setNetworks((prev: NetworkConfig[]) => {
        const updated = [newConfig, ...prev];
        // Remove duplicates and limit size
        const unique = updated.filter((network, index, self) => 
          index === self.findIndex((n: NetworkConfig) => n.hostname === network.hostname)
        );
        return unique.slice(0, maxHistory + DEFAULT_NETWORKS.length);
      });
      
      handleNetworkSelect(newConfig);
      setCustomName("");
      setCustomHostname("");
    }
  };

  const removeFromHistory = (hostname: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNetworks((prev: NetworkConfig[]) => prev.filter((n: NetworkConfig) => n.hostname !== hostname));
    
    try {
      const saved = localStorage.getItem('convex-network-history');
      if (saved) {
        const history = JSON.parse(saved) as NetworkConfig[];
        const updated = history.filter(n => n.hostname !== hostname);
        localStorage.setItem('convex-network-history', JSON.stringify(updated));
      }
    } catch (error) {
      console.warn('Failed to remove from network history:', error);
    }
  };

  return (
    <>
      <style>
        {`
          .network-selector-list::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <div 
        style={{ ...styles.container, ...style }} 
        className={className}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
      <div style={styles.dropdown}>
        <button
          type="button"
          style={{ ...styles.button, ...buttonStyle }}
          onClick={() => {
            setShowDropdown(!showDropdown);
            setShowCustomForm(false);
          }}
        >
          {selectedNetwork ? `${selectedNetwork.name} (${selectedNetwork.hostname})` : placeholder}
        </button>
        
        {showDropdown && (
          <>
            {showCustomForm && (
              <div style={{ ...styles.custom, ...dropdownStyle }}>
                <form onSubmit={handleCustomSubmit} style={styles.form}>
                  <input
                    type="text"
                    placeholder="Network name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    style={styles.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Hostname (e.g., http://peer.convex.live:8080)"
                    value={customHostname}
                    onChange={(e) => setCustomHostname(e.target.value)}
                    style={styles.input}
                    required
                  />
                  <button type="submit" style={styles.submit}>
                    Add Network
                  </button>
                </form>
              </div>
            )}
            
            <div 
              style={{ ...styles.list, ...dropdownStyle }}
              className="network-selector-list"
            >
              <div 
                style={{ ...styles.item, cursor: 'pointer' }}
                onClick={() => setShowCustomForm(!showCustomForm)}
              >
                <div style={styles.itemContent}>
                  <span style={styles.itemName}>+ Add Custom Network</span>
                </div>
              </div>
              {networks.map((network) => (
                <div
                  key={network.hostname}
                  style={styles.item}
                  onClick={() => handleNetworkSelect(network)}
                >
                  <div style={styles.itemContent}>
                    <span style={styles.itemName}>{network.name}</span>
                    <span style={styles.itemHostname}>{network.hostname}</span>
                  </div>
                  {!DEFAULT_NETWORKS.some((n: NetworkConfig) => n.hostname === network.hostname) && (
                    <button
                      type="button"
                      style={styles.remove}
                      onClick={(e) => removeFromHistory(network.hostname, e)}
                      title="Remove from history"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
} 