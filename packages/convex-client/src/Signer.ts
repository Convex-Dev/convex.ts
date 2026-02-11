import type { Hex } from './types.js';

/**
 * Abstract signer interface for signing Convex transactions
 *
 * Allows for different signing mechanisms:
 * - Local key pairs (KeyPairSigner)
 * - Hardware wallets (e.g., Ledger, Trezor)
 * - Browser extensions (e.g., MetaMask-style wallet)
 * - Remote signing services
 * - HSM (Hardware Security Module)
 * - Multi-key wallets (one signer, many keys)
 *
 * All methods are async to support external signers that require user interaction
 * or network calls.
 */
export interface Signer {
  /**
   * Get the default public key for this signer
   * For single-key signers, this is the only key.
   * For multi-key signers, this is the primary/default key.
   *
   * Public keys should be cached/precomputed, so this is synchronous.
   * @returns Public key as Uint8Array (32 bytes for Ed25519)
   */
  getPublicKey(): Uint8Array;

  /**
   * Sign a message with the default key (async - may require user interaction)
   * @param message Message to sign as Uint8Array
   * @returns Signature as Uint8Array (64 bytes for Ed25519)
   */
  sign(message: Uint8Array): Promise<Uint8Array>;

  /**
   * Sign a message with a specific public key (async - may require user interaction)
   * For single-key signers, publicKey should match getPublicKey().
   * For multi-key signers, this allows signing with any managed key.
   *
   * @param publicKey Public key to sign with (as Uint8Array or hex string)
   * @param message Message to sign as Uint8Array
   * @returns Signature as Uint8Array (64 bytes for Ed25519)
   */
  signFor(publicKey: Hex, message: Uint8Array): Promise<Uint8Array>;
}
