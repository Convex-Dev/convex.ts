import React, { useState } from "react";
import Head from "next/head";
import { Identicon } from "@convex-world/convex-react";
import { generateKeyPair, bytesToHex, LocalStorageKeyStore, type KeyPair } from "@convex-world/convex-client";

export default function KeyPairGeneratorPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);

  // Keyring state
  const [ks, setKs] = useState<LocalStorageKeyStore | null>(null);
  const [aliases, setAliases] = useState<string[]>([]);
  const [unlocked, setUnlocked] = useState<Record<string, KeyPair | null>>({});
  const [publicKeys, setPublicKeys] = useState<Record<string, string>>({});

  // Inputs for saving/unlocking
  const [newAlias, setNewAlias] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [unlockPasswords, setUnlockPasswords] = useState<Record<string, string>>({});

  React.useEffect(() => {
    // Instantiate keystore in browser only
    const instance = new LocalStorageKeyStore();
    setKs(instance);
    (async () => {
      const list = await instance.listAliases();
      setAliases(list);
      const pubKeys: Record<string, string> = {};
      for (const alias of list) {
        const pubKey = await instance.getPublicKey(alias);
        if (pubKey) pubKeys[alias] = bytesToHex(pubKey);
      }
      setPublicKeys(pubKeys);
    })();
  }, []);

  const refreshAliases = async () => {
    if (!ks) return;
    const list = await ks.listAliases();
    setAliases(list);
    
    // Load public keys for all aliases
    const pubKeys: Record<string, string> = {};
    for (const alias of list) {
      const pubKey = await ks.getPublicKey(alias);
      if (pubKey) {
        pubKeys[alias] = bytesToHex(pubKey);
      }
    }
    setPublicKeys(pubKeys);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const keyPair = await generateKeyPair();
      const pubHex = bytesToHex(keyPair.publicKey);
      setPublicKey(pubHex);
      setPrivateKey(bytesToHex(keyPair.privateKey));
      // Auto-populate alias with first 8 hex digits
      setNewAlias(`0x${pubHex.slice(0, 8)}`);
    } catch (error) {
      console.error('Error generating key pair:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToKeyStore = async () => {
    if (!ks) return;
    if (!publicKey || !privateKey) return;
    if (!newAlias) return;
    try {
      const kp: KeyPair = {
        publicKey: hexToUint8(publicKey),
        privateKey: hexToUint8(privateKey)
      };
      await ks.storeKeyPair(newAlias, kp, newPassword);
      await refreshAliases();
      setUnlocked((m) => ({ ...m, [newAlias]: null }));
      setNewAlias("");
      setNewPassword("");
    } catch (e) {
      console.error('Failed to store key pair:', e);
    }
  };

  const handleUnlock = async (alias: string) => {
    if (!ks) return;
    const pw = unlockPasswords[alias] || "";
    const kp = await ks.getKeyPair(alias, pw);
    setUnlocked((m) => ({ ...m, [alias]: kp }));
  };

  const handleLock = (alias: string) => {
    setUnlocked((m) => ({ ...m, [alias]: null }));
  };

  const handleRemove = async (alias: string) => {
    if (!ks) return;
    const confirmed = window.confirm(`Are you sure you want to remove the key "${alias}"? This action cannot be undone.`);
    if (confirmed) {
      await ks.deleteKeyPair(alias);
      const { [alias]: _, ...rest } = unlocked;
      setUnlocked(rest);
      const { [alias]: __, ...restPw } = unlockPasswords;
      setUnlockPasswords(restPw);
      const { [alias]: ___, ...restPub } = publicKeys;
      setPublicKeys(restPub);
      await refreshAliases();
    }
  };

  function hexToUint8(hex: string): Uint8Array {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  const copyPublic = async (alias: string, pubHex?: string) => {
    if (!pubHex) return;
    try {
      await navigator.clipboard.writeText(pubHex.startsWith('0x') ? pubHex : `0x${pubHex}`);
    } catch {}
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <Head>
        <title>Keyring - Convex</title>
      </Head>
      <div className="container">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          {/* Header */}
          <header className="text-center mb-8 fade-in">
            <h1 className="mb-4">Keyring</h1>
            <p className="text-secondary text-lg max-w-2xl">
              Generate keys and manage your local key store.
            </p>
          </header>

          {/* Generator */}
          <div className="card w-full max-w-2xl fade-in">
            <div className="text-center mb-6">
              <h2 className="mb-2">Create New Keys</h2>
              <p className="text-secondary">Click to generate a new public/private key pair.</p>
            </div>

            <div className="flex justify-center mb-6">
              <button 
                onClick={handleGenerate} 
                disabled={loading}
                className={`btn btn-primary ${loading ? 'pulse' : ''}`}
              >
                {loading ? "Generating Key Pair..." : "Generate New Key Pair"}
              </button>
            </div>

            {publicKey && privateKey && (
              <div className="fade-in" style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
                <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-secondary">Public Key</label>
                  <div className="bg-surface-light border border-border rounded-lg p-3 flex items-center">
                    {publicKey && (
                      <Identicon data={publicKey} size={7} pixelSize={8} style={{ width: 32, height: 32, marginRight: 8 }} />
                    )}
                    <code className="text-primary break-all flex-1" style={{ textAlign: 'left' }}>{publicKey}</code>
                    <div style={{ width: 12, marginLeft: 'auto' }} />
                    <button 
                      onClick={() => copyToClipboard(publicKey)}
                      className="copy-btn flex-shrink-0"
                      title="Copy to clipboard"
                    >
                      <span className="material-symbols-outlined">content_copy</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-secondary">Private Key</label>
                  <div className="bg-surface-light border border-border rounded-lg p-3 flex items-center">
                    <div style={{ width: 32, height: 32, marginRight: 8 }} />
                    <code className="text-warning break-all flex-1" style={{ textAlign: 'left' }}>{showPrivate ? privateKey : '•'.repeat(privateKey.length)}</code>
                    <div style={{ width: 12, marginLeft: 'auto' }} />
                    <div className="flex items-center" style={{ gap: 8 }}>
                      <button
                        onClick={() => setShowPrivate((v) => !v)}
                        className="copy-btn flex-shrink-0"
                        title={showPrivate ? "Hide private key" : "Show private key"}
                        aria-pressed={showPrivate}
                      >
                        <span className="material-symbols-outlined">{showPrivate ? 'visibility_off' : 'visibility'}</span>
                      </button>
                      <button 
                        onClick={() => copyToClipboard(privateKey)}
                        className="copy-btn flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        <span className="material-symbols-outlined">content_copy</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted">
                    ⚠️ Keep your private key secure and never share it with anyone
                  </p>
                </div>

                {/* Save to keystore */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-secondary">Add to Key Store</label>
                  <div className="bg-surface-light border border-border rounded-lg p-3">
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Alias (e.g., alice)"
                        value={newAlias}
                        onChange={(e) => setNewAlias(e.target.value)}
                        className="input"
                      />
                      <div className="space-y-1">
                        <input
                          type="password"
                          placeholder="Password (optional)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="input"
                        />
                        {!newPassword && (
                          <div className="text-xs text-warning">⚠️ WARNING: password is blank</div>
                        )}
                      </div>
                      <button
                        onClick={handleAddToKeyStore}
                        className="btn btn-primary"
                        disabled={!newAlias}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}
          </div>

          {/* Keyring Management */}
          <div className="card w-full max-w-3xl fade-in" style={{ marginTop: 24 }}>
            <div className="text-center mb-6">
              <h2 className="mb-2">Your Keyring</h2>
              <p className="text-secondary">Keys stored locally in your browser.</p>
            </div>

            {!aliases.length && (
              <p className="text-center text-secondary">No keys stored yet.</p>
            )}

            {!!aliases.length && (
              <div>
                {/* Header */}
                <div className="grid items-center" style={{ 
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 2fr auto', 
                  gap: '16px', 
                  padding: '12px 16px', 
                  borderBottom: '2px solid var(--border)', 
                  marginBottom: '16px',
                  backgroundColor: 'var(--surface-light)',
                  borderRadius: '8px 8px 0 0'
                }}>
                  <div className="font-semibold text-sm text-secondary">Alias</div>
                  <div className="font-semibold text-sm text-secondary">Status</div>
                  <div className="font-semibold text-sm text-secondary">Actions</div>
                  <div className="font-semibold text-sm text-secondary text-center">Remove</div>
                </div>
                {/* Data rows */}
                <div className="space-y-2">
                  {aliases.map((alias) => {
                    const kp = unlocked[alias];
                    const isUnlocked = !!kp;
                    const pubHex = publicKeys[alias] || (isUnlocked ? bytesToHex(kp!.publicKey) : undefined);
                    return (
                      <div key={alias} className="grid items-center" style={{ 
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 2fr auto', 
                        gap: '16px', 
                        padding: '12px 16px', 
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        borderRadius: '4px'
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <button
                            type="button"
                            onClick={() => copyPublic(alias, pubHex)}
                            className="flex items-center"
                            style={{ gap: 8, marginBottom: 4, cursor: pubHex ? 'pointer' : 'default', background: 'transparent', border: 0, padding: 0 }}
                            title={pubHex ? `Copy public key ${(pubHex.startsWith('0x') ? pubHex : '0x' + pubHex).slice(0, 12)}…` : undefined}
                            aria-label={pubHex ? `Copy public key for ${alias}` : `No public key for ${alias}`}
                          >
                            {pubHex ? (
                              <Identicon data={pubHex} size={7} pixelSize={6} style={{ width: 28, height: 28 }} />
                            ) : (
                              <div style={{ width: 28, height: 28 }} />
                            )}
                            <strong className={`text-primary ${pubHex ? 'hover:underline' : ''}`}>{alias}</strong>
                          </button>
                        </div>
                      <div>
                        <span className={`tag ${isUnlocked ? 'tag-success' : 'tag-warning'}`}>{isUnlocked ? 'Unlocked' : 'Locked'}</span>
                      </div>
                        <div>
                          {!isUnlocked && (
                            <div className="flex items-center" style={{ gap: 8 }}>
                              <input
                                type="password"
                                placeholder="Password"
                                value={unlockPasswords[alias] || ''}
                                onChange={(e) => setUnlockPasswords((m) => ({ ...m, [alias]: e.target.value }))}
                                className="input"
                                style={{ width: 150 }}
                              />
                              <button className="btn btn-primary" onClick={() => handleUnlock(alias)}>Unlock</button>
                            </div>
                          )}
                          {isUnlocked && (
                            <button className="btn btn-secondary" onClick={() => handleLock(alias)}>Lock</button>
                          )}
                        </div>
                        <div className="text-center">
                          <button 
                            onClick={() => handleRemove(alias)}
                            title={`Remove ${alias}`}
                            style={{ 
                              background: 'transparent',
                              border: '1px solid #ef4444',
                              color: '#ef4444',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              minWidth: 'auto',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#ef4444';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <footer className="text-center mt-8 text-secondary text-sm">
            <a href="/" className="btn btn-secondary">← Back to Home</a>
          </footer>
        </div>
      </div>
    </>
  );
}


