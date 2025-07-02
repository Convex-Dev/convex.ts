import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

import { generateKeyPair, sign, verify, hexToBytes, bytesToHex } from '../crypto';

describe('Ed25519 test vector', () => {
  it('verifies a known signature for a known key and message', async () => {
    const privHex = '5398c3feb91e78fedb709bc2dbf2348a4f0f3e8ff2eff9ca372565abde66ce17';
    const pubHex = '120a9d0aa74688068be453b25fc7cf82f134f5231a7f8ff91a5ed4d72bdc85a5';
    const msg = 'Hello';
    const sigHex = '30b2caf9aa065295472795650183f644a61c2eca0de240e2da73fbbe4fcd2e7d4b3dff096730fa76556cad85e363ebfe308f2013c44dc41634f2435dbe4cb103';

    const priv = hexToBytes(privHex);
    const pub = hexToBytes(pubHex);
    const sig = hexToBytes(sigHex);
    const msgBytes = new TextEncoder().encode(msg);

    // Check signature verification
    const isValid = await verify(msgBytes, sig, pub);
    expect(isValid).toBe(true);

    // Optionally, check that signing with the private key produces the same signature
    // (Ed25519 is deterministic)
    const producedSig = await sign(msgBytes, priv);
    expect(bytesToHex(producedSig)).toBe(sigHex);
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