/**
 * Client configuration options
 */
export interface ClientOptions {
  /** Optional timeout in milliseconds for network requests */
  timeout?: number;
  /** Optional headers to include in requests */
  headers?: Record<string, string>;
}

export type Address = Uint8Array;

/**
 * Type that accepts either bytes or hex string
 */
export type Hex = Uint8Array | string;

/**
 * Ed25519 key pair (legacy interface, use KeyPair class instead)
 * @deprecated Use KeyPair class from './KeyPair.js'
 */
export interface IKeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

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
 * Transaction parameters
 */
export interface Transaction {
  from?: string;
  to?: string;
  amount?: number;
  sequence?: number;
  data?: any;
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
 * - `value`     — JSON-converted CVM value (may lose type information)
 * - `result`    — CVM printed representation (string, more accurate than value)
 * - `errorCode` — Error keyword string (e.g. "NOBODY"), absent on success
 * - `info`      — Execution metadata (juice, fees, mem, trace, etc.)
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
 * Transaction result. Same shape as Result — transactions and queries
 * return the same JSON structure from the peer REST API.
 */
export type TransactionResult = Result;

/**
 * Query parameters
 */
export interface Query {
  address?: string;
  source?: any;
}
