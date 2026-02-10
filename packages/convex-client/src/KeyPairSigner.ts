import { Signer, type Hex } from './Signer.js';
import { KeyPair } from './KeyPair.js';
import { sign, hexToBytes, bytesToHex } from './crypto.js';

/**
 * Signer implementation that uses a local KeyPair
 *
 * This is the default signer for most use cases where you have
 * direct access to the private key.
 *
 * @example
 * ```typescript
 * const keyPair = await KeyPair.generate();
 * const signer = new KeyPairSigner(keyPair);
 *
 * // Use with Convex
 * convex.useAccount('#1678', signer);
 * ```
 */
export class KeyPairSigner implements Signer {
  constructor(private readonly keyPair: KeyPair) {}

  /**
   * Get the public key
   */
  async getPublicKey(): Promise<Uint8Array> {
    return this.keyPair.publicKey;
  }

  /**
   * Sign a message using the private key
   * @param message Message to sign
   * @returns Signature
   */
  async sign(message: Uint8Array): Promise<Uint8Array> {
    return await sign(message, this.keyPair.privateKey);
  }

  /**
   * Sign a message for a specific public key
   * For KeyPairSigner, this verifies the public key matches and signs.
   * @param message Message to sign
   * @param publicKey Public key (must match this signer's public key)
   * @returns Signature
   */
  async signFor(message: Uint8Array, publicKey: Hex): Promise<Uint8Array> {
    const pubBytes = hexToBytes(publicKey);
    const ourPubHex = bytesToHex(this.keyPair.publicKey);
    const theirPubHex = bytesToHex(pubBytes);

    if (ourPubHex !== theirPubHex) {
      throw new Error(
        `Public key mismatch: this signer manages ${ourPubHex.substring(0, 16)}... ` +
        `but was asked to sign for ${theirPubHex.substring(0, 16)}...`
      );
    }

    return await this.sign(message);
  }

  /**
   * Get the underlying KeyPair
   * Useful for exporting or displaying key information
   */
  getKeyPair(): KeyPair {
    return this.keyPair;
  }
}
