import { useState, useEffect, useCallback } from 'react';
import { useConvexContext } from './ConvexContext';

export interface UseAccountResult {
  address: number | undefined;
  balance: number | undefined;
  sequence: number | undefined;
  publicKey: string | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

/**
 * Account info hook.
 *
 * Reads the current account address from the Convex client and
 * fetches balance, sequence, and public key. Re-fetches when
 * queries are invalidated (e.g. after a transaction).
 *
 * Returns all fields as `undefined` if no address is set on the client.
 *
 * @example
 * const { address, balance, isLoading, refetch } = useAccount();
 */
export function useAccount(): UseAccountResult {
  const { client, invalidationKey } = useConvexContext();
  const address = client.getAddress();

  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [sequence, setSequence] = useState<number | undefined>(undefined);
  const [publicKey, setPublicKey] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(address != null);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => setRefetchKey(k => k + 1), []);

  useEffect(() => {
    if (address == null) {
      setBalance(undefined);
      setSequence(undefined);
      setPublicKey(undefined);
      setIsLoading(false);
      setError(undefined);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(undefined);

    client.getAccountInfo().then(
      (info) => {
        if (active) {
          setBalance(info.balance);
          setSequence(info.sequence);
          setPublicKey(info.publicKey);
          setIsLoading(false);
        }
      },
      (err) => {
        if (active) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      },
    );

    return () => { active = false; };
  }, [client, address, invalidationKey, refetchKey]);

  return { address, balance, sequence, publicKey, isLoading, error, refetch };
}
