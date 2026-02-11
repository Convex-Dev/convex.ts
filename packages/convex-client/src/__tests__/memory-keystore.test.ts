import { MemoryKeyStore } from '../MemoryKeyStore.js';
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
const test = hasWebCrypto ? it : it.skip;

describe('MemoryKeyStore', () => {
  test('generates, stores, and restores a key pair with password', async () => {
    const ks = new MemoryKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('alice', kp, 'correct horse battery staple');

    const restored = await ks.getKeyPair('alice', 'correct horse battery staple');
    expect(restored).not.toBeNull();
    expect(restored!.publicKeyHex).toBe(kp.publicKeyHex);
    expect(restored!.privateKeyHex).toBe(kp.privateKeyHex);
  });

  test('fails to restore with wrong password', async () => {
    const ks = new MemoryKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('bob', kp, 'right-password');

    const wrong = await ks.getKeyPair('bob', 'wrong-password');
    expect(wrong).toBeNull();
  });

  test('returns null for non-existent alias', async () => {
    const ks = new MemoryKeyStore();
    expect(await ks.getKeyPair('ghost', 'pw')).toBeNull();
    expect(ks.getPublicKey('ghost')).toBeNull();
  });

  test('gets public key without password', async () => {
    const ks = new MemoryKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('charlie', kp, 'pw');

    const pub = ks.getPublicKey('charlie');
    expect(pub).not.toBeNull();
    expect(Array.from(pub!)).toEqual(Array.from(kp.publicKey));
  });

  test('listAliases returns stored aliases', async () => {
    const ks = new MemoryKeyStore();
    const kp1 = KeyPair.generate();
    const kp2 = KeyPair.generate();
    const kp3 = KeyPair.generate();
    await ks.storeKeyPair('a', kp1, 'pw');
    await ks.storeKeyPair('b', kp2, 'pw');
    await ks.storeKeyPair('c', kp3, 'pw');

    const aliases = await ks.listAliases();
    expect(aliases.sort()).toEqual(['a', 'b', 'c']);
  });

  test('deleteKeyPair removes the key', async () => {
    const ks = new MemoryKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('dave', kp, 'pw');
    await ks.deleteKeyPair('dave');

    expect(await ks.getKeyPair('dave', 'pw')).toBeNull();
    expect(ks.getPublicKey('dave')).toBeNull();
    expect(await ks.listAliases()).toEqual([]);
  });

  test('deleteKeyPair also removes unlocked session', async () => {
    const ks = new MemoryKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('erin', kp, 'pw');
    await ks.unlock('erin', 'pw');
    expect(ks.isUnlocked('erin')).toBe(true);

    await ks.deleteKeyPair('erin');
    expect(ks.isUnlocked('erin')).toBe(false);
  });

  test('unlock stores in session and returns key pair', async () => {
    const ks = new MemoryKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('frank', kp, 'pw');

    const unlocked = await ks.unlock('frank', 'pw');
    expect(unlocked).not.toBeNull();
    expect(unlocked!.publicKeyHex).toBe(kp.publicKeyHex);
    expect(ks.isUnlocked('frank')).toBe(true);
  });

  test('unlock returns null for wrong password', async () => {
    const ks = new MemoryKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('grace', kp, 'pw');

    const result = await ks.unlock('grace', 'wrong');
    expect(result).toBeNull();
    expect(ks.isUnlocked('grace')).toBe(false);
  });

  test('lock removes from session', async () => {
    const ks = new MemoryKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('heidi', kp, 'pw');
    await ks.unlock('heidi', 'pw');
    expect(ks.isUnlocked('heidi')).toBe(true);

    ks.lock('heidi');
    expect(ks.isUnlocked('heidi')).toBe(false);
  });

  test('getUnlockedKeyPair by alias', async () => {
    const ks = new MemoryKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('ivan', kp, 'pw');
    await ks.unlock('ivan', 'pw');

    const retrieved = ks.getUnlockedKeyPair('ivan');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.publicKeyHex).toBe(kp.publicKeyHex);
  });

  test('getUnlockedKeyPair by public key', async () => {
    const ks = new MemoryKeyStore();
    const kp = KeyPair.generate();
    await ks.storeKeyPair('judy', kp, 'pw');
    await ks.unlock('judy', 'pw');

    const retrieved = ks.getUnlockedKeyPair(kp.publicKey);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.publicKeyHex).toBe(kp.publicKeyHex);
  });

  test('getUnlockedKeyPair returns null for unknown public key', () => {
    const ks = new MemoryKeyStore();
    const nonExistent = new Uint8Array([9, 8, 7, 6, 5, 4, 3, 2]);
    expect(ks.getUnlockedKeyPair(nonExistent)).toBeNull();
  });

  test('getUnlockedAliases returns all unlocked', async () => {
    const ks = new MemoryKeyStore();
    const kp1 = KeyPair.generate();
    const kp2 = KeyPair.generate();
    const kp3 = KeyPair.generate();
    await ks.storeKeyPair('a', kp1, 'pw');
    await ks.storeKeyPair('b', kp2, 'pw');
    await ks.storeKeyPair('c', kp3, 'pw');

    await ks.unlock('a', 'pw');
    await ks.unlock('c', 'pw');

    expect(ks.getUnlockedAliases().sort()).toEqual(['a', 'c']);
  });

  test('clearUnlockedKeyPairs clears all', async () => {
    const ks = new MemoryKeyStore();
    const kp1 = KeyPair.generate();
    const kp2 = KeyPair.generate();
    await ks.storeKeyPair('x', kp1, 'pw');
    await ks.storeKeyPair('y', kp2, 'pw');
    await ks.unlock('x', 'pw');
    await ks.unlock('y', 'pw');

    ks.clearUnlockedKeyPairs();
    expect(ks.getUnlockedAliases()).toEqual([]);
    expect(ks.isUnlocked('x')).toBe(false);
    expect(ks.isUnlocked('y')).toBe(false);
  });

  test('separate instances have independent stores', async () => {
    const ks1 = new MemoryKeyStore();
    const ks2 = new MemoryKeyStore();
    const kp = KeyPair.generate();
    await ks1.storeKeyPair('solo', kp, 'pw');

    expect(await ks1.listAliases()).toEqual(['solo']);
    expect(await ks2.listAliases()).toEqual([]);
    expect(ks2.getPublicKey('solo')).toBeNull();
  });
});
