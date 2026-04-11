import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from './useDocumentTitle';

describe('useDocumentTitle', () => {
  it('sets document.title while mounted', () => {
    document.title = 'Original';
    const { unmount } = renderHook(() => useDocumentTitle('Page Title'));
    expect(document.title).toBe('Page Title');
    unmount();
    expect(document.title).toBe('Original');
  });

  it('updates the title when the argument changes', () => {
    document.title = 'Start';
    const { rerender } = renderHook(
      ({ title }: { title: string }) => useDocumentTitle(title),
      { initialProps: { title: 'First' } },
    );
    expect(document.title).toBe('First');
    rerender({ title: 'Second' });
    expect(document.title).toBe('Second');
  });
});
