import type { Convex } from './convex.js';
import type { AddressLike, Result } from './types.js';
import { toAddress, validateCnsName } from './format.js';

/**
 * Handle for interacting with the Convex Name System (CNS) via `@convex.cns/*`.
 *
 * Created via `convex.cns("name.path")`. Handle creation is instant and local.
 * The name is a dotted path without the @ prefix.
 *
 * For simple resolution, `convex.query("@convex.core")` already works.
 * This handle is for programmatic CNS management (set, update, controller).
 */
export class CnsHandle {
  constructor(
    private readonly client: Convex,
    private readonly name: string,
  ) {
    validateCnsName(name);
  }

  /** Get the CNS name this handle is bound to */
  getName(): string {
    return this.name;
  }

  /**
   * Resolve this CNS name to its current value.
   */
  async resolve(): Promise<Result> {
    return this.client.query(
      `(@convex.cns/resolve '${this.name})`
    );
  }

  /**
   * Update the value for this CNS entry. Requires permission.
   * @param value CVM value to set (e.g. "#42" for an address)
   */
  async set(value: string): Promise<Result> {
    return this.client.transact(
      `(@convex.cns/update '${this.name} ${value})`
    );
  }

  /**
   * Change the controller for this CNS entry.
   * @param controller Address of new controller
   */
  async setController(controller: AddressLike): Promise<Result> {
    return this.client.transact(
      `(@convex.cns/control '${this.name} ${toAddress(controller)})`
    );
  }
}
