import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
ed.etc.sha512Sync = (data: Uint8Array): Uint8Array => sha512(data);
import { hexToBytes, bytesToHex } from './crypto.js';

/**
 * Type that accepts either bytes or hex string
 */
export type Hex = Uint8Array | string;

/**
 * Ed25519 key pair for signing Convex transactions
 *
 * @example
 * ```typescript
 * // Generate new random key pair
 * const keyPair = await KeyPair.generate();
 *
 * // From seed (deterministic)
 * const seed = new Uint8Array(32);
 * const keyPair = await KeyPair.fromSeed(seed);
 *
 * // From hex strings
 * const keyPair = await KeyPair.fromHex({
 *   publicKey: 'abcd...',
 *   privateKey: '1234...'
 * });
 * ```
 */
export class KeyPair {
  /**
   * Private key (32 bytes)
   */
  readonly privateKey: Uint8Array;

  /**
   * Public key (32 bytes)
   */
  readonly publicKey: Uint8Array;

  /**
   * Create a KeyPair from raw bytes
   *
   * @param privateKey Private key as Uint8Array or hex string
   * @param publicKey Public key as Uint8Array or hex string
   */
  constructor(privateKey: Hex, publicKey: Hex) {
    this.privateKey = hexToBytes(privateKey);
    this.publicKey = hexToBytes(publicKey);

    // Validate sizes
    if (this.privateKey.length !== 32) {
      throw new Error('Private key must be exactly 32 bytes');
    }
    if (this.publicKey.length !== 32) {
      throw new Error('Public key must be exactly 32 bytes');
    }
  }

  /**
   * Generate a new random Ed25519 key pair
   *
   * @returns New KeyPair instance
   * @example
   * ```typescript
   * const keyPair = await KeyPair.generate();
   * console.log(keyPair.publicKeyHex);
   * ```
   */
  static async generate(): Promise<KeyPair> {
    const privateKey = ed.utils.randomPrivateKey();
    const publicKey = await ed.getPublicKey(privateKey);
    return new KeyPair(privateKey, publicKey);
  }

  /**
   * Generate a key pair from a 32-byte seed (deterministic)
   *
   * @param seed 32-byte seed as Uint8Array or hex string
   * @returns KeyPair derived from seed
   * @example
   * ```typescript
   * const seed = new Uint8Array(32); // Your seed bytes
   * const keyPair = await KeyPair.fromSeed(seed);
   *
   * // From hex seed
   * const keyPair = await KeyPair.fromSeed('0123456789abcdef...');
   * ```
   */
  static async fromSeed(seed: Hex): Promise<KeyPair> {
    const seedBytes = hexToBytes(seed);
    if (seedBytes.length !== 32) {
      throw new Error('Seed must be exactly 32 bytes');
    }

    const privateKey = seedBytes;
    const publicKey = await ed.getPublicKey(privateKey);
    return new KeyPair(privateKey, publicKey);
  }

  /**
   * Create a KeyPair from hex strings
   *
   * @param keys Object with publicKey and privateKey as hex strings
   * @returns KeyPair instance
   * @example
   * ```typescript
   * const keyPair = await KeyPair.fromHex({
   *   publicKey: 'abcd1234...',
   *   privateKey: '5678ef90...'
   * });
   * ```
   */
  static async fromHex(keys: {
    publicKey: string;
    privateKey: string;
  }): Promise<KeyPair> {
    return new KeyPair(keys.privateKey, keys.publicKey);
  }

  /**
   * Get the public key as a hex string
   */
  get publicKeyHex(): string {
    return bytesToHex(this.publicKey);
  }

  /**
   * Get the private key as a hex string
   *
   * ⚠️ Warning: Never expose private keys!
   */
  get privateKeyHex(): string {
    return bytesToHex(this.privateKey);
  }

  /**
   * Export as plain object (for JSON serialization or compatibility)
   *
   * ⚠️ Warning: This exposes the private key!
   */
  toObject(): { publicKey: Uint8Array; privateKey: Uint8Array } {
    return {
      publicKey: this.publicKey,
      privateKey: this.privateKey
    };
  }

  /**
   * Export as hex strings
   *
   * ⚠️ Warning: This exposes the private key!
   */
  toHex(): { publicKey: string; privateKey: string } {
    return {
      publicKey: this.publicKeyHex,
      privateKey: this.privateKeyHex
    };
  }

  /**
   * Convert to string representation (public key only for safety)
   */
  toString(): string {
    return `KeyPair { publicKey: ${this.publicKeyHex.substring(0, 16)}... }`;
  }
}

/**
 * Legacy interface for backward compatibility
 * Use KeyPair class instead
 */
export interface IKeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}
