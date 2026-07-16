import { useCallback } from 'react';
import { spawnRippleAt } from '../utils/rippleEffect';

/**
 * Hook that adds a Material-style ripple animation to an element on click.
 * Usage: <button onClick={createRipple} className="ripple-container ...">
 */
export function useRipple() {
  const createRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    spawnRippleAt(e.currentTarget, e.clientX, e.clientY);
  }, []);

  return createRipple;
}
