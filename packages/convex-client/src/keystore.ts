import { KeyPair } from './KeyPair.js';

/** Derive an AES-GCM key from a password and salt using PBKDF2 */
async function deriveAesGcmKey(password: string, salt: Uint8Array, iterations: number = 100_000): Promise<CryptoKey> {
  const subtle = getSubtleOrThrow();
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return await subtle.deriveKey(
    { name: 'PBKDF2', salt: asBufferSource(salt), iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function getSubtleOrThrow(): SubtleCrypto {
  const subtle = (globalThis.crypto && globalThis.crypto.subtle) || (globalThis as any).msCrypto?.subtle;
  if (!subtle) throw new Error('Web Crypto API not available: crypto.subtle is undefined');
  return subtle;
}

/** Convert a Uint8Array to a BufferSource backed by a non-shared ArrayBuffer. */
function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/** Convert bytes to JSON-friendly number array */
function bytesToJsonArray(bytes: Uint8Array): number[] {
  return Array.from(bytes);
}

/** Convert JSON number array to Uint8Array */
function jsonArrayToBytes(arr: number[]): Uint8Array {
  return new Uint8Array(arr);
}

/** Constant-time-like byte comparison (loop-based, adequate here) */
function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let same = 0;
  for (let i = 0; i < a.length; i++) same |= a[i] ^ b[i];
  return same === 0;
}

export type EncryptedPayload = {
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
  iterations?: number;
};

/** Encrypt data with AES-GCM using password-derived key */
export async function encryptData(data: Uint8Array, password: string, iterations: number = 100_000): Promise<EncryptedPayload> {
  const subtle = getSubtleOrThrow();
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveAesGcmKey(password, salt, iterations);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await subtle.encrypt({ name: 'AES-GCM', iv: asBufferSource(iv) }, key, asBufferSource(data));
  return { salt, iv, ciphertext: new Uint8Array(encrypted), iterations };
}

/** Decrypt data with AES-GCM using password-derived key */
export async function decryptData(encryptedData: Uint8Array, iv: Uint8Array, password: string, salt: Uint8Array, iterations: number = 100_000): Promise<Uint8Array> {
  const subtle = getSubtleOrThrow();
  const key = await deriveAesGcmKey(password, salt, iterations);
  const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv: asBufferSource(iv) }, key, asBufferSource(encryptedData));
  return new Uint8Array(decrypted);
}

/** Abstract keystore API */
export abstract class KeyStore {
  abstract storeKeyPair(alias: string, keyPair: KeyPair, password: string): Promise<void>;
  abstract getKeyPair(alias: string, password: string): Promise<KeyPair | null>;
  abstract listAliases(): Promise<string[]>;
  abstract deleteKeyPair(alias: string): Promise<void>;
}

type StoredRecord = {
  publicKey: number[];
  iv: number[];
  salt: number[];
  encryptedPrivateKey: number[];
  iterations?: number;
};

/** Browser LocalStorage-backed keystore */
export class LocalStorageKeyStore extends KeyStore {
  private prefix = 'convex-keystore:';
  private sessionPrefix = 'convex-unlocked:';

  // ----- Internal storage helpers -----
  private readStoredRecord(alias: string): StoredRecord | null {
    const raw = localStorage.getItem(`${this.prefix}${alias}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredRecord;
    } catch {
      return null;
    }
  }

  private writeStoredRecord(alias: string, record: StoredRecord): void {
    localStorage.setItem(`${this.prefix}${alias}`, JSON.stringify(record));
  }

  private readSession(alias: string): { publicKey: number[]; privateKey: number[] } | null {
    const raw = sessionStorage.getItem(`${this.sessionPrefix}${alias}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { publicKey: number[]; privateKey: number[] };
    } catch {
      return null;
    }
  }

  async storeKeyPair(alias: string, keyPair: KeyPair, password: string): Promise<void> {
    const { iv, ciphertext, salt, iterations } = await encryptData(keyPair.privateKey, password);
    const data: StoredRecord = {
      publicKey: bytesToJsonArray(keyPair.publicKey),
      iv: bytesToJsonArray(iv),
      salt: bytesToJsonArray(salt),
      encryptedPrivateKey: bytesToJsonArray(ciphertext),
      iterations,
    };
    this.writeStoredRecord(alias, data);
  }

