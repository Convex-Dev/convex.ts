import type { AddressLike, BalanceLike, Result } from './types.js';
import { ConvexError } from './ConvexError.js';

/**
 * Normalize an AddressLike to canonical Convex form for CVM source:
 * - Numeric: `"#42"` (with hash prefix)
 * - CNS: `"@convex.core"` (with @ prefix)
 * @throws Error if the input is not a valid Convex address
 */
export function toAddress(input: AddressLike): string {
  const s = String(input);
  // CNS address: @name.path
  if (s.startsWith('@')) {
    if (!/^@[a-zA-Z][a-zA-Z0-9._-]*$/.test(s)) {
      throw new Error(`Invalid CNS address: ${input}`);
    }
    return s;
  }
  // Numeric address: 42, #42, "42"
  const num = s.replace(/^#/, '');
  if (!/^\d+$/.test(num)) {
    throw new Error(`Invalid Convex address: ${input}`);
  }
  return `#${num}`;
}

/**
 * Parse an AddressLike to a numeric account address.
 * CNS addresses are not supported here — the REST API requires numeric addresses.
 * @throws Error if the input is not a numeric Convex address
 */
export function toNumericAddress(input: AddressLike): number {
  if (typeof input === 'number') {
    if (!Number.isInteger(input) || input < 0) {
      throw new Error(`Invalid Convex address: ${input}`);
    }
    return input;
  }
  const s = String(input).replace(/^#/, '');
  if (!/^\d+$/.test(s)) {
    throw new Error(`Numeric address required (got "${input}"). CNS names must be resolved first.`);
  }
  return Number(s);
}

/**
 * Validate a CNS name (dotted path without @ prefix).
 * @throws Error if the name is not a valid CNS path
 */
export function validateCnsName(name: string): void {
  if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(name)) {
    throw new Error(`Invalid CNS name: "${name}"`);
  }
}

/**
 * Format and validate a BalanceLike for CVM source.
 * Accepts number, bigint, or numeric string. Rejects negatives and non-integers.
 */
export function formatBalance(b: BalanceLike): string {
  if (typeof b === 'bigint') {
    if (b < 0n) throw new Error(`Negative amount: ${b}`);
    return b.toString();
  }
  if (typeof b === 'number') {
    if (!Number.isInteger(b) || b < 0) throw new Error(`Invalid amount: ${b}`);
    return String(b);
  }
  if (!/^\d+$/.test(b)) throw new Error(`Invalid amount: "${b}"`);
  return b;
}

/**
 * Format a generic asset quantity for CVM source.
 * number/bigint are formatted as integers; strings are passed through verbatim as raw CVM source.
 */
export function formatQuantity(q: number | bigint | string): string {
  if (typeof q === 'string') return q;
  if (typeof q === 'bigint') return q.toString();
  return String(q);
}

/**
 * Throw ConvexError if result has an errorCode, otherwise return the result.
 */
export function throwIfError(result: Result): Result {
  if (result.errorCode) {
    throw new ConvexError(result);
  }
  return result;
}
