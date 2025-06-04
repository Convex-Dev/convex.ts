import axios, { AxiosInstance } from 'axios';
import {
  ClientOptions,
  KeyPair,
  AccountInfo,
  Transaction,
  TransactionResult,
  Query,
  QueryResult
} from './types';
import { generateKeyPair, sign, publicKeyToAddress } from './crypto';

/**
 * Main class for interacting with the Convex network
 */
export class Convex {
  private readonly http: AxiosInstance;
  private keyPair?: KeyPair;
  private accountInfo?: AccountInfo;

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
      const address = publicKeyToAddress(this.keyPair.publicKey);

      const response = await this.http.post('/api/v1/account/create', {
        address,
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
   * Get the current key pair
   */
  getKeyPair(): KeyPair {
    if (!this.keyPair) {
      throw new Error('No account created');
    }
    return this.keyPair;
  }

  /**
   * Execute a query on the network
   * @param query Query parameters
   */
  async query(query: Query): Promise<QueryResult> {
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