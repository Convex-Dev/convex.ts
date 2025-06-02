/**
 * Options for configuring the Convex client
 */
export interface ClientOptions {
  /** Optional timeout in milliseconds for network requests */
  timeout?: number;
  /** Optional headers to include in requests */
  headers?: Record<string, string>;
}

/**
 * Represents a cryptographic key pair
 */
export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Account information
 */
export interface AccountInfo {
  address: string;
  balance: number;
  sequence: number;
}

/**
 * Transaction request
 */
export interface Transaction {
  from: string;
  to?: string;
  amount?: number;
  data?: any;
  sequence?: number;
}

/**
 * Result of a transaction submission
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
  type: string;
  params?: any;
}

/**
 * Query result
 */
export interface QueryResult {
  status: 'success' | 'error';
  data?: any;
  error?: string;
} 