  async getKeyPair(alias: string, password: string): Promise<KeyPair | null> {
    const parsed = this.readStoredRecord(alias);
    if (!parsed) return null;
    const { publicKey, iv, salt, encryptedPrivateKey, iterations } = parsed;
    try {
      const seed = await decryptData(jsonArrayToBytes(encryptedPrivateKey), jsonArrayToBytes(iv), password, jsonArrayToBytes(salt), iterations ?? 100_000);
      return KeyPair.fromSeed(seed);
    } catch (e) {
      console.error('Decryption failed:', e);
      return null;
    }
  }

  async listAliases(): Promise<string[]> {
    const aliases: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(this.prefix)) aliases.push(key.substring(this.prefix.length));
    }
    return aliases;
  }

  async deleteKeyPair(alias: string): Promise<void> {
    localStorage.removeItem(`${this.prefix}${alias}`);
  }

  /**
   * Get the public key for a given alias (no password required)
   * @param alias The alias to look up
   * @returns The public key as Uint8Array, or null if not found
   */
  getPublicKey(alias: string): Uint8Array | null {
    const parsed = this.readStoredRecord(alias);
    if (!parsed) return null;
    return jsonArrayToBytes(parsed.publicKey);
  }

  /**
   * Store an unlocked key pair in session storage
   * @param alias The alias for the key pair
   * @param keyPair The unlocked key pair to store
   */
  storeUnlockedKeyPair(alias: string, keyPair: KeyPair): void {
    const data = {
      publicKey: Array.from(keyPair.publicKey),
      privateKey: Array.from(keyPair.privateKey),
    };
    sessionStorage.setItem(`${this.sessionPrefix}${alias}`, JSON.stringify(data));
  }

  /**
   * Get an unlocked key pair from session storage.
   *
   * Overloads:
   * - Provide an alias string to fetch by alias
   * - Provide a Uint8Array public key to fetch by public key
   *
   * @param alias The alias to look up (when string overload is used)
   * @returns The unlocked key pair, or null if not found
   */
  getUnlockedKeyPair(alias: string): Promise<KeyPair | null>;
  getUnlockedKeyPair(publicKey: Uint8Array): Promise<KeyPair | null>;
  async getUnlockedKeyPair(aliasOrPublicKey: string | Uint8Array): Promise<KeyPair | null> {
    // Lookup by alias
    if (typeof aliasOrPublicKey === 'string') {
      const parsed = this.readSession(aliasOrPublicKey);
      if (!parsed) return null;
      return KeyPair.fromSeed(jsonArrayToBytes(parsed.privateKey));
    }

    // Lookup by public key value
    const target = aliasOrPublicKey;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key || !key.startsWith(this.sessionPrefix)) continue;
      const parsed = this.readSession(key.substring(this.sessionPrefix.length));
      if (!parsed) continue;
      const storedPub = jsonArrayToBytes(parsed.publicKey);
      if (bytesEqual(storedPub, target)) {
        return KeyPair.fromSeed(jsonArrayToBytes(parsed.privateKey));
      }
    }
    return null;
  }

  /** Convenience: unlock by alias and password, store in session, and return the key pair. */
  async unlock(alias: string, password: string): Promise<KeyPair | null> {
    const kp = await this.getKeyPair(alias, password);
    if (kp) this.storeUnlockedKeyPair(alias, kp);
    return kp;
  }

  /** Convenience: lock by alias (removes from session). */
  lock(alias: string): void {
    this.removeUnlockedKeyPair(alias);
  }

  /** Check if a key is currently unlocked (by alias or public key). */
  isUnlocked(alias: string): Promise<boolean>;
  isUnlocked(publicKey: Uint8Array): Promise<boolean>;
  async isUnlocked(aliasOrPublicKey: string | Uint8Array): Promise<boolean> {
    const kp = await this.getUnlockedKeyPair(aliasOrPublicKey as any);
    return kp !== null;
  }

  /**
   * Remove an unlocked key pair from session storage
   * @param alias The alias to remove
   */
  removeUnlockedKeyPair(alias: string): void {
    sessionStorage.removeItem(`${this.sessionPrefix}${alias}`);
  }

  /**
   * Get all unlocked key pair aliases from session storage
   * @returns Array of aliases that are currently unlocked
   */
  getUnlockedAliases(): string[] {
    const aliases: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      if (key.startsWith(this.sessionPrefix)) {
        aliases.push(key.substring(this.sessionPrefix.length));
      }
    }
    return aliases;
  }

  /**
   * Clear all unlocked key pairs from session storage
   */
  clearUnlockedKeyPairs(): void {
    const aliases = this.getUnlockedAliases();
    aliases.forEach(alias => this.removeUnlockedKeyPair(alias));
  }
}


