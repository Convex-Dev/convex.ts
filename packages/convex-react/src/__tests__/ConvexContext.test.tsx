import React from 'react';
import { renderHook } from '@testing-library/react';
import { ConvexProvider, useConvex } from '../hooks/ConvexContext';

describe('ConvexProvider + useConvex', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ConvexProvider url="https://peer.example.com">{children}</ConvexProvider>
  );

  it('provides a Convex client with the correct URL', () => {
    const { result } = renderHook(() => useConvex(), { wrapper });
    expect(result.current.getPeerUrl()).toBe('https://peer.example.com');
  });

  it('throws when used outside provider', () => {
    // Suppress React error boundary console noise
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useConvex())).toThrow('<ConvexProvider>');
    spy.mockRestore();
  });

  it('recreates client when URL changes', () => {
    let url = 'https://a.example.com';
    const { result, rerender } = renderHook(() => useConvex(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ConvexProvider url={url}>{children}</ConvexProvider>
      ),
    });
    const first = result.current;
    expect(first.getPeerUrl()).toBe('https://a.example.com');

    url = 'https://b.example.com';
    rerender();
    expect(result.current.getPeerUrl()).toBe('https://b.example.com');
    expect(result.current).not.toBe(first);
  });

  it('reuses client when URL is stable', () => {
    const { result, rerender } = renderHook(() => useConvex(), { wrapper });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
