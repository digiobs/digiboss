import { useState, useCallback, useEffect } from 'react';

export type VisibilityMode = 'admin' | 'client';

export function useVisibilityMode() {
  const [mode, setMode] = useState<VisibilityMode>(() => {
    // Check URL params first
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    if (urlMode === 'client' || urlMode === 'admin') return urlMode;
    // Then localStorage
    return (localStorage.getItem('digiobs-visibility-mode') as VisibilityMode) || 'admin';
  });

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'admin' ? 'client' : 'admin';
      localStorage.setItem('digiobs-visibility-mode', next);
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('mode', next);
      window.history.replaceState({}, '', url.toString());
      return next;
    });
  }, []);

  const isAdmin = mode === 'admin';
  const isClient = mode === 'client';

  return { mode, toggle, isAdmin, isClient };
}
