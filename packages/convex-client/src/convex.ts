import {
  ClientOptions,
  AccountInfo,
  AddressLike,
  BalanceLike,
  Query,
  Result,
  Hex
} from './types.js';
import { KeyPair } from './KeyPair.js';
import { Signer } from './Signer.js';
import { KeyPairSigner } from './KeyPairSigner.js';
import { hexToBytes, bytesToHex } from './crypto.js';
import { toAddress, toNumericAddress, formatBalance, throwIfError } from './format.js';
import { AssetHandle } from './AssetHandle.js';
import { FungibleToken } from './FungibleToken.js';
import { CnsHandle } from './CnsHandle.js';
import { AccountHandle } from './AccountHandle.js';

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
  private address?: number;

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
   * Get the peer URL this client is connected to
   */
  getPeerUrl(): string {
    return this.peerUrl;
  }

  /**
   * Get the current account address, or undefined if not set
   */
  getAddress(): number | undefined {
    return this.address;
  }

  /**
   * Check whether this client has both an address and signer set
   * (i.e. is ready to submit transactions)
   */
  hasAccount(): boolean {
    return this.address !== undefined && this.signer !== undefined;
  }

  /**
   * Create a new account on the network with the given public key.
   *
   * This is a network operation only — it does not change the client's
   * signer or address. Call setAccount() afterwards if you want to use
   * the new account for transactions.
   *
   * @param accountKey Ed25519 public key — hex string, Uint8Array, or KeyPair
   *                   (only the public key is sent to the network)
   * @param faucet Optional faucet amount in coppers (e.g. 100000000 for 0.1 CVM)
   */
  async createAccount(accountKey: AccountKey, faucet?: number): Promise<AccountInfo> {
    const keyHex = accountKey instanceof KeyPair
      ? accountKey.publicKeyHex
      : typeof accountKey === 'string'
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
    const address = typeof rawAddress === 'number' ? rawAddress : Number(String(rawAddress).replace(/^#/, ''));

    if (!Number.isInteger(address) || address < 0) {
      throw new Error('Failed to create account: No valid address returned');
    }

    const balance = typeof data.balance === 'number' ? data.balance
      : typeof data.faucet === 'number' ? data.faucet : 0;

    return {
      address,
      balance,
      sequence: 0,
      publicKey: keyHex,
    };
  }

  /**
   * Request faucet funds for an existing account (testnets only).
   * @param address Account address to fund
   * @param amount Amount in coppers (e.g. 100000000)
   */
  async faucet(address: AddressLike, amount: number): Promise<Result> {
    const addr = toNumericAddress(address);
    const data = await this.request<Result>('/api/v1/faucet', {
      method: 'POST',
      body: JSON.stringify({ address: addr, amount }),
    });
    return data;
  }

  /**
   * Get current account information
   */
  async getAccountInfo(): Promise<AccountInfo> {
    if (this.address == null) {
      throw new Error('No account set. Call setAccount() or setAddress() first.');
    }

    const data = await this.request<Record<string, unknown>>(
      `/api/v1/accounts/${this.address}`,
      { method: 'GET' }
    );

    return {
      address: typeof data.address === 'number' ? data.address : this.address,
      balance: typeof data.balance === 'number' ? data.balance : 0,
      sequence: typeof data.sequence === 'number' ? data.sequence : 0,
      publicKey: typeof data.key === 'string' ? data.key
        : typeof data.publicKey === 'string' ? data.publicKey : '',
    };
  }

  /**
   * Submit a transaction using the two-step prepare/submit flow:
   * 1. POST /api/v1/transaction/prepare  { address, source }  -> { hash }
   * 2. Sign the hash with Ed25519
   * 3. POST /api/v1/transaction/submit   { hash, sig, accountKey }  -> result
   */
  private async submitTransaction(source: string): Promise<Result> {
    if (!this.signer || this.address == null) {
      throw new Error('No account set. Call setAccount() or setAddress() first.');
    }

    // Step 1: Prepare — get the transaction hash
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
    const result = await this.request<Result>('/api/v1/transaction/submit', {
      method: 'POST',
      body: JSON.stringify({ hash, sig: sigHex, accountKey }),
    });

    return throwIfError(result);
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
   * Set the address (account) for transactions.
   * Must be a numeric address — CNS names need to be resolved first.
   * @param address Account address (e.g., "#1678", "1678", or 1678)
   */
  setAddress(address: AddressLike): void {
    this.address = toNumericAddress(address);
  }

  /**
   * Set account with a signer (convenience method)
   * @param address Account address (e.g., "#1678", "1678", or 1678)
   * @param signer Signer or KeyPair instance
   */
  setAccount(address: AddressLike, signer: SignerLike): void {
    this.setSigner(signer);
    this.setAddress(address);
  }

  /**
   * Submit a transaction to the network.
   * Throws ConvexError on CVM/peer errors.
   * @param source Convex Lisp code string to execute
   */
  async transact(source: string): Promise<Result> {
    return this.submitTransaction(source);
  }

  /**
   * Query the native CVM coin balance.
   * Throws ConvexError on CVM/peer errors.
   * @param holder Optional address to query (defaults to own balance)
   */
  async balance(holder?: AddressLike): Promise<Result> {
    const source = holder != null
      ? `(balance ${toAddress(holder)})`
      : '*balance*';
    return this.query(source);
  }

  /**
   * Transfer native CVM coins to another address.
   * Throws ConvexError on CVM/peer errors.
   * @param to Destination address (e.g., "#42", "42", 42, or "@user.name")
   * @param amount Amount in coppers
   */
  async transfer(to: AddressLike, amount: BalanceLike): Promise<Result> {
    return this.transact(`(transfer ${toAddress(to)} ${formatBalance(amount)})`);
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
   * @returns Signer instance, or undefined if not set
   */
  getSigner(): Signer | undefined {
    return this.signer;
  }

  /**
   * Execute a read-only query on the network (free, no signing required).
   * Throws ConvexError on CVM/peer errors.
   * @param query Query parameters or Convex Lisp source string
   */
  async query(query: Query | string): Promise<Result> {
    const queryParams = typeof query === 'string'
      ? { source: query, ...(this.address != null && { address: this.address }) }
      : {
          source: query.source,
          address: query.address != null ? toNumericAddress(query.address) : this.address,
        };

    // Strip undefined address to keep payload clean
    if (queryParams.address == null) delete queryParams.address;

    const result = await this.request<Result>('/api/v1/query', {
      method: 'POST',
      body: JSON.stringify(queryParams),
    });

    return throwIfError(result);
  }

  // -- Handle factories -------------------------------------------------------

  /**
   * Create a generic asset handle for any asset type.
   * @param token Asset/token address
   */
  asset(token: AddressLike): AssetHandle {
    return new AssetHandle(this, token);
  }

  /**
   * Create a CAD29 fungible token handle.
   * @param token Fungible token address
   */
  fungible(token: AddressLike): FungibleToken {
    return new FungibleToken(this, token);
  }

  /**
   * Create a CNS (Convex Name System) handle.
   * @param name CNS dotted path without @ prefix (e.g. "convex.core", "user.mike")
   */
  cns(name: string): CnsHandle {
    return new CnsHandle(this, name);
  }

  /**
   * Create an account handle for querying and managing a Convex account.
   * @param address Account address (e.g. "#13", 13, or "@user.mike")
   */
  account(address: AddressLike): AccountHandle {
    return new AccountHandle(this, address);
  }
}
