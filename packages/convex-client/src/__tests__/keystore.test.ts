import { LocalStorageKeyStore } from '../keystore.js';
import { KeyPair } from '../KeyPair.js';

// Ensure WebCrypto is available for tests (Node 18+ provides it via node:crypto)
// @ts-ignore
const g = /** @type {any} */ (globalThis);

if (!g.crypto || !g.crypto.subtle) {
  try {
    const { webcrypto } = eval('require')('node:crypto');
    g.crypto = webcrypto;
  } catch {
    // Fallback if import fails
  }
}
const hasWebCrypto = typeof g.crypto !== 'undefined' && !!g.crypto?.subtle;

describe('LocalStorageKeyStore', () => {
  beforeEach(() => {
    /** @type {Record<string,string>} */
    let store: Record<string, string> = {};
    g.localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() { return Object.keys(store).length; },
      clear: () => { store = {}; },
    };

    let sstore: Record<string, string> = {};
    g.sessionStorage = {
      getItem: (k: string) => (k in sstore ? sstore[k] : null),
      setItem: (k: string, v: string) => { sstore[k] = String(v); },
      removeItem: (k: string) => { delete sstore[k]; },
      key: (i: number) => Object.keys(sstore)[i] ?? null,
      get length() { return Object.keys(sstore).length; },
      clear: () => { sstore = {}; },
    };
  });

  (hasWebCrypto ? it : it.skip)('generates, stores, and restores a key pair with password', async () => {
    const ks = new LocalStorageKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('alice', kp, 'correct horse battery staple');

    const restored = await ks.getKeyPair('alice', 'correct horse battery staple');
    expect(restored).not.toBeNull();
    if (!restored) throw new Error('restored should not be null');
    expect(restored.publicKeyHex).toBe(kp.publicKeyHex);
    expect(restored.privateKeyHex).toBe(kp.privateKeyHex);
  });

  (hasWebCrypto ? it : it.skip)('fails to restore with wrong password', async () => {
    const ks = new LocalStorageKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('bob', kp, 'right-password');

    const wrong = await ks.getKeyPair('bob', 'wrong-password');
    expect(wrong).toBeNull();
  });

  (hasWebCrypto ? it : it.skip)('gets public key without password', async () => {
    const ks = new LocalStorageKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('charlie', kp, 'password');

    const publicKey = ks.getPublicKey('charlie');
    expect(publicKey).not.toBeNull();
    if (!publicKey) throw new Error('publicKey should not be null');
    expect(Array.from(publicKey)).toEqual(Array.from(kp.publicKey));
  });

  (hasWebCrypto ? it : it.skip)('returns null for non-existent alias', async () => {
    const ks = new LocalStorageKeyStore();
    const publicKey = ks.getPublicKey('nonexistent');
    expect(publicKey).toBeNull();
  });

  (hasWebCrypto ? it : it.skip)('unlocks to sessionStorage and locks removes it', async () => {
    const ks = new LocalStorageKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('dave', kp, 'pw');

    const restored = await ks.getKeyPair('dave', 'pw');
    expect(restored).not.toBeNull();
    if (!restored) throw new Error('restored should not be null');

    ks.storeUnlockedKeyPair('dave', restored);

    // Verify present in sessionStorage
    const rawSess = sessionStorage.getItem('convex-unlocked:dave');
    expect(rawSess).not.toBeNull();
    if (!rawSess) throw new Error('rawSess should not be null');
    const parsedSess = JSON.parse(rawSess);
    expect(Array.isArray(parsedSess.privateKey)).toBe(true);

    // Now lock
    ks.removeUnlockedKeyPair('dave');
    expect(sessionStorage.getItem('convex-unlocked:dave')).toBeNull();
  });

  (hasWebCrypto ? it : it.skip)('does not persist unlocked private key in localStorage', async () => {
    const ks = new LocalStorageKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('erin', kp, 'pw');

    // The stored record in localStorage must not contain plaintext privateKey
    const raw = localStorage.getItem('convex-keystore:erin');
    expect(raw).not.toBeNull();
    if (!raw) throw new Error('raw should not be null');
    const parsed = JSON.parse(raw);
    expect(parsed.privateKey).toBeUndefined();
    expect(Array.isArray(parsed.encryptedPrivateKey)).toBe(true);

    // Even after unlocking to sessionStorage, localStorage remains unchanged
    const restored = await ks.getKeyPair('erin', 'pw');
    expect(restored).not.toBeNull();
    if (!restored) throw new Error('restored should not be null');
    ks.storeUnlockedKeyPair('erin', restored);

    const rawAfter = localStorage.getItem('convex-keystore:erin');
    if (!rawAfter) throw new Error('rawAfter should not be null');
    const parsedAfter = JSON.parse(rawAfter);
    expect(parsedAfter.privateKey).toBeUndefined();
    expect(Array.isArray(parsedAfter.encryptedPrivateKey)).toBe(true);
  });

  (hasWebCrypto ? it : it.skip)('getUnlockedKeyPair works by public key (success)', async () => {
    const ks = new LocalStorageKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('frank', kp, 'pw');

    // unlock and store in session
    const restored = await ks.getKeyPair('frank', 'pw');
    expect(restored).not.toBeNull();
    if (!restored) throw new Error('restored should not be null');
    ks.storeUnlockedKeyPair('frank', restored);

    // retrieve by public key
    const byPub = ks.getUnlockedKeyPair(restored.publicKey);
    expect(byPub).not.toBeNull();
    if (!byPub) throw new Error('byPub should not be null');
    expect(byPub.publicKeyHex).toBe(restored.publicKeyHex);
    expect(byPub.privateKeyHex).toBe(restored.privateKeyHex);
  });

  (hasWebCrypto ? it : it.skip)('getUnlockedKeyPair by public key returns null when not found', async () => {
    const ks = new LocalStorageKeyStore();
    sessionStorage.clear();
    const nonExistent = new Uint8Array([9,8,7,6,5,4,3,2]);
    const res = ks.getUnlockedKeyPair(nonExistent);
    expect(res).toBeNull();
  });
});
