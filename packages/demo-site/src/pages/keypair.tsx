import React, { useState } from "react";
import Head from "next/head";
import { Identicon } from "@convex-world/convex-react";
import { generateKeyPair, generateKeyPairFromSeed, bytesToHex, hexToBytes, LocalStorageKeyStore, type KeyPair } from "@convex-world/convex-client";
import Button from "../components/Button";

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
  const [pwModalAlias, setPwModalAlias] = useState<string | null>(null);
  const [pwModalValue, setPwModalValue] = useState<string>("");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSeedValue, setImportSeedValue] = useState<string>("");

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

      // Load unlocked keys from session storage
      const unlockedKeys: Record<string, KeyPair | null> = {};
      const unlockedAliases = instance.getUnlockedAliases();
      for (const alias of unlockedAliases) {
        const keyPair = instance.getUnlockedKeyPair(alias);
        if (keyPair) {
          unlockedKeys[alias] = keyPair;
        }
      }
      setUnlocked(unlockedKeys);
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

  const handleUnlock = async (alias: string, password?: string) => {
    if (!ks) return;
    const pw = password ?? "";
    const kp = await ks.getKeyPair(alias, pw);
    if (kp) {
      // Store in session storage
      ks.storeUnlockedKeyPair(alias, kp);
      setUnlocked((m) => ({ ...m, [alias]: kp }));
    } else {
      // Ensure remains locked and any stale session entry is cleared
      ks.removeUnlockedKeyPair(alias);
      setUnlocked((m) => ({ ...m, [alias]: null }));
      if (typeof window !== 'undefined') {
        window.alert('Incorrect password');
      }
    }
  };

  const handleLock = (alias: string) => {
    if (!ks) return;
    // Remove from session storage
    ks.removeUnlockedKeyPair(alias);
    setUnlocked((m) => ({ ...m, [alias]: null }));
  };

  const toggleLock = async (alias: string) => {
    const isUnlocked = !!unlocked[alias];
    if (isUnlocked) {
      handleLock(alias);
      return;
    }
    // Locked → require password via modal
    setPwModalAlias(alias);
    setPwModalValue("");
    return;
  };

  const handleRemove = async (alias: string) => {
    if (!ks) return;
    const confirmed = window.confirm(`Are you sure you want to remove the key "${alias}"? This action cannot be undone.`);
    if (confirmed) {
      await ks.deleteKeyPair(alias);
      // Remove from session storage as well
      ks.removeUnlockedKeyPair(alias);
      const { [alias]: _, ...rest } = unlocked;
      setUnlocked(rest);
      // no password state to clear
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
    } catch { }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleImportSeed = async () => {
    if (!importSeedValue.trim()) {
      alert("Please enter a seed value");
      return;
    }

    try {
      // Convert hex string to Uint8Array using the crypto utility
      let seedHex = importSeedValue.trim();
      if (seedHex.startsWith('0x')) {
        seedHex = seedHex.slice(2);
      }
      
      if (seedHex.length !== 64) {
        alert("Seed must be 32 bytes (64 hex characters)");
        return;
      }

      const seedBytes = hexToBytes(seedHex);
      
      // Generate key pair from the seed using proper Ed25519 derivation
      const keyPair = await generateKeyPairFromSeed(seedBytes);
      const pubHex = bytesToHex(keyPair.publicKey);
      const privHex = bytesToHex(keyPair.privateKey);
      
      setPublicKey(pubHex);
      setPrivateKey(privHex);
      setShowPrivate(false);
      
      // Auto-populate alias
      setNewAlias(`0x${pubHex.slice(0, 8)}`);
      
      // Close modal
      setImportModalOpen(false);
      setImportSeedValue("");
      
    } catch (error) {
      console.error("Error importing seed:", error);
      alert("Invalid seed format. Please enter a valid 32-byte hex seed.");
    }
  };

  return (
    <>
      <Head>
        <title>Keyring - Convex</title>
      </Head>
      <div className="container">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          {pwModalAlias && (
            <div role="dialog" aria-modal="true" aria-labelledby="unlock-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="card" style={{ width: 360 }}>
                <h3 id="unlock-title" className="mb-2">Unlock "{pwModalAlias}"</h3>
                <p className="text-secondary" style={{ marginBottom: 12 }}>Enter the password to unlock this key.</p>
                <input
                  type="password"
                  autoFocus
                  value={pwModalValue}
                  onChange={(e) => setPwModalValue(e.target.value)}
                  className="input"
                  placeholder="Password"
                  autoComplete="off"
                />
                <div className="flex" style={{ gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                  <Button variant="secondary" onClick={() => { setPwModalAlias(null); setPwModalValue(""); }}>Cancel</Button>
                  <Button
                    onClick={async () => {
                      if (!pwModalAlias) return;
                      const alias = pwModalAlias;
                      setPwModalAlias(null);
                      setPwModalValue("");
                      await handleUnlock(alias, pwModalValue);
                    }}
                  >Unlock</Button>
                </div>
              </div>
            </div>
          )}

          {importModalOpen && (
            <div role="dialog" aria-modal="true" aria-labelledby="import-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="card" style={{ width: 400 }}>
                <h3 id="import-title" className="mb-2">Import Seed</h3>
                <p className="text-secondary" style={{ marginBottom: 12 }}>Enter a 32-byte Ed25519 seed (64 hex characters) to import a private key.</p>
                <textarea
                  value={importSeedValue}
                  onChange={(e) => setImportSeedValue(e.target.value)}
                  placeholder="Enter seed (e.g., 0x1234... or 1234...)"
                  className="input mb-4"
                  style={{ minHeight: '80px', fontFamily: 'monospace' }}
                  autoComplete="off"
                />
                <div className="flex" style={{ gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                  <Button variant="secondary" onClick={() => { setImportModalOpen(false); setImportSeedValue(""); }}>Cancel</Button>
                  <Button onClick={handleImportSeed}>Import</Button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <header className="text-center mb-8 fade-in">
            <h1 className="mb-4">Keyring</h1>
          </header>

          {/* Keyring Management - At the top */}
          <div className="card w-full max-w-3xl fade-in" style={{ marginBottom: 24 }}>
            <div className="text-center mb-6">
              <p className="text-secondary">Keys stored locally in your browser.</p>
            </div>

            {!aliases.length && (
              <p className="text-center text-secondary">No keys stored yet.</p>
            )}

            {!!aliases.length && (
              <div className="grid" style={{
                display: 'grid',
                gridTemplateColumns: '2fr auto auto auto',
                alignItems: 'center',
                backgroundColor: 'var(--surface-light)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div className="font-semibold text-sm text-secondary" style={{ padding: '12px 16px', borderBottom: '2px solid var(--border)' }}>Alias</div>
                <div className="font-semibold text-sm text-secondary" style={{ padding: '12px 16px', borderBottom: '2px solid var(--border)' }}>Status</div>
                <div className="font-semibold text-sm text-secondary" style={{ padding: '12px 16px', borderBottom: '2px solid var(--border)' }}>Actions</div>
                <div className="font-semibold text-sm text-secondary text-center" style={{ padding: '12px 16px', borderBottom: '2px solid var(--border)' }}>Remove</div>

                {/* Data rows */}
                {aliases.map((alias) => {
                  const kp = unlocked[alias];
                  const isUnlocked = !!kp;
                  const pubHex = publicKeys[alias] || (isUnlocked ? bytesToHex(kp!.publicKey) : undefined);
                  return (
                    <React.Fragment key={alias}>
                      <div style={{
                        minWidth: 0,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: '48px'
                      }}>
                        <button
                          type="button"
                          onClick={() => copyPublic(alias, pubHex)}
                          className="flex items-center"
                          style={{ gap: 8, cursor: pubHex ? 'pointer' : 'default', background: 'transparent', border: 0, padding: 0 }}
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

                      <div
                        className="text-center"
                        title={isUnlocked ? 'Click to lock' : 'Click to unlock'}
                        aria-label={isUnlocked ? 'Click to lock' : 'Click to unlock'}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleLock(alias)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleLock(alias); } }}
                        style={{
                          cursor: 'pointer',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '48px'
                        }}
                      >
                        <span style={{ fontSize: 24 }}>{isUnlocked ? '🔑' : '🔒'}</span>
                      </div>

                      <div style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '48px'
                      }}>
                        {!isUnlocked && (
                          <Button
                            onClick={() => toggleLock(alias)}
                            style={{ height: '36px', minWidth: '80px' }}
                          >
                            Unlock
                          </Button>
                        )}
                        {isUnlocked && (
                          <Button
                            variant="secondary"
                            onClick={() => handleLock(alias)}
                            style={{ height: '36px', minWidth: '80px' }}
                          >
                            Lock
                          </Button>
                        )}
                      </div>

                      <div className="text-center" style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '48px'
                      }}>
                        <Button
                          onClick={() => handleRemove(alias)}
                          title={`Remove ${alias}`}
                          variant="danger"
                          style={{
                            background: 'transparent',
                            border: '1px solid #ef4444',
                            color: '#faa',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            fontSize: '24px',
                            minWidth: 'auto',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          🗑
                        </Button>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* Key Generator - Below the keyring */}
          <div className="card w-full max-w-2xl fade-in">

            <div className="flex justify-center gap-4 mb-6">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className={loading ? 'pulse' : ''}
              >
                {loading ? "Generating Key Pair..." : "Generate New Key Pair"}
              </Button>
              <Button
                onClick={() => setImportModalOpen(true)}
                variant="secondary"
              >
                Import Seed...
              </Button>
            </div>

            {publicKey && privateKey && (
              <div className="fade-in p-2 bg-surface-light border border-border rounded-lg" >
                {/* Single background panel for the entire key display */}
                  {/* Grid Layout for Public and Private Keys */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 40px auto 60px',
                    gap: '8px',
                    padding: '12px',
                    alignItems: 'center'
                  }}>
                    {/* Public Key Row */}
                    <div className="text-sm font-semibold text-secondary" style={{ textAlign: 'left' }}>Public</div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {publicKey && (
                        <Identicon data={publicKey} size={7} pixelSize={8} style={{ width: 32, height: 32 }} />
                      )}
                    </div>
                    <div className="bg-white border border-gray-200 rounded items-center min-w-0">
                      <code className="text-primary break-all flex-1" style={{ textAlign: 'left', minWidth: 0}}>{publicKey}</code>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(publicKey)}
                      variant="secondary"
                      size="sm"
                      style={{ height: '28px', flexShrink: 0, minWidth: '50px' }}
                      title="Copy to clipboard"
                    >
                      Copy
                    </Button>

                    {/* Private Key Row */}
                    <div className="text-sm font-semibold text-secondary" style={{ textAlign: 'left' }}>Private</div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Button
                        onClick={() => setShowPrivate((v) => !v)}
                        variant="secondary"
                        size="md"
                        style={{ height: '32px', minWidth: '32px', padding: '0' }}
                        title={showPrivate ? "Hide private key" : "Show private key"}
                      >
                        {showPrivate ? '👁️‍🗨️' : '👁'}
                      </Button>
                    </div>
                    <div className="bg-white border border-gray-200 rounded items-center min-w-0">
                      <code className="text-warning break-all flex-1" style={{ textAlign: 'left', minWidth: 0 }}>
                        {showPrivate ? privateKey : '•'.repeat(privateKey.length)}
                      </code>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(privateKey)}
                      variant="secondary"
                      size="md"
                      style={{ height: '32px', flexShrink: 0, minWidth: '50px' }}
                      title="Copy to clipboard"
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted m-2" style={{ textAlign: 'center'}}>
                    ⚠️ Keep your private key secure and never share it with anyone
                  </p>
              </div>
            )}

            {/* Save to keystore */}
            <div className="space-y-2" style={{ marginTop: '20px' }}>
              <label className="text-sm font-semibold text-secondary">Add to Key Store</label>
              <div className="bg-surface-light border border-border rounded-lg p-3">
                <div className="grid" style={{ gridTemplateColumns: '80px 200px 1fr', gap: '12px', alignItems: 'center' }}>
                  <label className="text-sm text-secondary whitespace-nowrap">Alias</label>
                  <input
                    type="text"
                    placeholder="Alias (e.g., alice)"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    className="input"
                  />
                  <div></div>

                  <label className="text-sm text-secondary whitespace-nowrap">Password</label>
                  <input
                    type="password"
                    placeholder="Password (optional)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                  />
                  <div className="flex items-center">
                    {!newPassword && (
                      <div className="text-xs text-warning whitespace-nowrap">⚠️ WARNING: password is blank</div>
                    )}
                  </div>

                  <div></div>
                  <div className="flex">
                    <Button
                      onClick={handleAddToKeyStore}
                      disabled={!newAlias}
                    >
                      Add
                    </Button>
                  </div>
                  <div></div>
                </div>
              </div>
            </div>
          </div>

          <footer className="text-center mt-8 text-secondary text-sm">
            <Button variant="secondary" onClick={() => window.location.href = '/'}>← Back to Home</Button>
          </footer>
        </div>
      </div>
    </>
  );
}