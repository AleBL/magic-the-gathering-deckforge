import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SwitchDarkMode from './components/SwitchDarkMode';
import SelectLanguage from './components/SelectLanguage';
import CardSearch from './components/CardSearch';
import DeckManager from './components/DeckManager';
import EditingDeckBanner from './components/EditingDeckBanner';
import Toast from './components/Toast';
import { Card } from './types/Card';
import { DeckFormat } from './types/Deck';
import { fetchSymbols } from './utils/symbolHelper';
import useDarkMode from './hooks/useDarkMode';
import useToast from './hooks/useToast';
import CustomDialog from './components/CustomDialog';
import { FaSearch, FaLayerGroup } from 'react-icons/fa';

interface EditingDeckState {
  deckId: string | null;
  deckName: string;
  deckFormat: DeckFormat;
  deckNotes?: string;
}

const INITIAL_EDITING_STATE: EditingDeckState = {
  deckId: null,
  deckName: '',
  deckFormat: 'freeform',
  deckNotes: ''
};

function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'search' | 'deck'>('search');
  const [currentDeck, setCurrentDeck] = useState<Card[]>([]);
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const [editingDeck, setEditingDeck] = useState<EditingDeckState>(INITIAL_EDITING_STATE);
  const { toastMessage, showToast } = useToast();

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'info'
  });

  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    variant: 'danger' | 'warning' | 'info' | 'success' = 'warning'
  ) => {
    setDialogState({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setDialogState((prev) => ({ ...prev, isOpen: false }));
      },
      variant
    });
  };

  useEffect(() => {
    fetchSymbols();
  }, []);

  // Global Desktop Keyboard Shortcuts for Power Users
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const safeNavigator: Navigator & { userAgentData?: { platform?: string } } = navigator;
      const isMac = safeNavigator.userAgentData?.platform === 'macOS' || /Mac/i.test(navigator.userAgent);
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      // Ctrl + F / Cmd + F: Focus and select the Search Card bar
      if (modifier && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setActiveTab('search');
        setTimeout(() => {
          const searchInput = document.getElementById('search-input') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }, 50);
      }

      // Ctrl + S / Cmd + S: Save Current Deck
      if (modifier && event.key.toLowerCase() === 's') {
        event.preventDefault();
        setActiveTab('deck');
        setTimeout(() => {
          const saveBtn = document.getElementById('save-deck-btn') as HTMLButtonElement;
          if (saveBtn && !saveBtn.disabled) {
            saveBtn.click();
          }
        }, 50);
      }

      // Ctrl + P / Cmd + P: Launch Interactive Playtest Simulator
      if (modifier && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setActiveTab('deck');
        setTimeout(() => {
          const playtestBtn = document.getElementById('playtest-btn') as HTMLButtonElement;
          if (playtestBtn && !playtestBtn.disabled) {
            playtestBtn.click();
          }
        }, 50);
      }

      // Ctrl + Shift + N: Clear Current Deck
      if (modifier && event.shiftKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setActiveTab('deck');
        setTimeout(() => {
          const clearBtn = document.getElementById('clear-deck-btn') as HTMLButtonElement;
          if (clearBtn && !clearBtn.disabled) {
            clearBtn.click();
          }
        }, 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddToDeck = (card: Card) => {
    setCurrentDeck((prev) => [...prev, card]);
    showToast(`${card.name}: ${t('cardAdded')}`);
  };

  const handleRemoveFromDeck = (cardToRemove: Card) => {
    setCurrentDeck((prev) => {
      const index = prev.findIndex((c) => c.id === cardToRemove.id);
      if (index > -1) {
        const newDeck = [...prev];
        newDeck.splice(index, 1);
        return newDeck;
      }
      return prev;
    });
  };

  const handleToggleCommander = (cardToToggle: Card) => {
    setCurrentDeck((prev) => {
      const index = prev.findIndex((card) => card.id === cardToToggle.id);
      if (index === -1) return prev;

      const isCurrentlyCommander = !!prev[index].isCommander;

      if (isCurrentlyCommander) {
        return prev.map((card, idx) => (idx === index ? { ...card, isCommander: false } : card));
      } else {
        const currentCommanders = prev.filter((card) => card.isCommander);
        if (currentCommanders.length >= 2) {
          const commanderToKeep = currentCommanders[currentCommanders.length - 1];
          return prev.map((card, idx) => {
            if (idx === index) {
              return { ...card, isCommander: true };
            }
            if (card.id === commanderToKeep.id) {
              return { ...card, isCommander: true };
            }
            return { ...card, isCommander: false };
          });
        } else {
          return prev.map((card, idx) => (idx === index ? { ...card, isCommander: true } : card));
        }
      }
    });
  };

  const handleClearDeck = () => {
    showConfirmDialog(
      t('confirmClearTitle'),
      t('confirmClear'),
      () => {
        setCurrentDeck([]);
        setEditingDeck(INITIAL_EDITING_STATE);
      },
      'danger'
    );
  };

  const handleUpdateNotes = (notes: string) => {
    setEditingDeck((prev) => ({ ...prev, deckNotes: notes }));
  };

  const handleUpdateCardZone = (cardId: string, zone: 'main' | 'sideboard' | 'maybeboard') => {
    setCurrentDeck((prev) => {
      const index = prev.findIndex((c) => c.id === cardId);
      if (index === -1) return prev;
      const newDeck = [...prev];
      newDeck[index] = { ...newDeck[index], zone };
      return newDeck;
    });
  };

  const handleLoadDeckToEdit = (id: string, name: string, format: DeckFormat, cards: Card[], notes?: string) => {
    setEditingDeck({ deckId: id, deckName: name, deckFormat: format, deckNotes: notes || '' });
    setCurrentDeck(cards);
  };

  const handleCancelEdit = () => {
    setEditingDeck(INITIAL_EDITING_STATE);
    setCurrentDeck([]);
  };

  return (
    <div className="page-container">
      <header className="header-container">
        {editingDeck.deckId && (
          <EditingDeckBanner
            deckName={editingDeck.deckName}
            deckFormat={editingDeck.deckFormat}
            cardCount={currentDeck.length}
            onGoToDecks={() => setActiveTab('deck')}
            onCancelEdit={handleCancelEdit}
          />
        )}
        <div className="header-toolbar">
          <div className="nav-menu">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-600/30 rounded-lg blur-xs animate-pulse"></div>
                <img
                  src="./logo.svg"
                  alt="MTG Deck Forge Logo"
                  className="relative w-7 h-7 object-contain drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]"
                />
              </div>
              <h1 className="header-title font-extrabold bg-gradient-to-r from-blue-600 via-indigo-500 to-indigo-600 dark:from-blue-400 dark:via-indigo-300 dark:to-blue-500 bg-clip-text text-transparent tracking-widest uppercase">
                {t('appTitle')}
              </h1>
            </div>
            <nav className="tab-group">
              <button
                onClick={() => setActiveTab('search')}
                className={`tab-button ${activeTab === 'search' ? 'tab-button-active' : ''}`}
              >
                <FaSearch className="text-xs shrink-0" />
                <span>{t('searchTab')}</span>
              </button>
              <button
                onClick={() => setActiveTab('deck')}
                className={`tab-button ${activeTab === 'deck' ? 'tab-button-active' : ''}`}
              >
                <FaLayerGroup className="text-xs shrink-0" />
                <span>{t('decksTab')}</span>
                {currentDeck.length > 0 && <span className="count-badge">{currentDeck.length}</span>}
              </button>
            </nav>
          </div>
          <div className="header-actions">
            <SwitchDarkMode isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
            <SelectLanguage />
          </div>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'search' ? (
          <CardSearch onAddToDeck={handleAddToDeck} />
        ) : (
          <DeckManager
            currentDeck={currentDeck}
            onAddToDeck={handleAddToDeck}
            onRemoveFromDeck={handleRemoveFromDeck}
            onToggleCommander={handleToggleCommander}
            onClearDeck={handleClearDeck}
            editingDeckId={editingDeck.deckId}
            editingDeckName={editingDeck.deckName}
            editingDeckFormat={editingDeck.deckFormat}
            editingDeckNotes={editingDeck.deckNotes}
            onUpdateNotes={handleUpdateNotes}
            onUpdateCardZone={handleUpdateCardZone}
            onLoadDeckToEdit={handleLoadDeckToEdit}
            onCancelEdit={handleCancelEdit}
            showToast={showToast}
          />
        )}
      </main>

      {toastMessage && <Toast message={toastMessage} />}

      <CustomDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={dialogState.onConfirm}
        onCancel={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        variant={dialogState.variant}
      />
    </div>
  );
}

export default App;
