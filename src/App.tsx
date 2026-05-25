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
            <h1 className="header-title">{t('appTitle')}</h1>
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
