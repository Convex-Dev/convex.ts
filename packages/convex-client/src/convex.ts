import {
  ClientOptions,
  AccountInfo,
  Transaction,
  TransactionResult,
  Query,
  Result,
  Hex
} from './types.js';
import { KeyPair } from './KeyPair.js';
import { Signer } from './Signer.js';
import { KeyPairSigner } from './KeyPairSigner.js';
import { sign, hexToBytes, bytesToHex } from './crypto.js';

/**
 * Type that accepts Signer or KeyPair class
 */
type SignerLike = Signer | KeyPair;

/**
 * Main class for interacting with the Convex network.
 *
 * Uses the peer REST API at {peerUrl}/api/v1/...
 * See https://peer.convex.live/swagger for endpoint documentation.
 */
export class Convex {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private timeout: number;
  private signer?: Signer;
  private address?: string

  /**
   * Create a new Convex instance
   * @param peerUrl The URL of the Convex peer to connect to
   * @param options Optional client configuration
   */
  constructor(private readonly peerUrl: string, options: ClientOptions = {}) {
    this.baseUrl = peerUrl.replace(/\/$/, '');
    this.timeout = options.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };
  }

  /**
   * Internal fetch helper. Sends a request and returns parsed JSON.
   * Throws on HTTP errors with a descriptive message.
   */
  private async request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = { ...this.defaultHeaders, ...options.headers as Record<string, string> };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.errorMessage || data?.error || data?.title || `HTTP ${response.status}`;
      throw new Error(`Convex API Error: ${message}`);
    }

    return data as T;
  }

  /**
   * Create a new account on the network with the given public key.
   *
   * This is a network operation only — it does not change the client's
   * signer or address. Call setAccount() afterwards if you want to use
   * the new account for transactions.
   *
   * @param accountKey Ed25519 public key for the new account (hex string or Uint8Array)
   * @param faucet Optional faucet amount in coppers (e.g. 100000000 for 0.1 CVM)
   */
  async createAccount(accountKey: Hex, faucet?: number): Promise<AccountInfo> {
    const keyHex = typeof accountKey === 'string'
      ? accountKey.replace(/^0x/i, '')
      : bytesToHex(accountKey);

    const body: Record<string, unknown> = { accountKey: keyHex };
    if (faucet != null) {
      body.faucet = faucet;
    }

    const data = await this.request<Record<string, unknown>>('/api/v1/createAccount', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const rawAddress = data.address ?? data;
    const address = typeof rawAddress === 'number' ? String(rawAddress) : String(rawAddress || '');

    if (!address || !/^\d+$/.test(address.replace(/^#/, ''))) {
      throw new Error('Failed to create account: No valid address returned');
    }

    const balance = typeof data.balance === 'number' ? data.balance
      : typeof data.faucet === 'number' ? data.faucet : 0;

    return {
      address: address.replace(/^#/, ''),
      balance,
      sequence: 0,
      publicKey: keyHex,
    };
  }

  /**
   * Get current account information
   */
  async getAccountInfo(): Promise<AccountInfo> {
    if (!this.address) {
      throw new Error('No account set. Call setAccount() or setAddress() first.');
    }

    const data = await this.request<Record<string, unknown>>(
      `/api/v1/accounts/${encodeURIComponent(this.address)}`,
      { method: 'GET' }
    );

    return {
      address: String(data.address ?? this.address),
      balance: typeof data.balance === 'number' ? data.balance : 0,
      sequence: typeof data.sequence === 'number' ? data.sequence : 0,
      publicKey: typeof data.key === 'string' ? data.key
        : typeof data.publicKey === 'string' ? data.publicKey : '',
    };
  }

  /**
   * Submit a transaction using the two-step prepare/submit flow:
   * 1. POST /api/v1/transaction/prepare  { address, source }  → { hash }
   * 2. Sign the hash with Ed25519
   * 3. POST /api/v1/transaction/submit   { hash, sig, accountKey }  → result
   */
  async submitTransaction(tx: Transaction): Promise<TransactionResult> {
    if (!this.signer || !this.address) {
      throw new Error('No account set. Call setAccount() or setAddress() first.');
    }

    // Step 1: Prepare — get the transaction hash
    const source = tx.data?.code ?? JSON.stringify(tx);
    const prepareData = await this.request<Record<string, unknown>>('/api/v1/transaction/prepare', {
      method: 'POST',
      body: JSON.stringify({ address: this.address, source }),
    });

    const rawHash = prepareData.hash ?? prepareData.transactionHash;
    const hash = typeof rawHash === 'string' ? rawHash : String(rawHash ?? '').trim();
    if (!hash) {
      throw new Error('Prepare did not return a transaction hash');
    }

    // Step 2: Sign the hash
    const hashHex = hash.replace(/^0x/i, '');
    const hashBytes = hexToBytes(hashHex);
    const signature = await this.signer.sign(hashBytes);
    const sigHex = bytesToHex(signature);
    const accountKey = bytesToHex(this.signer.getPublicKey());

    // Step 3: Submit the signed transaction
    const result = await this.request<TransactionResult>('/api/v1/transaction/submit', {
      method: 'POST',
      body: JSON.stringify({ hash, sig: sigHex, accountKey }),
    });

    return result;
  }

  /**
   * Set the signer for this client
   * @param signer Signer or KeyPair instance
   */
  setSigner(signer: SignerLike): void {
    this.signer = signer instanceof KeyPair
      ? new KeyPairSigner(signer)
      : signer;
  }

  /**
   * Set the address (account) for transactions
   * @param address Account address (e.g., "#1678" or "1678")
   */
  setAddress(address: string): void {
    this.address = address.replace(/^#/, '');
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
      return this.submitTransaction({
        data: { code: tx }
      });
    }
    return this.submitTransaction(tx);
  }

  /**
   * Transfer coins to another address (convenience method)
   * @param to Destination address
   * @param amount Amount in coppers
   */
  async transfer(to: string, amount: number): Promise<TransactionResult> {
    return this.transact(`(transfer ${to} ${amount})`);
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
    this.timeout = timeout;
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
   * Execute a read-only query on the network (free, no signing required)
   * @param query Query parameters or Convex Lisp source string
   */
  async query(query: Query | string): Promise<Result> {
    const queryParams = typeof query === 'string'
      ? { source: query }
      : query;

    return this.request<Result>('/api/v1/query', {
      method: 'POST',
      body: JSON.stringify(queryParams),
    });
  }
}
