import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Button from "../components/Button";
import { NetworkSelector, NetworkConfig, Identicon } from "@convex-world/convex-react";
import { LocalStorageKeyStore, bytesToHex, Convex } from "@convex-world/convex-client";

export default function DexDemoPage() {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(null);
  const [ks, setKs] = useState<LocalStorageKeyStore | null>(null);
  const [aliases, setAliases] = useState<string[]>([]);
  const [publicKeys, setPublicKeys] = useState<Record<string, string>>({});
  const [selectedAlias, setSelectedAlias] = useState<string>("");
  const [accountInput, setAccountInput] = useState<string>("");
  const [recentAccounts, setRecentAccounts] = useState<number[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [showRecentAccounts, setShowRecentAccounts] = useState(false);
  const recentDropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [cvxBalance, setCvxBalance] = useState<string | null>(null);
  const [cvxLoading, setCvxLoading] = useState(false);
  const [cvxError, setCvxError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Array<{ symbol: string; name: string; balance?: string }>>([
    { symbol: 'CVX', name: 'Convex Coin', balance: '—' },
    { symbol: 'USDc', name: 'USD Stablecoin', balance: '—' },
    { symbol: 'SQD', name: 'Squid Token', balance: '—' }
  ]);

  useEffect(() => {
    const instance = new LocalStorageKeyStore();
    setKs(instance);
    (async () => {
      const list = await instance.listAliases();
      setAliases(list);
      const pubMap: Record<string, string> = {};
      for (const alias of list) {
        const pub = await instance.getPublicKey(alias);
        if (pub) pubMap[alias] = bytesToHex(pub);
      }
      setPublicKeys(pubMap);
      if (list.length && !selectedAlias) setSelectedAlias(list[0]);
    })();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('convex-recent-accounts');
      if (saved) {
        const parsed = JSON.parse(saved) as number[];
        setRecentAccounts(parsed);
        if (parsed.length && selectedAccount == null) setSelectedAccount(parsed[0]);
      }
    } catch {}
  }, []);

  // Prefill from query param (?account=123)
  useEffect(() => {
    if (!router.isReady) return;
    const acct = router.query.account;
    if (typeof acct === 'string') {
      const n = parseInt(acct, 10);
      if (!isNaN(n)) {
        setSelectedAccount(n);
        setAccountInput(`#${n}`);
        addAccountToHistory(n);
      }
    }
  }, [router.isReady, router.query.account]);

  // Fetch CVM balance for selected account on selected network
  useEffect(() => {
    const fetchBalance = async () => {
      if (!selectedNetwork || selectedAccount == null) return;
      try {
        setCvxLoading(true);
        setCvxError(null);
        const client = new Convex(selectedNetwork.hostname);
        const res = await client.query({ source: `(balance #${selectedAccount})` });
        setCvxBalance(res?.value ?? null);
      } catch (e) {
        setCvxBalance(null);
        const msg = (e as any)?.message || 'Failed to fetch balance';
        setCvxError(String(msg));
      } finally {
        setCvxLoading(false);
      }
    };
    fetchBalance();
  }, [selectedNetwork, selectedAccount]);

  const addAccountToHistory = (acct: number) => {
    try {
      let updated = [acct, ...recentAccounts.filter(a => a !== acct)];
      if (updated.length > 10) updated = updated.slice(0, 10);
      setRecentAccounts(updated);
      localStorage.setItem('convex-recent-accounts', JSON.stringify(updated));
    } catch {}
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (recentDropdownRef.current && !recentDropdownRef.current.contains(e.target as Node)) {
        setShowRecentAccounts(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <Head>
        <title>DEX Demo - Convex</title>
      </Head>
      <div className="container">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <header className="text-center mb-8">
            <h1 className="mb-4">DEX Demo</h1>
            <p className="text-secondary max-w-2xl">
              Explore a decentralized exchange experience on Convex. This demo page is a
              placeholder and will be expanded with trading, quoting, and swap flows.
            </p>
          </header>

          <div className="card w-full max-w-2xl">
            <div className="mb-6">
              <h2 className="mb-2">Setup</h2>
              <p className="text-secondary">Choose a network and a key to use.</p>
            </div>

            <div className="grid" style={{ gap: 16 }}>
              <div>
                <div className="text-sm text-secondary mb-2">Network</div>
                <NetworkSelector
                  onNetworkChange={(cfg) => setSelectedNetwork(cfg)}
                  placeholder="🌐 Choose network"
                  maxHistory={5}
                />
                {selectedNetwork && (
                  <div className="mt-2 text-xs text-secondary">
                    Selected: <span className="text-primary font-semibold">{selectedNetwork.name}</span> ({selectedNetwork.hostname})
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <div className="text-sm text-secondary mb-2">Private Key</div>
                {aliases.length ? (
                  <div className="flex items-center" style={{ gap: 12 }}>
                    <select
                      className="input"
                      value={selectedAlias}
                      onChange={(e) => setSelectedAlias(e.target.value)}
                      style={{ minWidth: 220 }}
                    >
                      {aliases.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    <div style={{ width: 32, height: 32 }}>
                      {selectedAlias && publicKeys[selectedAlias] && (
                        <Identicon data={publicKeys[selectedAlias]} size={7} pixelSize={8} style={{ width: 32, height: 32 }} />
                      )}
                    </div>
                    {selectedAlias && publicKeys[selectedAlias] && (
                      <code className="text-xs text-primary" style={{ wordBreak: 'break-all' }}>
                        {publicKeys[selectedAlias]}
                      </code>
                    )}
                    <Button variant="secondary" onClick={() => (window.location.href = "/keypair")}>
                      Manage Keys…
                    </Button>
                  </div>
                ) : (
                  <div className="text-secondary">
                    No keys found. Create one in <a href="/keypair" className="text-primary hover:underline">Keyring</a>.
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-4">
                <div className="text-sm text-secondary mb-2">Account</div>
                <div className="flex items-center" style={{ gap: 12, flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="#123"
                    value={accountInput}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9#]/g, '');
                      setAccountInput(v);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const n = parseInt(accountInput.replace('#', ''), 10);
                        if (!isNaN(n)) {
                          setSelectedAccount(n);
                          addAccountToHistory(n);
                        }
                      }
                    }}
                    className="input"
                    style={{ width: 140 }}
                  />
                  {recentAccounts.length > 0 && (
                    <div ref={recentDropdownRef} style={{ position: 'relative' }}>
                      <Button
                        variant="secondary"
                        onClick={() => setShowRecentAccounts((v) => !v)}
                        title="Recent accounts"
                        aria-haspopup="listbox"
                        aria-expanded={showRecentAccounts}
                        style={{ minWidth: 36, paddingLeft: 8, paddingRight: 8 }}
                      >
                        ▾
                      </Button>
                      {showRecentAccounts && (
                        <div
                          role="listbox"
                          className="card"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 1000,
                            marginTop: 4,
                            minWidth: 160,
                            padding: 4
                          }}
                        >
                          {recentAccounts.map((acct) => (
                            <button
                              key={acct}
                              type="button"
                              role="option"
                              aria-selected={selectedAccount === acct}
                              onClick={() => {
                                setSelectedAccount(acct);
                                setAccountInput(`#${acct}`);
                                addAccountToHistory(acct);
                                setShowRecentAccounts(false);
                              }}
                              className="w-full text-left"
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: 6,
                                background: selectedAccount === acct ? 'var(--surface-light)' : 'transparent',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              #{acct}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <Button
                    onClick={() => {
                      const n = parseInt(accountInput.replace('#', ''), 10);
                      if (!isNaN(n)) {
                        setSelectedAccount(n);
                        addAccountToHistory(n);
                      }
                    }}
                    disabled={!/^#?\d+$/.test(accountInput)}
                  >
                    Use Account
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedAccount(null);
                      setAccountInput("");
                      setShowRecentAccounts(false);
                      window.location.href = '/connect';
                    }}
                  >
                    Change Account
                  </Button>

                  {selectedAccount != null && (
                    <div className="text-sm text-secondary">Selected: <span className="text-primary font-semibold">#{selectedAccount}</span></div>
                  )}
                </div>
              </div>
            </div>
          </div>

        <div className="card w-full max-w-2xl mt-6">
          <div className="mb-4">
            <h2 className="mb-2">Tokens</h2>
            <p className="text-secondary">Balances update when network and account are selected.</p>
            {cvxError && (
              <div className="text-xs" style={{ color: '#ef4444', marginTop: 6 }}>Error: {cvxError}</div>
            )}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 160px',
            gap: 0,
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden'
          }}>
            <div className="text-sm text-secondary" style={{ padding: '10px 12px', background: 'var(--surface-light)', fontWeight: 600 }}>Symbol</div>
            <div className="text-sm text-secondary" style={{ padding: '10px 12px', background: 'var(--surface-light)', fontWeight: 600 }}>Name</div>
            <div className="text-sm text-secondary" style={{ padding: '10px 12px', background: 'var(--surface-light)', fontWeight: 600, textAlign: 'right' }}>Balance</div>

            {tokens.map((t) => (
              <React.Fragment key={t.symbol}>
                <div style={{ padding: '12px 12px', borderTop: '1px solid var(--border)' }}>
                  <strong className="text-primary">{t.symbol}</strong>
                </div>
                <div style={{ padding: '12px 12px', borderTop: '1px solid var(--border)' }}>
                  {t.name}
                </div>
                <div style={{ padding: '12px 12px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                  {t.symbol === 'CVX' ? (cvxLoading ? 'Loading…' : (cvxBalance ?? '—')) : (t.balance ?? '—')}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="card w-full max-w-2xl mt-6">
          <div className="mb-2">
            <h2 className="mb-1">CVM Balance</h2>
            <p className="text-secondary">Native Convex balance for the selected account.</p>
          </div>
          <div className="flex items-center" style={{ justifyContent: 'space-between', gap: 12 }}>
            <div className="text-sm text-secondary">
              {selectedAccount != null ? (
                <>Account <span className="text-primary font-semibold">#{selectedAccount}</span></>
              ) : (
                <>Select an account to view balance</>
              )}
            </div>
            <div className="text-xl font-semibold">
              {cvxLoading ? 'Loading…' : (selectedAccount != null ? (cvxBalance ?? '—') : '—')}
            </div>
          </div>
          {cvxError && (
            <div className="text-xs" style={{ color: '#ef4444', marginTop: 6 }}>Error: {cvxError}</div>
          )}
        </div>

          <footer className="text-center mt-8 text-secondary text-sm">
            <Button variant="secondary" onClick={() => (window.location.href = "/")}>← Back to Home</Button>
          </footer>
        </div>
      </div>
    </>
  );
}


