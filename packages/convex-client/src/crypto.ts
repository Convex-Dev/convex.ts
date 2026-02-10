import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
ed.etc.sha512Sync = (data: Uint8Array): Uint8Array => sha512(data);
import { type IKeyPair, type Hex } from './types.js';

type Bytes = Uint8Array;

/** Helper function to convert Uint8Array to hex string */ 
export function bytesToHex(bytes: Bytes): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const C = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 } as const; // ASCII characters
function charValue(ch: number): number | undefined {
  if (ch >= C._0 && ch <= C._9) return ch - C._0; // '2' => 50-48
  if (ch >= C.A && ch <= C.F) return ch - (C.A - 10); // 'B' => 66-(65-10)
  if (ch >= C.a && ch <= C.f) return ch - (C.a - 10); // 'b' => 98-(97-10)
  return;
}

/** Helper function to convert hex string or Uint8Array to Uint8Array */
export function hexToBytes(input: Hex): Uint8Array {
  if (typeof input === 'string') {
    if (input.startsWith('0x')) input = input.substring(2)
    if (input.length % 2 !== 0) {
      throw new Error('Invalid hex string: length must be even: ' + input);
    }
    const bytes = new Uint8Array(input.length / 2);
    for (let i = 0; i < input.length; i += 2) {
      const n1 = charValue(input.charCodeAt(i)); // parse first char, multiply it by 16
      const n2 = charValue(input.charCodeAt(i + 1)); // parse second char
      if (n1 === undefined || n2 === undefined)
        throw new Error('Invalid hex string: unrecognised character');
      bytes[i / 2] = n1 * 16 + n2; // example: 'A9' => 10*16 + 9
    }
    return bytes;
  }
  return input; // Already a Uint8Array
}

/**
 * Generate a new Ed25519 key pair
 * @deprecated Use KeyPair.generate() instead
 */
export function generateKeyPair(): IKeyPair {
  const seed = ed.utils.randomPrivateKey();
  const publicKey = ed.getPublicKey(seed);

  return {
    privateKey: seed,
    publicKey
  };
}

/**
 * Generate an Ed25519 key pair from a seed
 * @deprecated Use KeyPair.fromSeed() instead
 */
export function generateKeyPairFromSeed(seed: Uint8Array): IKeyPair {
  if (seed.length !== 32) {
    throw new Error('Seed must be exactly 32 bytes');
  }

  const publicKey = ed.getPublicKey(seed);

  return {
    privateKey: seed,
    publicKey
  };
}

/** 
 * Sign a message with a private key
 * @param message Message to sign
 * @param privateKey Private key as Uint8Array
 */
export async function sign(message: Hex, privateKey: Uint8Array): Promise<Bytes> {
  const messageBytes = hexToBytes(message);
  const signature = await ed.sign(messageBytes, privateKey);
  return signature;
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
  publicKey: Hex
): Promise<boolean> {
  const signatureBytes = hexToBytes(signature);
  const messageBytes = hexToBytes(message);
  const publicBytes = hexToBytes(publicKey);
  
  return await ed.verify(signatureBytes, messageBytes, publicBytes);
}
