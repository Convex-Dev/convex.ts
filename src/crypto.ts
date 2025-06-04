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
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey)
  };
}

/**
 * Sign a message with a private key
 * @param message Message to sign
 * @param privateKey Private key in hex format
 */
export async function sign(message: Hex, privateKey: string): Promise<string> {
  const privateKeyBytes = hexToBytes(privateKey);
  const messageBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message;
  const signature = await ed.sign(messageBytes, privateKeyBytes);
  return bytesToHex(signature);
}

/**
 * Verify a signature
 * @param message Original message
 * @param signature Signature in hex format
 * @param publicKey Public key in hex format
 */
export async function verify(
  message: Hex,
  signature: Hex,
  publicKey: Hex
): Promise<boolean> {
  const publicKeyBytes = hexToBytes(publicKey);
  const signatureBytes = hexToBytes(signature);
  const messageBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message;
  
  return await ed.verify(signatureBytes, messageBytes, publicKeyBytes);
}
