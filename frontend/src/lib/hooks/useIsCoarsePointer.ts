import { useEffect, useState } from 'react';

const COARSE_POINTER_QUERY = '(pointer: coarse)';

/**
 * Returns true when the user's primary pointing device is "coarse" — i.e. a
 * finger on a touchscreen rather than a mouse. This is the standard signal
 * for "is this actually a phone or tablet" and is preferred over viewport
 * width because a narrowed desktop browser still reports a fine pointer.
 */
export function useIsCoarsePointer(): boolean {
  const [isCoarse, setIsCoarse] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(COARSE_POINTER_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia(COARSE_POINTER_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsCoarse(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isCoarse;
}
