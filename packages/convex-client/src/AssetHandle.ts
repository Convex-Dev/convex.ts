import type { Convex } from './convex.js';
import type { AddressLike, Result } from './types.js';
import { toAddress, formatQuantity } from './format.js';

/**
 * Handle for interacting with any asset via the generic `@convex.asset/*` library.
 * Works with fungible tokens, NFTs, multi-tokens, and any CVM asset type.
 *
 * Created via `convex.asset(tokenAddress)`. Handle creation is instant and local.
 */
export class AssetHandle {
  constructor(
    protected readonly client: Convex,
    protected readonly token: AddressLike,
  ) {}

  /** Get the token address this handle is bound to */
  getToken(): AddressLike {
    return this.token;
  }

  /**
   * Format a quantity for use in transaction CVM source.
   * number/bigint are safe; strings are sandboxed with (query ...) to prevent injection.
   */
  private fmtQ(quantity: number | bigint | string): string {
    if (typeof quantity === 'string') return `(query ${quantity})`;
    return formatQuantity(quantity);
  }

  /**
   * Query asset balance.
   * @param holder Address to check (defaults to own balance via *address*)
   */
  async balance(holder?: AddressLike): Promise<Result> {
    const addr = holder != null ? toAddress(holder) : '*address*';
    return this.client.query(
      `(@convex.asset/balance ${toAddress(this.token)} ${addr})`
    );
  }

  /**
   * Transfer asset to another address.
   * @param to Destination address
   * @param quantity Amount (number/bigint for fungible, string for raw CVM quantity)
   */
  async transfer(to: AddressLike, quantity: number | bigint | string): Promise<Result> {
    return this.client.transact(
      `(@convex.asset/transfer ${toAddress(to)} ${toAddress(this.token)} ${this.fmtQ(quantity)})`
    );
  }

  /**
   * Offer asset to another address for acceptance.
   * @param to Receiver address
   * @param quantity Amount to offer
   */
  async offer(to: AddressLike, quantity: number | bigint | string): Promise<Result> {
    return this.client.transact(
      `(@convex.asset/offer ${toAddress(to)} ${toAddress(this.token)} ${this.fmtQ(quantity)})`
    );
  }

  /**
   * Accept a previously offered asset from another address.
   * @param from Sender address
   * @param quantity Amount to accept
   */
  async accept(from: AddressLike, quantity: number | bigint | string): Promise<Result> {
    return this.client.transact(
      `(@convex.asset/accept ${toAddress(from)} ${toAddress(this.token)} ${this.fmtQ(quantity)})`
    );
  }

  /**
   * Query total supply of this asset.
   */
  async supply(): Promise<Result> {
    return this.client.query(
      `(@convex.asset/total-supply ${toAddress(this.token)})`
    );
  }
}
