import * as ed from '@noble/ed25519';
import { KeyPair } from './types';

type Bytes = Uint8Array;
type Hex = Bytes | string;

// Helper function to convert Uint8Array to hex string
function bytesToHex(bytes: Bytes): string {
  return Array.from(bytes).map(b => b.toString(16)).join('');
}

// Helper function to convert hex string or Uint8Array to Uint8Array
function hexToBytes(input: Hex): Uint8Array {
  if (typeof input === 'string') {
    const bytes = new Uint8Array(input.length / 2);
    for (let i = 0; i < input.length; i += 2) {
      bytes[i / 2] = parseInt(input.substring(i, i + 2), 16);
    }
    return bytes;
  }
  return input; // Already a Uint8Array
}

/**
 * Generate a new Ed25519 key pair
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKey(privateKey);
  
  return {
    privateKey,
    publicKey
  };
}

/**
 * Sign a message with a private key
 * @param message Message to sign
 * @param privateKey Private key as Uint8Array
 */
export async function sign(message: Hex, privateKey: Uint8Array): Promise<string> {
  const messageBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message;
  const signature = await ed.sign(messageBytes, privateKey);
  return bytesToHex(signature);
}

/**
 * Verify a signature
 * @param message Original message
 * @param signature Signature in hex format
 * @param publicKey Public key as Uint8Array
 */
export async function verify(
  message: Hex,
  signature: Hex,
  publicKey: Uint8Array
): Promise<boolean> {
  const signatureBytes = hexToBytes(signature);
  const messageBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message;
  
  return await ed.verify(signatureBytes, messageBytes, publicKey);
}
