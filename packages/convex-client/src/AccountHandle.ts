import type { Convex } from './convex.js';
import type { AddressLike, Result } from './types.js';
import { toAddress, toNumericAddress } from './format.js';

/**
 * Handle for interacting with a Convex account.
 *
 * Created via `convex.account("#13")` or `convex.account("@user.mike")`.
 * Handle creation is instant and local — no network call.
 *
 * Read operations (balance, getSequence, getController, getKey) work for
 * any account.
 *
 * Write operations (setController, setKey) detect authority automatically:
 * - If the client's address matches the handle's address (key authority),
 *   executes directly as that account.
 * - Otherwise uses `eval-as` (controller authority) — the client must be
 *   the account's controller.
 */
export class AccountHandle {
  constructor(
    private readonly client: Convex,
    private readonly address: AddressLike,
  ) {}

  /** Get the address this handle is bound to */
  getAddress(): AddressLike {
    return this.address;
  }

  /**
   * Check whether the client's current address matches this handle's address.
   * Returns true for key authority (direct ops), false for controller path (eval-as).
   */
  private isOwnAccount(): boolean {
    const clientAddr = this.client.getAddress();
    if (clientAddr == null) return false;
    try {
      return clientAddr === toNumericAddress(this.address);
    } catch {
      return false; // CNS or unparseable → assume controller path
    }
  }

  /** Query the native CVM coin balance of this account */
  async balance(): Promise<Result> {
    return this.client.query(
      `(balance ${toAddress(this.address)})`,
    );
  }

  /** Query the current transaction sequence number */
  async getSequence(): Promise<Result> {
    return this.client.query(
      `(:sequence (account ${toAddress(this.address)}))`,
    );
  }

  /** Query the controller of this account (returns address or nil) */
  async getController(): Promise<Result> {
    return this.client.query(
      `(:controller (account ${toAddress(this.address)}))`,
    );
  }

  /**
   * Set the controller for this account.
   * Uses direct execution if the client IS this account, otherwise eval-as.
   * @param controller New controller address, or null to remove
   */
  async setController(controller: AddressLike | null): Promise<Result> {
    const ctrl = controller != null ? toAddress(controller) : 'nil';
    if (this.isOwnAccount()) {
      return this.client.transact(`(set-controller ${ctrl})`);
    }
    return this.client.transact(
      `(eval-as ${toAddress(this.address)} '(set-controller ${ctrl}))`,
    );
  }

  /** Query the public key associated with this account (returns blob or nil) */
  async getKey(): Promise<Result> {
    return this.client.query(
      `(:key (account ${toAddress(this.address)}))`,
    );
  }

  /**
   * Set the public key for this account.
   * Uses direct execution if the client IS this account, otherwise eval-as.
   * @param key Ed25519 public key as hex string (64 chars)
   */
  async setKey(key: string): Promise<Result> {
    const keyHex = `0x${key.replace(/^0x/i, '')}`;
    if (this.isOwnAccount()) {
      return this.client.transact(`(set-key ${keyHex})`);
    }
    return this.client.transact(
      `(eval-as ${toAddress(this.address)} '(set-key ${keyHex}))`,
    );
  }
}
