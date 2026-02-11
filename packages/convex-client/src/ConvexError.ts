import type { Result, ResultInfo } from './types.js';

/**
 * Error thrown when a Convex operation returns a CVM or peer-level error.
 * Wraps the full Result so callers can inspect error details, juice consumed, trace, etc.
 */
export class ConvexError extends Error {
  constructor(public readonly result: Result) {
    super(`Convex error: ${result.errorCode}`);
    this.name = 'ConvexError';
  }

  /** Error code shortcut (e.g. "FUNDS", "NOBODY", "STATE", "LOAD") */
  get code(): string | undefined {
    return this.result.errorCode;
  }

  /** Execution info shortcut (juice, fees, trace, etc.) */
  get info(): ResultInfo | undefined {
    return this.result.info;
  }
}
