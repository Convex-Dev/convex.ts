import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { Convex, type ClientOptions } from '@convex-world/convex-ts';

export interface ConvexContextValue {
  client: Convex;
  invalidationKey: number;
  invalidateQueries: () => void;
}

const ConvexContext = createContext<ConvexContextValue | null>(null);

export interface ConvexProviderProps {
  url: string;
  options?: ClientOptions;
  children: React.ReactNode;
}

export function ConvexProvider({ url, options, children }: ConvexProviderProps) {
  const client = useMemo(() => new Convex(url, options), [url, options]);
  const [invalidationKey, setInvalidationKey] = useState(0);
  const invalidateQueries = useCallback(() => setInvalidationKey(k => k + 1), []);

  const value = useMemo(
    () => ({ client, invalidationKey, invalidateQueries }),
    [client, invalidationKey, invalidateQueries],
  );

  return (
    <ConvexContext.Provider value={value}>
      {children}
    </ConvexContext.Provider>
  );
}

export function useConvex(): Convex {
  const ctx = useContext(ConvexContext);
  if (!ctx) throw new Error('useConvex() must be used within a <ConvexProvider>');
  return ctx.client;
}

export function useConvexContext(): ConvexContextValue {
  const ctx = useContext(ConvexContext);
  if (!ctx) throw new Error('Hook must be used within a <ConvexProvider>');
  return ctx;
}
