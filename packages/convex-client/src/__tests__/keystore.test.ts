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
});


