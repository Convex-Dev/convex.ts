import { useState, useCallback } from 'react';
import type { Result } from '@convex-world/convex-ts';
import { useConvexContext } from './ConvexContext';

export interface UseTransactResult {
  transact: (source: string) => Promise<Result>;
  data: Result | undefined;
  error: Error | undefined;
  isLoading: boolean;
}

/**
 * Transaction hook with automatic query invalidation.
 *
 * Returns a `transact` function that submits Convex Lisp code
 * as a signed transaction. On success, all `useQuery` hooks
 * automatically refetch.
 *
 * @example
 * const { transact, data, error, isLoading } = useTransact();
 * await transact('(transfer #42 1000)');
 */
export function useTransact(): UseTransactResult {
  const { client, invalidateQueries } = useConvexContext();
  const [data, setData] = useState<Result | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const transact = useCallback(async (source: string): Promise<Result> => {
    setIsLoading(true);
    setError(undefined);
    try {
      const result = await client.transact(source);
      setData(result);
      invalidateQueries();
      return result;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [client, invalidateQueries]);

  return { transact, data, error, isLoading };
}
