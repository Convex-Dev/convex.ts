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
if (!(globalThis as any).crypto || !(globalThis as any).crypto.subtle) {
  try {
    const { webcrypto } = require('node:crypto');
    (globalThis as any).crypto = webcrypto;
  } catch {}
}
const hasWebCrypto = typeof globalThis.crypto !== 'undefined' && !!(globalThis as any).crypto?.subtle;

describe('LocalStorageKeyStore', () => {
  beforeEach(() => {
    // JSDOM provides localStorage in testEnvironment 'node' only if mocked; polyfill a simple version
    let store: Record<string, string> = {};
    (global as any).localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      key: (i: number) => Object.keys(store)[i] ?? null,
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
    expect(Buffer.from(restored!.publicKey)).toEqual(Buffer.from(kp.publicKey));
    expect(Buffer.from(restored!.privateKey)).toEqual(Buffer.from(kp.privateKey));
  });

  (hasWebCrypto ? it : it.skip)('fails to restore with wrong password', async () => {
    const ks = new LocalStorageKeyStore();
    const kp = await generateKeyPair();
    await ks.storeKeyPair('bob', kp, 'right-password');

    const wrong = await ks.getKeyPair('bob', 'wrong-password');
    expect(wrong).toBeNull();
  });
});


