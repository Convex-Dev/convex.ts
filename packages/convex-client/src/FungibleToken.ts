import { AssetHandle } from './AssetHandle.js';
import type { AddressLike, BalanceLike, Result } from './types.js';
import { toAddress, formatBalance } from './format.js';

/**
 * Handle for interacting with CAD29 fungible tokens via `@convex.fungible/*`.
 * Extends AssetHandle with optimised fungible-specific operations.
 *
 * Created via `convex.fungible(tokenAddress)`. Handle creation is instant and local.
 *
 * Inherits `offer()` and `accept()` from AssetHandle (via `@convex.asset/*`).
 */
export class FungibleToken extends AssetHandle {
  /**
   * Query fungible token balance.
   * @param holder Address to check (defaults to own balance via *address*)
   */
  async balance(holder?: AddressLike): Promise<Result> {
    const addr = holder != null ? toAddress(holder) : '*address*';
    return this.client.query(
      `(@convex.fungible/balance ${toAddress(this.token)} ${addr})`
    );
  }

  /**
   * Transfer fungible tokens to another address.
   * @param to Destination address
   * @param amount Amount to transfer
   */
  async transfer(to: AddressLike, amount: BalanceLike): Promise<Result> {
    return this.client.transact(
      `(@convex.fungible/transfer ${toAddress(this.token)} ${toAddress(to)} ${formatBalance(amount)})`
    );
  }

  /**
   * Mint new tokens. Caller must have minting privileges.
   * @param amount Amount to mint
   */
  async mint(amount: BalanceLike): Promise<Result> {
    return this.client.transact(
      `(@convex.fungible/mint ${toAddress(this.token)} ${formatBalance(amount)})`
    );
  }

  /**
   * Burn tokens. Amount must not exceed caller's balance.
   * @param amount Amount to burn
   */
  async burn(amount: BalanceLike): Promise<Result> {
    return this.client.transact(
      `(@convex.fungible/burn ${toAddress(this.token)} ${formatBalance(amount)})`
    );
  }

  /**
   * Query total supply of this token.
   */
  async supply(): Promise<Result> {
    return this.client.query(
      `(@convex.fungible/total-supply ${toAddress(this.token)})`
    );
  }

  /**
   * Query decimal places for this token.
   */
  async decimals(): Promise<Result> {
    return this.client.query(
      `(@convex.fungible/decimals ${toAddress(this.token)})`
    );
  }
}
