import { useEffect, useState } from 'react';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

interface NavigatorWithWakeLock {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
}

/**
 * Keeps the screen on while `active`, where the browser supports the Screen Wake Lock API.
 * Browsers drop the lock when the tab is hidden, so it is taken again on return.
 */
export function useWakeLock(active: boolean) {
  const [isSupported] = useState(
    () => typeof navigator !== 'undefined' && !!(navigator as NavigatorWithWakeLock).wakeLock
  );

  useEffect(() => {
    if (!active || !isSupported) return undefined;
    const wakeLock = (navigator as NavigatorWithWakeLock).wakeLock!;
    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = () => {
      wakeLock
        .request('screen')
        .then((lock) => {
          if (cancelled) void lock.release();
          else sentinel = lock;
        })
        .catch(() => {
          // Denied (battery saver, permissions): the counter works without it.
        });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release();
    };
  }, [active, isSupported]);

  return isSupported;
}
