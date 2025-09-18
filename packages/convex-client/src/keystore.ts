import { KeyPair } from './types.js';

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
    { name: 'PBKDF2', salt: salt as any, iterations, hash: 'SHA-256' },
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
  const encrypted = await subtle.encrypt({ name: 'AES-GCM', iv: iv as any }, key, data as any);
  return { salt, iv, ciphertext: new Uint8Array(encrypted), iterations };
}

/** Decrypt data with AES-GCM using password-derived key */
export async function decryptData(encryptedData: Uint8Array, iv: Uint8Array, password: string, salt: Uint8Array, iterations: number = 100_000): Promise<Uint8Array> {
  const subtle = getSubtleOrThrow();
  const key = await deriveAesGcmKey(password, salt, iterations);
  const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv: iv as any }, key, encryptedData as any);
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

  async storeKeyPair(alias: string, keyPair: KeyPair, password: string): Promise<void> {
    const { iv, ciphertext, salt, iterations } = await encryptData(keyPair.privateKey, password);
    const data: StoredRecord = {
      publicKey: Array.from(keyPair.publicKey),
      iv: Array.from(iv),
      salt: Array.from(salt),
      encryptedPrivateKey: Array.from(ciphertext),
      iterations,
    };
    localStorage.setItem(`${this.prefix}${alias}`, JSON.stringify(data));
  }

  async getKeyPair(alias: string, password: string): Promise<KeyPair | null> {
    const raw = localStorage.getItem(`${this.prefix}${alias}`);
    if (!raw) return null;
    const parsed: StoredRecord = JSON.parse(raw);
    const { publicKey, iv, salt, encryptedPrivateKey, iterations } = parsed;
    try {
      const priv = await decryptData(new Uint8Array(encryptedPrivateKey), new Uint8Array(iv), password, new Uint8Array(salt), iterations ?? 100_000);
      return { publicKey: new Uint8Array(publicKey), privateKey: priv };
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
  async getPublicKey(alias: string): Promise<Uint8Array | null> {
    const raw = localStorage.getItem(`${this.prefix}${alias}`);
    if (!raw) return null;
    try {
      const parsed: StoredRecord = JSON.parse(raw);
      return new Uint8Array(parsed.publicKey);
    } catch {
      return null;
    }
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
  getUnlockedKeyPair(alias: string): KeyPair | null;
  getUnlockedKeyPair(publicKey: Uint8Array): KeyPair | null;
  getUnlockedKeyPair(aliasOrPublicKey: string | Uint8Array): KeyPair | null {
    // Lookup by alias
    if (typeof aliasOrPublicKey === 'string') {
      const raw = sessionStorage.getItem(`${this.sessionPrefix}${aliasOrPublicKey}`);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return {
          publicKey: new Uint8Array(parsed.publicKey),
          privateKey: new Uint8Array(parsed.privateKey),
        };
      } catch {
        return null;
      }
    }

    // Lookup by public key value
    const target = aliasOrPublicKey;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key || !key.startsWith(this.sessionPrefix)) continue;
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const storedPub = new Uint8Array(parsed.publicKey);
        if (storedPub.length === target.length) {
          let equal = true;
          for (let j = 0; j < storedPub.length; j++) {
            if (storedPub[j] !== target[j]) { equal = false; break; }
          }
          if (equal) {
            return {
              publicKey: storedPub,
              privateKey: new Uint8Array(parsed.privateKey),
            };
          }
        }
      } catch {
        // ignore malformed entries
      }
    }
    return null;
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


