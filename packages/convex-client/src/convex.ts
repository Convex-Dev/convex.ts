import axios, { AxiosInstance } from 'axios';
import {
  ClientOptions,
  IKeyPair,
  AccountInfo,
  Transaction,
  TransactionResult,
  Query,
  Result
} from './types.js';
import { KeyPair } from './KeyPair.js';
import { generateKeyPair, sign } from './crypto.js';

/**
 * Type that accepts either KeyPair class or plain object
 */
type KeyPairLike = KeyPair | IKeyPair;

/**
 * Main class for interacting with the Convex network
 */
export class Convex {
  private readonly http: AxiosInstance;
  private keyPair?: IKeyPair;
  private accountInfo?: AccountInfo;
  private address?: string

  /**
   * Create a new Convex instance
   * @param peerUrl The URL of the Convex peer to connect to
   * @param options Optional client configuration
   */
  constructor(private readonly peerUrl: string, options: ClientOptions = {}) {
    this.http = axios.create({
      baseURL: peerUrl,
      timeout: options.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  /**
   * Create a new account with optional initial balance
   * @param initialBalance Optional initial balance in copper coins
   */
  async createAccount(initialBalance?: number): Promise<AccountInfo> {
    try {
      // Generate new key pair
      this.keyPair = await generateKeyPair();

      const response = await this.http.post('/api/v1/account/create', {
        address: this.address,
        publicKey: this.keyPair.publicKey,
        initialBalance
      });

      this.accountInfo = response.data.account;

      if (!this.accountInfo) {
        throw new Error('Failed to create account: No account info returned');
      }

      return this.accountInfo;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current account information
   */
  async getAccountInfo(): Promise<AccountInfo> {
    if (!this.accountInfo) {
      throw new Error('No account created');
    }

    try {
      const response = await this.http.get(`/api/v1/account/${this.accountInfo.address}`);
      const accountInfo = response.data;
      
      if (!accountInfo) {
        throw new Error('Failed to get account info: No data returned');
      }

      this.accountInfo = accountInfo;
      return accountInfo;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submit a transaction to the network
   * @param tx Transaction details
   */
  async submitTransaction(tx: Transaction): Promise<TransactionResult> {
    if (!this.keyPair || !this.accountInfo) {
      throw new Error('No account created');
    }

    try {
      // Prepare transaction data
      const txData = {
        ...tx,
        from: this.accountInfo.address,
        sequence: tx.sequence || this.accountInfo.sequence
      };

      // Sign the transaction
      const message = JSON.stringify(txData);
      const signature = await sign(message, this.keyPair.privateKey);

      // Submit signed transaction
      const response = await this.http.post('/api/v1/transaction', {
        ...txData,
        signature
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Use an existing account with a key pair
   * @param address Account address (e.g., "#1678")
   * @param keyPair Ed25519 key pair (KeyPair class or plain object)
   */
  useAccount(address: string, keyPair: KeyPairLike): void {
    this.address = address;
    // Convert KeyPair class to plain object if needed
    this.keyPair = keyPair instanceof KeyPair ? keyPair.toObject() : keyPair;
    this.accountInfo = {
      address,
      balance: 0,
      sequence: 0,
      publicKey: Buffer.from(this.keyPair.publicKey).toString('hex')
    };
  }

  /**
   * Submit a transaction to the network
   * @param tx Transaction details or Convex Lisp code string
   */
  async transact(tx: Transaction | string): Promise<TransactionResult> {
    if (typeof tx === 'string') {
      // Execute code string as transaction
      return this.submitTransaction({
        data: { code: tx }
      });
    }
    return this.submitTransaction(tx);
  }

  /**
   * Transfer coins to another address (convenience method)
   * @param to Destination address
   * @param amount Amount in copper coins
   */
  async transfer(to: string, amount: number): Promise<TransactionResult> {
    return this.transact({ to, amount });
  }

  /**
   * Get the current transaction sequence number
   * @returns Current sequence number
   */
  async getSequence(): Promise<number> {
    const info = await this.getAccountInfo();
    return info.sequence;
  }

  /**
   * Set the request timeout
   * @param timeout Timeout in milliseconds
   */
  setTimeout(timeout: number): void {
    this.http.defaults.timeout = timeout;
  }

  /**
   * Get the current key pair
   * @returns KeyPair as plain object (for backward compatibility)
   */
  getKeyPair(): IKeyPair {
    if (!this.keyPair) {
      throw new Error('No account created');
    }
    return this.keyPair;
  }

  /**
   * Execute a query on the network
   * @param query Query parameters
   */
  async query(query: Query): Promise<Result> {
    try {
      const response = await this.http.post('/api/v1/query', query);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message;
      return new Error(`Convex API Error: ${message}`);
    }
    return error;
  }
} 