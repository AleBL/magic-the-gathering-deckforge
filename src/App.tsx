import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import CardSearch from './components/card/CardSearch';
import DeckManager from './components/DeckManager';
import { fetchSymbols } from './utils/symbolHelper';
import useToast from './hooks/useToast';
import { useShortcuts } from './hooks/useShortcuts';
import RootLayout from './components/layout/RootLayout';
import { useDeckStore } from './store/useDeckStore';
import { useDeckActions } from './hooks/useDeckActions';
import { useGlobalRipple } from './hooks/useGlobalRipple';
import { useVisualEffects } from './hooks/useVisualEffects';

function App() {
  const { i18n } = useTranslation();
  const { motionEnabled } = useVisualEffects();
  useGlobalRipple();
  const [activeTab, setActiveTab] = useState<'search' | 'deck'>('search');
  const { toastMessage, toastVariant, toastAction, showToast } = useToast();

  const editingDeck = useDeckStore((state) => state.editingDeck);
  const setPendingAction = useDeckStore((state) => state.setPendingAction);

  const { handleAddToDeck, handleAddTokenToDeck } = useDeckActions(showToast);

  const handleSearchFocus = useCallback(() => {
    setActiveTab('search');
    setPendingAction('focus-search');
  }, [setPendingAction]);

  const handleSaveDeck = useCallback(() => {
    setActiveTab('deck');
    setPendingAction('save-deck');
  }, [setPendingAction]);

  const handlePlaytest = useCallback(() => {
    setActiveTab('deck');
    setPendingAction('playtest-deck');
  }, [setPendingAction]);

  const handleClearDeck = useCallback(() => {
    setActiveTab('deck');
    setPendingAction('clear-deck');
  }, [setPendingAction]);

  const handleEscape = useCallback(() => {
    window.dispatchEvent(new CustomEvent('mtg-escape'));
  }, []);

  useShortcuts({
    onSearchFocus: handleSearchFocus,
    onEscape: handleEscape,
    onSaveDeck: handleSaveDeck,
    onPlaytest: handlePlaytest,
    onClearDeck: handleClearDeck
  });

  useEffect(() => {
    fetchSymbols();

    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      showToast(customEvent.detail.message, customEvent.detail.variant);
    };
    window.addEventListener('global-toast', handleGlobalToast);
    return () => window.removeEventListener('global-toast', handleGlobalToast);
  }, [showToast]);

  useEffect(() => {
    document.documentElement.lang = i18n.language || 'en';
  }, [i18n.language]);

  useEffect(() => {
    const safeWindow = window as unknown as {
      electronAPI?: {
        on: (channel: string, listener: () => void) => () => void;
        off: (channel: string, listener: () => void) => void;
      };
    };

    const ipc = safeWindow.electronAPI;
    if (typeof window !== 'undefined' && ipc) {
      const unsubscribe = ipc.on('menu-clear-deck', handleClearDeck);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [handleClearDeck]);

  return (
    <RootLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      toastMessage={toastMessage}
      toastVariant={toastVariant}
      toastAction={toastAction}
    >
      <div key={activeTab} className={motionEnabled ? 'view-fade' : undefined}>
        {activeTab === 'search' ? (
          <CardSearch
            onAddToDeck={handleAddToDeck}
            onAddTokenToDeck={handleAddTokenToDeck}
            activeFormat={editingDeck.deckFormat}
          />
        ) : (
          <DeckManager showToast={showToast} />
        )}
      </div>
    </RootLayout>
  );
}

export default App;
