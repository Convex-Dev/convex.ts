import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
ed.etc.sha512Sync = (data: Uint8Array): Uint8Array => sha512(data);
import { hexToBytes, bytesToHex } from './crypto.js';
import type { Hex } from './types.js';

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
 * // From private key (public key is derived)
 * const keyPair = await KeyPair.fromPrivateKey('abcd1234...');
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
   * Private constructor - use static factory methods instead
   * This ensures the public key always matches the private key
   *
   * @param privateKey Private key as Uint8Array (32 bytes)
   * @param publicKey Public key as Uint8Array (32 bytes)
   */
  private constructor(privateKey: Uint8Array, publicKey: Uint8Array) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;

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
   * Create a KeyPair from a private key (public key is derived)
   *
   * @param privateKey Private key as Uint8Array or hex string (32 bytes)
   * @returns KeyPair with derived public key
   * @example
   * ```typescript
   * const keyPair = await KeyPair.fromPrivateKey('abcd1234...');
   * ```
   */
  static async fromPrivateKey(privateKey: Hex): Promise<KeyPair> {
    const privBytes = hexToBytes(privateKey);
    if (privBytes.length !== 32) {
      throw new Error('Private key must be exactly 32 bytes');
    }

    const publicKey = await ed.getPublicKey(privBytes);
    return new KeyPair(privBytes, publicKey);
  }

  /**
   * Generate a key pair from a 32-byte seed (deterministic)
   *
   * In Ed25519, the seed IS the private key, so this is an alias for fromPrivateKey.
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
    return KeyPair.fromPrivateKey(seed);
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
