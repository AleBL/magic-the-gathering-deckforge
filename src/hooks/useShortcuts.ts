import { useEffect, useCallback } from 'react';

interface ShortcutOptions {
  onSearchFocus?: () => void;
  onEscape?: () => void;
  onSaveDeck?: () => void;
  onPlaytest?: () => void;
  onClearDeck?: () => void;
}

export function useShortcuts({ onSearchFocus, onEscape, onSaveDeck, onPlaytest, onClearDeck }: ShortcutOptions) {
  const isModifierKeyPressed = useCallback((event: KeyboardEvent): boolean => {
    const safeNavigator: Navigator & { userAgentData?: { platform?: string } } = navigator;
    const isMacOS = safeNavigator.userAgentData?.platform === 'macOS' || /Mac/i.test(navigator.userAgent);
    return isMacOS ? event.metaKey : event.ctrlKey;
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const hasModifierKey = isModifierKeyPressed(event);
      const pressedKey = event.key.toLowerCase();

      // Escape
      if (event.key === 'Escape') {
        if (onEscape) {
          onEscape();
        }
      }

      // Cmd/Ctrl + F
      if (hasModifierKey && pressedKey === 'f') {
        if (onSearchFocus) {
          event.preventDefault();
          onSearchFocus();
        }
      }

      // Cmd/Ctrl + S
      if (hasModifierKey && pressedKey === 's') {
        if (onSaveDeck) {
          event.preventDefault();
          onSaveDeck();
        }
      }

      // Cmd/Ctrl + P
      if (hasModifierKey && pressedKey === 'p') {
        if (onPlaytest) {
          event.preventDefault();
          onPlaytest();
        }
      }

      // Cmd/Ctrl + Shift + N
      if (hasModifierKey && event.shiftKey && pressedKey === 'n') {
        if (onClearDeck) {
          event.preventDefault();
          onClearDeck();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSearchFocus, onEscape, onSaveDeck, onPlaytest, onClearDeck, isModifierKeyPressed]);
}
