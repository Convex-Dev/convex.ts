import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ConvexProvider, useConvexContext } from '../hooks/ConvexContext';
import { useAccount } from '../hooks/useAccount';

function mockResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

describe('useAccount', () => {
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

  it('returns undefined when no address set', () => {
    const { result } = renderHook(() => useAccount(), { wrapper });

    expect(result.current.address).toBeUndefined();
    expect(result.current.balance).toBeUndefined();
    expect(result.current.sequence).toBeUndefined();
    expect(result.current.publicKey).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches account info when address is set', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({
      address: 42,
      balance: 1000000,
      sequence: 5,
      key: 'abcdef1234',
    }));

    const { result } = renderHook(() => {
      const client = useConvexContext().client;
      client.setAddress(42);
      return useAccount();
    }, { wrapper });

    expect(result.current.address).toBe(42);
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.balance).toBe(1000000);
    expect(result.current.sequence).toBe(5);
    expect(result.current.publicKey).toBe('abcdef1234');
    expect(result.current.error).toBeUndefined();
  });

  it('returns error on fetch failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => {
      const client = useConvexContext().client;
      client.setAddress(42);
      return useAccount();
    }, { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('Network error');
  });

  it('refetch re-fetches account info', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ address: 42, balance: 100, sequence: 1, key: 'aa' }))
      .mockResolvedValueOnce(mockResponse({ address: 42, balance: 200, sequence: 2, key: 'aa' }));

    const { result } = renderHook(() => {
      const client = useConvexContext().client;
      client.setAddress(42);
      return useAccount();
    }, { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.balance).toBe(100);

    act(() => result.current.refetch());

    await waitFor(() => expect(result.current.balance).toBe(200));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
