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
import { Signer } from './Signer.js';
import { KeyPairSigner } from './KeyPairSigner.js';
import { generateKeyPair, sign, hexToBytes } from './crypto.js';

/**
 * Type that accepts Signer or KeyPair class
 */
type SignerLike = Signer | KeyPair;

/**
 * Main class for interacting with the Convex network
 */
export class Convex {
  private readonly http: AxiosInstance;
  private signer?: Signer;
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
   * Generates a new keypair and sets it as the signer
   * @param initialBalance Optional initial balance in copper coins
   */
  async createAccount(initialBalance?: number): Promise<AccountInfo> {
    try {
      // Generate new key pair and set as signer
      const keyPair = KeyPair.generate();
      this.setSigner(keyPair);

      const publicKey = this.signer!.getPublicKey();
      const response = await this.http.post('/api/v1/account/create', {
        address: this.address,
        publicKey,
        initialBalance
      });

      const accountInfo = response.data.account;

      if (!accountInfo) {
        throw new Error('Failed to create account: No account info returned');
      }

      // Set the returned address
      this.address = accountInfo.address;

      return accountInfo;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current account information
   */
  async getAccountInfo(): Promise<AccountInfo> {
    if (!this.address || !this.signer) {
      throw new Error('No account set. Call setAccount() first.');
    }

    try {
      const response = await this.http.get(`/api/v1/account/${this.address}`);
      const accountInfo = response.data;

      if (!accountInfo) {
        throw new Error('Failed to get account info: No data returned');
      }

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
    if (!this.signer || !this.address) {
      throw new Error('No account set. Call setAccount() or setAddress() first.');
    }

    try {
      // Get account info to get current sequence
      const accountInfo = await this.getAccountInfo();

      // Prepare transaction data
      const txData = {
        ...tx,
        from: this.address,
        sequence: tx.sequence || accountInfo.sequence
      };

      // Get public key from signer
      const publicKey = this.signer.getPublicKey();
      const publicKeyHex = Buffer.from(publicKey).toString('hex');

      // Sign the transaction with the specific public key for this account
      const message = JSON.stringify(txData);
      const messageBytes = hexToBytes(message);
      const signature = await this.signer.signFor(publicKeyHex, messageBytes);

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
   * Set the signer for this client
   * @param signer Signer or KeyPair instance
   */
  setSigner(signer: SignerLike): void {
    // Convert KeyPair to KeyPairSigner if needed
    this.signer = signer instanceof KeyPair
      ? new KeyPairSigner(signer)
      : signer;
  }

  /**
   * Set the address (account) for transactions
   * Requires a signer to be set first via setSigner()
   * @param address Account address (e.g., "#1678")
   */
  setAddress(address: string): void {
    if (!this.signer) {
      throw new Error('No signer set. Call setSigner() first.');
    }
    this.address = address;
  }

  /**
   * Set account with a signer (convenience method)
   * @param address Account address (e.g., "#1678")
   * @param signer Signer or KeyPair instance
   */
  setAccount(address: string, signer: SignerLike): void {
    this.setSigner(signer);
    this.setAddress(address);
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
   * Get the current signer
   * @returns Signer instance
   */
  getSigner(): Signer {
    if (!this.signer) {
      throw new Error('No signer set');
    }
    return this.signer;
  }

  /**
   * Get the current key pair (only works if using KeyPairSigner)
   * @returns KeyPair instance
   * @deprecated Use getSigner() instead for more flexibility
   */
  getKeyPair(): KeyPair {
    if (!this.signer) {
      throw new Error('No signer set');
    }
    if (!(this.signer instanceof KeyPairSigner)) {
      throw new Error('Current signer is not a KeyPairSigner. Use getSigner() instead.');
    }
    return this.signer.getKeyPair();
  }

  /**
   * Execute a query on the network
   * @param query Query parameters or Convex Lisp source string
   */
  async query(query: Query | string): Promise<Result> {
    try {
      const queryParams = typeof query === 'string'
        ? { source: query }
        : query;
      const response = await this.http.post('/api/v1/query', queryParams);
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