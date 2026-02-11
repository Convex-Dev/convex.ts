import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ConvexProvider, useConvexContext } from '../hooks/ConvexContext';
import { useQuery } from '../hooks/useQuery';

function mockResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

describe('useQuery', () => {
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

  it('returns loading state initially then data on success', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ value: 42 }));

    const { result } = renderHook(() => useQuery('*balance*'), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual({ value: 42 });
    expect(result.current.error).toBeUndefined();
  });

  it('returns error on failure', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(
      { errorCode: 'NOBODY', value: 'Account does not exist' },
    ));

    const { result } = renderHook(() => useQuery('(balance #999999)'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });

  it('returns error on network failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useQuery('*balance*'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('Network error');
    expect(result.current.data).toBeUndefined();
  });

  it('is disabled when source is null', () => {
    const { result } = renderHook(() => useQuery(null), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('is disabled when source is undefined', () => {
    const { result } = renderHook(() => useQuery(undefined), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('re-fetches when source changes', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ value: 10 }))
      .mockResolvedValueOnce(mockResponse({ value: 20 }));

    let source = '(balance #1)';
    const { result, rerender } = renderHook(() => useQuery(source), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual({ value: 10 });

    source = '(balance #2)';
    rerender();

    await waitFor(() => expect(result.current.data).toEqual({ value: 20 }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('re-fetches when deps change', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ value: 100 }))
      .mockResolvedValueOnce(mockResponse({ value: 200 }));

    let addr = 1;
    const { result, rerender } = renderHook(
      () => useQuery(`(balance #${addr})`, [addr]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual({ value: 100 });

    addr = 2;
    rerender();

    await waitFor(() => expect(result.current.data).toEqual({ value: 200 }));
  });

  it('re-fetches on invalidation', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ value: 'first' }))
      .mockResolvedValueOnce(mockResponse({ value: 'second' }));

    let invalidate: () => void;

    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConvexProvider url="https://peer.example.com">{children}</ConvexProvider>
    );

    const { result } = renderHook(
      () => {
        const ctx = useConvexContext();
        invalidate = ctx.invalidateQueries;
        return useQuery('*balance*');
      },
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual({ value: 'first' });

    act(() => invalidate!());

    await waitFor(() => expect(result.current.data).toEqual({ value: 'second' }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ignores stale response when source changes quickly', async () => {
    // First query resolves slowly, second resolves fast
    let resolveFirst: (v: Response) => void;
    const firstPromise = new Promise<Response>(r => { resolveFirst = r; });

    fetchMock
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce(mockResponse({ value: 'second' }));

    let source = 'slow-query';
    const { result, rerender } = renderHook(() => useQuery(source), { wrapper });

    // Change source before first resolves
    source = 'fast-query';
    rerender();

    await waitFor(() => expect(result.current.data).toEqual({ value: 'second' }));

    // Now resolve the stale first query — should be ignored
    resolveFirst!(mockResponse({ value: 'stale' }));
    // Give it a tick
    await new Promise(r => setTimeout(r, 10));

    expect(result.current.data).toEqual({ value: 'second' });
  });
});
