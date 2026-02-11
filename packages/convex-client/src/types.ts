import type { KeyPair } from './KeyPair.js';
import type { Signer } from './Signer.js';

/**
 * Client configuration options
 */
export interface ClientOptions {
  /** Optional timeout in milliseconds for network requests */
  timeout?: number;
  /** Optional headers to include in requests */
  headers?: Record<string, string>;
}

/**
 * Type that accepts either bytes or hex string
 */
export type Hex = Uint8Array | string;

/**
 * Type that accepts a public key in any common form:
 * hex string, raw bytes, or a KeyPair (from which only the public key is used).
 */
export type AccountKey = Hex | KeyPair;

/**
 * Type that accepts Signer or KeyPair class
 */
export type SignerLike = Signer | KeyPair;

/**
 * Convex account address. Accepts:
 * - number: `42`
 * - string with hash: `"#42"`
 * - plain numeric string: `"42"`
 * - CNS name: `"@convex.core"`, `"@user.mike"`
 */
export type AddressLike = string | number;

// Re-export for convenience
export type { KeyPair } from './KeyPair.js';

/**
 * Account information
 */
export interface AccountInfo {
  address: string;
  balance: number;
  sequence: number;
  publicKey: string;
}

/**
 * Info map returned with results.
 * Fields correspond to CVM Result :info keywords.
 */
export interface ResultInfo {
  /** Juice consumed by the transaction */
  juice?: number;
  /** Total fees paid */
  fees?: number;
  /** Memory used (delta) */
  mem?: number;
  /** Source of error (e.g. "CVM", "CLIENT", "COMM") */
  source?: string;
  /** Transaction hash */
  tx?: string;
  /** Stack trace (on error) */
  trace?: any;
  /** Error address */
  eaddr?: string;
  /** Source location [start, end] */
  loc?: number[];
}

/**
 * Result returned by queries and transactions.
 *
 * Mirrors the JSON representation of convex.core.Result:
 * - `value`     - JSON-converted CVM value (may lose type information)
 * - `result`    - CVM printed representation (string, more accurate than value)
 * - `errorCode` - Error keyword string (e.g. "NOBODY"), absent on success
 * - `info`      - Execution metadata (juice, fees, mem, trace, etc.)
 */
export interface Result {
  /** JSON-converted CVM value. Numbers, strings, booleans map directly; other types may lose fidelity. */
  value?: any;
  /** CVM printed representation of the result (e.g. "#42" for an address, "[1 2 3]" for a vector). More accurate than value. */
  result?: string;
  /** Error code keyword (e.g. "NOBODY", "FUNDS", "STATE"). Absent/undefined on success. */
  errorCode?: string;
  /** Execution info: juice consumed, fees, memory delta, trace, etc. */
  info?: ResultInfo;
}

/**
 * Query parameters for read-only queries.
 */
export interface Query {
  /** Convex Lisp source code to execute */
  source: string;
  /** Optional account address to query from (e.g. "#42", "42", or 42) */
  address?: AddressLike;
}
