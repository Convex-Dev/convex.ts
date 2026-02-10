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
 * Transaction result
 */
export interface TransactionResult {
  hash: string;
  status: 'success' | 'error';
  error?: string;
  result?: any;
}

/**
 * Query parameters
 */
export interface Query {
  address?: string;
  source?: any;
}

/**
 * Query result
 */
export interface Result {
  value: string;
  errorCode?: string;
  info?: any;
} 