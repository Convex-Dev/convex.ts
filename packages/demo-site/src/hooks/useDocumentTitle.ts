import { useEffect } from 'react';

/**
 * Set document.title for the duration of the component's lifetime.
 * Restores the previous title on unmount so back-navigation keeps the
 * right title.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
