import { KeyStore, encryptData, decryptData } from './keystore.js';
import { KeyPair } from './KeyPair.js';

type StoredRecord = {
  publicKey: number[];
  iv: number[];
  salt: number[];
  encryptedPrivateKey: number[];
  iterations?: number;
};

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let same = 0;
  for (let i = 0; i < a.length; i++) same |= a[i] ^ b[i];
  return same === 0;
}

/**
 * In-memory keystore for Node.js, CLI tools, testing, and SSR.
 *
 * Stores key pairs encrypted with AES-GCM in memory (same encryption
 * as LocalStorageKeyStore). Keys are lost when the instance is garbage
 * collected or the process exits.
 *
 * Requires Web Crypto API (Node.js 18+, all modern browsers, Deno, Bun).
 */
export class MemoryKeyStore extends KeyStore {
  private store = new Map<string, StoredRecord>();
  private session = new Map<string, { publicKey: number[]; privateKey: number[] }>();

  async storeKeyPair(alias: string, keyPair: KeyPair, password: string): Promise<void> {
    const { iv, ciphertext, salt, iterations } = await encryptData(keyPair.privateKey, password);
    this.store.set(alias, {
      publicKey: Array.from(keyPair.publicKey),
      iv: Array.from(iv),
      salt: Array.from(salt),
      encryptedPrivateKey: Array.from(ciphertext),
      iterations,
    });
  }

  async getKeyPair(alias: string, password: string): Promise<KeyPair | null> {
    const record = this.store.get(alias);
    if (!record) return null;
    try {
      const seed = await decryptData(
        new Uint8Array(record.encryptedPrivateKey),
        new Uint8Array(record.iv),
        password,
        new Uint8Array(record.salt),
        record.iterations ?? 100_000,
      );
      return KeyPair.fromSeed(seed);
    } catch {
      return null;
    }
  }

  async listAliases(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  async deleteKeyPair(alias: string): Promise<void> {
    this.store.delete(alias);
    this.session.delete(alias);
  }

  getPublicKey(alias: string): Uint8Array | null {
    const record = this.store.get(alias);
    if (!record) return null;
    return new Uint8Array(record.publicKey);
  }

  storeUnlockedKeyPair(alias: string, keyPair: KeyPair): void {
    this.session.set(alias, {
      publicKey: Array.from(keyPair.publicKey),
      privateKey: Array.from(keyPair.privateKey),
    });
  }

  getUnlockedKeyPair(alias: string): KeyPair | null;
  getUnlockedKeyPair(publicKey: Uint8Array): KeyPair | null;
  getUnlockedKeyPair(aliasOrPublicKey: string | Uint8Array): KeyPair | null {
    if (typeof aliasOrPublicKey === 'string') {
      const entry = this.session.get(aliasOrPublicKey);
      if (!entry) return null;
      return KeyPair.fromSeed(new Uint8Array(entry.privateKey));
    }
    const target = aliasOrPublicKey;
    for (const entry of this.session.values()) {
      if (bytesEqual(new Uint8Array(entry.publicKey), target)) {
        return KeyPair.fromSeed(new Uint8Array(entry.privateKey));
      }
    }
    return null;
  }

  async unlock(alias: string, password: string): Promise<KeyPair | null> {
    const kp = await this.getKeyPair(alias, password);
    if (kp) this.storeUnlockedKeyPair(alias, kp);
    return kp;
  }

  lock(alias: string): void {
    this.removeUnlockedKeyPair(alias);
  }

  isUnlocked(alias: string): boolean;
  isUnlocked(publicKey: Uint8Array): boolean;
  isUnlocked(aliasOrPublicKey: string | Uint8Array): boolean {
    return this.getUnlockedKeyPair(aliasOrPublicKey as any) !== null;
  }

  removeUnlockedKeyPair(alias: string): void {
    this.session.delete(alias);
  }

  getUnlockedAliases(): string[] {
    return Array.from(this.session.keys());
  }

  clearUnlockedKeyPairs(): void {
    this.session.clear();
  }
}
