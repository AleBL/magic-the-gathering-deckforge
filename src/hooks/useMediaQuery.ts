import { useEffect, useState } from 'react';

/**
 * Reactive `window.matchMedia` subscription. Keep the query aligned with the
 * Tailwind breakpoints used in markup (e.g. '(max-width: 639px)' pairs with
 * `sm:`), or the JS branch and the CSS branch will disagree.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
