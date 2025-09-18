import { jest } from '@jest/globals';
import { LocalStorageKeyStore } from '../keystore.js';

// Mock ed25519-heavy crypto to avoid ESM parsing issues from node_modules in Jest
jest.mock('../crypto.js', () => ({
  generateKeyPair: async () => ({
    publicKey: new Uint8Array([1, 2, 3, 4]),
    privateKey: new Uint8Array([5, 6, 7, 8])
  })
}));

import { generateKeyPair } from '../crypto.js';

// Ensure WebCrypto is available for tests (Node 18+ provides it via node:crypto)
// Use a JSDoc cast to avoid TS-only `as any` syntax which some transformers may not parse
// @ts-ignore - JSDoc cast for runtime only
const g = /** @type {any} */ (globalThis);

// Initialize WebCrypto if not available - Node 18+ has webcrypto available globally
if (!g.crypto || !g.crypto.subtle) {
  try {
    // In Node 18+, webcrypto is available as a global, but we need to import it
    // This is a synchronous operation in Node 18+
    const { webcrypto } = eval('require')('node:crypto');
    g.crypto = webcrypto;
  } catch {
    // Fallback if import fails
  }
}
const hasWebCrypto = typeof g.crypto !== 'undefined' && !!g.crypto?.subtle;

describe('LocalStorageKeyStore', () => {
  beforeEach(() => {
    // JSDOM provides localStorage in testEnvironment 'node' only if mocked; polyfill a simple version
    /** @type {Record<string,string>} */
    let store = {};
    g.localStorage = {
      // @ts-ignore
      getItem: (k) => (k in store ? store[k] : null),
      // @ts-ignore
      setItem: (k, v) => { store[k] = String(v); },
      // @ts-ignore
      removeItem: (k) => { delete store[k]; },
      key: (i) => Object.keys(store)[i] ?? null,
      get length() { return Object.keys(store).length; },
      clear: () => { store = {}; },
    };

    // Polyfill sessionStorage similarly for tests
    /** @type {Record<string,string>} */
    let sstore = {};
    g.sessionStorage = {
      // @ts-ignore
      getItem: (k) => (k in sstore ? sstore[k] : null),
      // @ts-ignore
      setItem: (k, v) => { sstore[k] = String(v); },
      // @ts-ignore
      removeItem: (k) => { delete sstore[k]; },
      key: (i) => Object.keys(sstore)[i] ?? null,
      get length() { return Object.keys(sstore).length; },
      clear: () => { sstore = {}; },
    };
  });

  (hasWebCrypto ? it : it.skip)('generates, stores, and restores a key pair with password', async () => {
    const ks = new LocalStorageKeyStore();
    const kp = await generateKeyPair();
    await ks.storeKeyPair('alice', kp, 'correct horse battery staple');

    const restored = await ks.getKeyPair('alice', 'correct horse battery staple');
    expect(restored).not.toBeNull();
    if (!restored) throw new Error('restored should not be null');
    expect(Buffer.from(restored.publicKey)).toEqual(Buffer.from(kp.publicKey));
    expect(Buffer.from(restored.privateKey)).toEqual(Buffer.from(kp.privateKey));
  });

  (hasWebCrypto ? it : it.skip)('fails to restore with wrong password', async () => {
    const ks = new LocalStorageKeyStore();
    const kp = await generateKeyPair();
    await ks.storeKeyPair('bob', kp, 'right-password');

    const wrong = await ks.getKeyPair('bob', 'wrong-password');
    expect(wrong).toBeNull();
  });

  (hasWebCrypto ? it : it.skip)('gets public key without password', async () => {
    const ks = new LocalStorageKeyStore();
    const kp = await generateKeyPair();
    await ks.storeKeyPair('charlie', kp, 'password');

    const publicKey = await ks.getPublicKey('charlie');
    expect(publicKey).not.toBeNull();
    if (!publicKey) throw new Error('publicKey should not be null');
    expect(Buffer.from(publicKey)).toEqual(Buffer.from(kp.publicKey));
  });

  (hasWebCrypto ? it : it.skip)('returns null for non-existent alias', async () => {
    const ks = new LocalStorageKeyStore();
    const publicKey = await ks.getPublicKey('nonexistent');
    expect(publicKey).toBeNull();
  });

  (hasWebCrypto ? it : it.skip)('unlocks to sessionStorage and locks removes it', async () => {
    const ks = new LocalStorageKeyStore();
    const kp = await generateKeyPair();
    await ks.storeKeyPair('dave', kp, 'pw');

    // Simulate unlock by decrypting and storing in sessionStorage
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
    const kp = await generateKeyPair();
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
});


