import { useState, useEffect, type DependencyList } from 'react';
import type { Result } from '@convex-world/convex-ts';
import { useConvexContext } from './ConvexContext';

export interface UseQueryResult {
  data: Result | undefined;
  error: Error | undefined;
  isLoading: boolean;
}

/**
 * Reactive read-only query hook.
 *
 * Executes a Convex Lisp query and re-runs when:
 * - `source` changes
 * - any value in `deps` changes
 * - a transaction invalidates queries (via useTransact)
 *
 * Pass `null` or `undefined` as source to disable the query.
 *
 * @example
 * const { data, error, isLoading } = useQuery('*balance*');
 * const { data } = useQuery(`(balance #${address})`, [address]);
 * const { data } = useQuery(address ? `(balance #${address})` : null);
 */
export function useQuery(
  source: string | null | undefined,
  deps: DependencyList = [],
): UseQueryResult {
  const { client, invalidationKey } = useConvexContext();
  const [data, setData] = useState<Result | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(source != null);

  useEffect(() => {
    if (source == null) {
      setData(undefined);
      setError(undefined);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(undefined);

    client.query(source).then(
      (result) => {
        if (active) {
          setData(result);
          setIsLoading(false);
        }
      },
      (err) => {
        if (active) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setData(undefined);
          setIsLoading(false);
        }
      },
    );

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, source, invalidationKey, ...deps]);

  return { data, error, isLoading };
}
