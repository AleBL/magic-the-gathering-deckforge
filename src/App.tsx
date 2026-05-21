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

interface EditingDeckState {
  deckId: string | null;
  deckName: string;
  deckFormat: DeckFormat;
}

const INITIAL_EDITING_STATE: EditingDeckState = {
  deckId: null,
  deckName: '',
  deckFormat: 'freeform'
};

function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'search' | 'deck'>('search');
  const [currentDeck, setCurrentDeck] = useState<Card[]>([]);
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const [editingDeck, setEditingDeck] = useState<EditingDeckState>(INITIAL_EDITING_STATE);
  const { toastMessage, showToast } = useToast();

  useEffect(() => {
    fetchSymbols();
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

  const handleClearDeck = () => {
    // TODO(security): Replace window.confirm with in-app confirmation dialog
    if (window.confirm(t('confirmClear'))) {
      setCurrentDeck([]);
      setEditingDeck(INITIAL_EDITING_STATE);
    }
  };

  const handleLoadDeckToEdit = (id: string, name: string, format: DeckFormat, cards: Card[]) => {
    setEditingDeck({ deckId: id, deckName: name, deckFormat: format });
    setCurrentDeck(cards);
    setActiveTab('search');
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <h1 className="text-gray-900 dark:text-white text-xl font-bold transition-colors duration-300 hidden md:block">
              {t('appTitle')}
            </h1>
            <nav className="tab-group">
              <button
                onClick={() => setActiveTab('search')}
                className={`tab-button ${activeTab === 'search' ? 'tab-button-active' : ''}`}
              >
                {t('searchTab')}
              </button>
              <button
                onClick={() => setActiveTab('deck')}
                className={`tab-button ${activeTab === 'deck' ? 'tab-button-active' : ''}`}
              >
                {t('decksTab')}
                {currentDeck.length > 0 && (
                  <span className="count-badge">
                    {currentDeck.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-300 dark:border-gray-700">
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
            onRemoveFromDeck={handleRemoveFromDeck}
            onClearDeck={handleClearDeck}
            editingDeckId={editingDeck.deckId}
            editingDeckName={editingDeck.deckName}
            editingDeckFormat={editingDeck.deckFormat}
            onLoadDeckToEdit={handleLoadDeckToEdit}
            onCancelEdit={handleCancelEdit}
          />
        )}
      </main>

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}

export default App;
