import * as ed from '@noble/ed25519';
import { KeyPair } from './types';

/**
 * Generate a new Ed25519 key pair
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKey(privateKey);
  
  return {
    privateKey: Buffer.from(privateKey).toString('hex'),
    publicKey: Buffer.from(publicKey).toString('hex')
  };
}

/**
 * Sign a message with a private key
 * @param message Message to sign
 * @param privateKey Private key in hex format
 */
export async function sign(message: string | Uint8Array, privateKey: string): Promise<string> {
  const privateKeyBytes = Buffer.from(privateKey, 'hex');
  const messageBytes = typeof message === 'string' ? Buffer.from(message) : message;
  const signature = await ed.sign(messageBytes, privateKeyBytes);
  return Buffer.from(signature).toString('hex');
}

/**
 * Verify a signature
 * @param message Original message
 * @param signature Signature in hex format
 * @param publicKey Public key in hex format
 */
export async function verify(
  message: string | Uint8Array,
  signature: string,
  publicKey: string
): Promise<boolean> {
  const publicKeyBytes = Buffer.from(publicKey, 'hex');
  const signatureBytes = Buffer.from(signature, 'hex');
  const messageBytes = typeof message === 'string' ? Buffer.from(message) : message;
  
  return await ed.verify(signatureBytes, messageBytes, publicKeyBytes);
}

/**
 * Convert a public key to an address
 * @param publicKey Public key in hex format
 */
export function publicKeyToAddress(publicKey: string): string {
  // Simple address format: first 40 chars of public key
  // You might want to add a checksum or different format based on Convex requirements
  return publicKey.slice(0, 40);
} 