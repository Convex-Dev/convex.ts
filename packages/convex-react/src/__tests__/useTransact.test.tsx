import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ConvexProvider, useConvexContext } from '../hooks/ConvexContext';
import { useTransact } from '../hooks/useTransact';
import { useQuery } from '../hooks/useQuery';

function mockResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

describe('useTransact', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ConvexProvider url="https://peer.example.com">{children}</ConvexProvider>
  );

  it('returns result on success', async () => {
    // prepare + submit
    fetchMock
      .mockResolvedValueOnce(mockResponse({ hash: 'abc123' }))
      .mockResolvedValueOnce(mockResponse({ value: 100 }));

    const { result } = renderHook(() => {
      const client = useConvexContext().client;
      // Need to set account for transact to work
      client.setAddress(42);
      // Mock signer by setting a signer-like
      (client as any).signer = {
        sign: async () => new Uint8Array(64),
        getPublicKey: () => new Uint8Array(32),
      };
      return useTransact();
    }, { wrapper });

    let txResult: any;
    await act(async () => {
      txResult = await result.current.transact('(+ 1 1)');
    });

    expect(txResult).toEqual({ value: 100 });
    expect(result.current.data).toEqual({ value: 100 });
    expect(result.current.error).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('sets error and throws on failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Prepare failed'));

    const { result } = renderHook(() => {
      const client = useConvexContext().client;
      client.setAddress(42);
      (client as any).signer = {
        sign: async () => new Uint8Array(64),
        getPublicKey: () => new Uint8Array(32),
      };
      return useTransact();
    }, { wrapper });

    await act(async () => {
      await expect(result.current.transact('(bad)')).rejects.toThrow('Prepare failed');
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('Prepare failed');
    expect(result.current.isLoading).toBe(false);
  });

  it('invalidates queries after success', async () => {
    // Query fetch, then prepare+submit, then query refetch
    fetchMock
      .mockResolvedValueOnce(mockResponse({ value: 'before' }))   // initial query
      .mockResolvedValueOnce(mockResponse({ hash: 'abc123' }))    // prepare
      .mockResolvedValueOnce(mockResponse({ value: 'tx-ok' }))    // submit
      .mockResolvedValueOnce(mockResponse({ value: 'after' }));   // query refetch

    const { result } = renderHook(() => {
      const ctx = useConvexContext();
      ctx.client.setAddress(42);
      (ctx.client as any).signer = {
        sign: async () => new Uint8Array(64),
        getPublicKey: () => new Uint8Array(32),
      };
      return {
        query: useQuery('*balance*'),
        tx: useTransact(),
      };
    }, { wrapper });

    // Wait for initial query
    await waitFor(() => expect(result.current.query.isLoading).toBe(false));
    expect(result.current.query.data).toEqual({ value: 'before' });

    // Execute transaction
    await act(async () => {
      await result.current.tx.transact('(transfer #1 100)');
    });

    // Query should refetch due to invalidation
    await waitFor(() => expect(result.current.query.data).toEqual({ value: 'after' }));
  });
});
