import { useState, useEffect, useCallback } from 'react';

const TOAST_DURATION_MS = 2500;

export default function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return undefined;

    const timer = setTimeout(() => {
      setMessage(null);
    }, TOAST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [message]);

  const showToast = useCallback((text: string) => {
    setMessage(text);

    // Trigger native desktop OS notification
    if (window.Notification && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('MTG Deck Forge', {
            body: text,
            silent: false
          });
        }
      });
    }
  }, []);

  const dismissToast = useCallback(() => {
    setMessage(null);
  }, []);

  return { toastMessage: message, showToast, dismissToast };
}
