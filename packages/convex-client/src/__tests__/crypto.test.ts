import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';

import { sign, verify, hexToBytes, bytesToHex } from '../crypto.js';
import { KeyPair } from '../KeyPair.js';
import { sha512 as sha512_noble } from '@noble/hashes/sha2.js';
ed.etc.sha512Sync = (...m) => sha512_noble(ed.etc.concatBytes(...m));

describe('crypto', () => {
  it('generates a valid key pair', () => {
    const keyPair = KeyPair.generate();
    expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.privateKey.length).toBe(32);
    expect(keyPair.publicKey.length).toBe(32);
  });

  it('signs and verifies a message (round-trip)', async () => {
    const keyPair = KeyPair.generate();
    const message = 'cafebabe';
    const signature = await sign(message, keyPair.privateKey);
    const isValid = await verify(message, signature, keyPair.publicKey);
    expect(isValid).toBe(true);
  });

  it('fails verification with wrong public key', async () => {
    const keyPair1 = KeyPair.generate();
    const keyPair2 = KeyPair.generate();
    const message = 'deadbeef00';
    const signature = await sign(message, keyPair1.privateKey);
    const isValid = await verify(message, signature, keyPair2.publicKey);
    expect(isValid).toBe(false);
  });

  it('fails verification with tampered message', async () => {
    const keyPair = KeyPair.generate();
    const message = '78aa';
    const signature = await sign(message, keyPair.privateKey);
    const isValid = await verify('78ab', signature, keyPair.publicKey);
    expect(isValid).toBe(false);
  });

  it('fails verification with tampered signature', async () => {
    const keyPair = KeyPair.generate();
    const message = '12345678';
    const signature = await sign(message, keyPair.privateKey);
    // Tamper with the signature (flip a byte)
    let tamperedSig = new Uint8Array(signature);
    tamperedSig[0] = 255-tamperedSig[0];
    const isValid = await verify(message, tamperedSig, keyPair.publicKey);
    expect(isValid).toBe(false);
  });
});

describe('hexToBytes', () => {
  it('converts a valid hex string to Uint8Array', () => {
    expect(hexToBytes('00ff')).toEqual(new Uint8Array([0, 255]));
    expect(hexToBytes('cafebabe')).toEqual(new Uint8Array([0xca, 0xfe, 0xba, 0xbe]));
  });

  it('accepts hex strings with 0x prefix', () => {
    expect(hexToBytes('0x1234')).toEqual(new Uint8Array([0x12, 0x34]));
  });

  it('throws on odd-length hex strings', () => {
    expect(() => hexToBytes('abc')).toThrow('Invalid hex string: length must be even');
  });

  it('throws on invalid hex characters', () => {
    expect(() => hexToBytes('zz')).toThrow('Invalid hex string: unrecognised character');
    expect(() => hexToBytes('0x12xz')).toThrow('Invalid hex string: unrecognised character');
  });

  it('returns Uint8Array unchanged', () => {
    const arr = new Uint8Array([1, 2, 3]);
    expect(hexToBytes(arr)).toBe(arr);
  });
});

describe('bytesToHex', () => {
  it('converts Uint8Array to hex string', () => {
    expect(bytesToHex(new Uint8Array([0, 255]))).toBe('00ff');
    expect(bytesToHex(new Uint8Array([0xca, 0xfe, 0xba, 0xbe]))).toBe('cafebabe');
  });

  it('handles leading zeros', () => {
    expect(bytesToHex(new Uint8Array([0, 1, 2]))).toBe('000102');
  });

  it('returns empty string for empty array', () => {
    expect(bytesToHex(new Uint8Array([]))).toBe('');
  });
});

test('dummy test to ensure suite runs', () => {
  expect(true).toBe(true);
});
