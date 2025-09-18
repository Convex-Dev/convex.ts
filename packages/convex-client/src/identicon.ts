import { hexToBytes } from './crypto.js';

type Bytes = Uint8Array;

function normalizeInput(input: Bytes | string): Bytes {
  if (typeof input === 'string') return hexToBytes(input);
  return input;
}

/**
 * Compute identicon color grid following the provided Java reference.
 * - Grid size defaults to 7.
 * - Returns an array of length size*size of 24-bit RGB ints (0xRRGGBB).
 */
export function generateIdenticonGrid(input: Bytes | string, size: number = 7): number[] {
  const data = normalizeInput(input);
  const n = data.length;
  const SIZE = size;
  const total = SIZE * SIZE;
  const grid: number[] = new Array(total).fill(0);

  if (n === 0) return grid; // all zeros if no data

  // Colors: last 12 bytes → 4 colors (RGB each), XOR with 0x800000 on red high bit like reference
  const cols = new Array<number>(4);
  for (let i = 0; i < 4; i++) {
    const r = 0xff & data[(n - 12 + i * 3 + 0) % n];
    const g = 0xff & data[(n - 12 + i * 3 + 1) % n];
    const b = 0xff & data[(n - 12 + i * 3 + 2) % n];
    const col = 0x800000 ^ ((r << 16) | (g << 8) | b);
    cols[i] = col;
  }

  // First bytes define bitmap, 2 bits per cell, mirrored horizontally
  const width = Math.floor((SIZE + 1) / 2);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x <= width; x++) {
      const i = x + y * width; // 4 2-bit segments per byte
      const byteIndex = Math.floor(i / 4);
      if (byteIndex >= n) break;
      const b = data[byteIndex];
      const shift = 2 * (3 - (i % 4));
      const bits = 0x03 & (b >> shift);
      const rgb = cols[bits] & 0xffffff;

      const leftIndex = y * SIZE + x;
      const rightIndex = y * SIZE + (SIZE - x - 1);
      if (leftIndex < total) grid[leftIndex] = rgb;
      if (rightIndex < total) grid[rightIndex] = rgb;
    }
  }

  return grid;
}


