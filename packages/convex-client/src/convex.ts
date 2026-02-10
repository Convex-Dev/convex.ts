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
 * Type that accepts Signer, KeyPair class, or plain object
 */
type SignerLike = Signer | KeyPair | IKeyPair;

/**
 * Main class for interacting with the Convex network
 */
export class Convex {
  private readonly http: AxiosInstance;
  private signer?: Signer;
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
      // Generate new key pair and set as signer
      const keyPair = await KeyPair.generate();
      this.signer = new KeyPairSigner(keyPair);

      const publicKey = await this.signer.getPublicKey();
      const response = await this.http.post('/api/v1/account/create', {
        address: this.address,
        publicKey,
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
    if (!this.signer || !this.accountInfo) {
      throw new Error('No account set. Call useAccount() or useAddress() first.');
    }

    try {
      // Prepare transaction data
      const txData = {
        ...tx,
        from: this.accountInfo.address,
        sequence: tx.sequence || this.accountInfo.sequence
      };

      // Sign the transaction with the specific public key for this account
      const message = JSON.stringify(txData);
      const messageBytes = hexToBytes(message);
      const signature = await this.signer.signFor(messageBytes, this.accountInfo.publicKey);

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
   * @param signer Signer, KeyPair, or plain key pair object
   */
  async setSigner(signer: SignerLike): Promise<void> {
    // Convert to Signer if needed
    if ('sign' in signer && 'getPublicKey' in signer) {
      // Already a Signer
      this.signer = signer;
    } else if (signer instanceof KeyPair) {
      // Convert KeyPair to KeyPairSigner
      this.signer = new KeyPairSigner(signer);
    } else {
      // Plain object - convert to KeyPair then to Signer
      const keyPair = await KeyPair.fromPrivateKey(signer.privateKey);
      this.signer = new KeyPairSigner(keyPair);
    }
  }

  /**
   * Use a specific address (account) for transactions
   * Requires a signer to be set first via setSigner()
   * @param address Account address (e.g., "#1678")
   */
  async useAddress(address: string): Promise<void> {
    if (!this.signer) {
      throw new Error('No signer set. Call setSigner() first.');
    }

    this.address = address;
    const publicKey = await this.signer.getPublicKey();
    this.accountInfo = {
      address,
      balance: 0,
      sequence: 0,
      publicKey: Buffer.from(publicKey).toString('hex')
    };
  }

  /**
   * Use an existing account with a signer (convenience method)
   * @param address Account address (e.g., "#1678")
   * @param signer Signer, KeyPair, or plain key pair object
   */
  async useAccount(address: string, signer: SignerLike): Promise<void> {
    await this.setSigner(signer);
    await this.useAddress(address);
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