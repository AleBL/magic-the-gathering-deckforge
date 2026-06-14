import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ProfileMenu from './components/ProfileMenu';
import CardSearch from './components/CardSearch';
import DeckManager from './components/DeckManager';
import EditingDeckBanner from './components/EditingDeckBanner';
import Toast from './components/Toast';
import { Card } from './types/Card';
import { DeckFormat, DeckRelatedToken } from './types/Deck';
import { fetchSymbols } from './utils/symbolHelper';
import useDarkMode from './hooks/useDarkMode';
import useToast from './hooks/useToast';
import CustomDialog from './components/CustomDialog';
import { FaSearch, FaLayerGroup } from 'react-icons/fa';
import pwLogo from './assets/PW.svg';
import * as Scry from 'scryfall-sdk';
import { translateCards } from './utils/translationHelper';

interface EditingDeckState {
  deckId: string | null;
  deckName: string;
  deckFormat: DeckFormat;
  deckNotes?: string;
}

interface CardPartReference {
  id: string;
  name: string;
}

interface CardWithAllParts extends Card {
  all_parts?: CardPartReference[];
  printed_text?: string;
}

type SupportedDialogVariant = 'danger' | 'warning' | 'info' | 'success';

const INITIAL_EDITING_STATE: EditingDeckState = {
  deckId: null,
  deckName: '',
  deckFormat: 'freeform',
  deckNotes: ''
};

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'search' | 'deck'>('search');
  const [currentDeck, setCurrentDeck] = useState<Card[]>([]);
  const [currentDeckRelatedTokens, setCurrentDeckRelatedTokens] = useState<DeckRelatedToken[]>([]);
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const [editingDeck, setEditingDeck] = useState<EditingDeckState>(INITIAL_EDITING_STATE);
  const { toastMessage, showToast } = useToast();

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    onConfirm: () => void;
    variant: SupportedDialogVariant;
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
    variant: SupportedDialogVariant = 'warning'
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

  const triggerDeckActionButton = useCallback((buttonId: string) => {
    setActiveTab('deck');
    setTimeout(() => {
      const targetButton = document.getElementById(buttonId) as HTMLButtonElement | null;
      if (targetButton && !targetButton.disabled) {
        targetButton.click();
      }
    }, 50);
  }, []);

  const focusSearchInputField = useCallback(() => {
    setActiveTab('search');
    setTimeout(() => {
      const searchInputField = document.getElementById('search-input') as HTMLInputElement | null;
      if (searchInputField) {
        searchInputField.focus();
        searchInputField.select();
      }
    }, 50);
  }, []);

  const isModifierKeyPressed = useCallback((event: KeyboardEvent): boolean => {
    const safeNavigator: Navigator & { userAgentData?: { platform?: string } } = navigator;
    const isMacOS = safeNavigator.userAgentData?.platform === 'macOS' || /Mac/i.test(navigator.userAgent);
    return isMacOS ? event.metaKey : event.ctrlKey;
  }, []);

  useEffect(() => {
    fetchSymbols();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const hasModifierKey = isModifierKeyPressed(event);
      const pressedKey = event.key.toLowerCase();

      if (hasModifierKey && pressedKey === 'f') {
        event.preventDefault();
        focusSearchInputField();
      }

      if (hasModifierKey && pressedKey === 's') {
        event.preventDefault();
        triggerDeckActionButton('save-deck-btn');
      }

      if (hasModifierKey && pressedKey === 'p') {
        event.preventDefault();
        triggerDeckActionButton('playtest-btn');
      }

      if (hasModifierKey && event.shiftKey && pressedKey === 'n') {
        event.preventDefault();
        triggerDeckActionButton('clear-deck-btn');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusSearchInputField, isModifierKeyPressed, triggerDeckActionButton]);

  useEffect(() => {
    const safeWindow = window as unknown as {
      ipcRenderer?: {
        on: (channel: string, listener: () => void) => void;
        off: (channel: string, listener: () => void) => void;
      };
    };

    const ipc = safeWindow.ipcRenderer;
    if (typeof window !== 'undefined' && ipc) {
      const handleClear = () => {
        triggerDeckActionButton('clear-deck-btn');
      };

      ipc.on('menu-clear-deck', handleClear);
      return () => {
        ipc.off('menu-clear-deck', handleClear);
      };
    }
  }, [triggerDeckActionButton]);

  const handleAddToDeck = async (card: Card) => {
    setCurrentDeck((prev) => [...prev, card]);
    showToast(`${card.name}: ${t('cardAdded')}`);

    try {
      let allParts = (card as CardWithAllParts).all_parts;
      if (!allParts) {
        const tokenKeywords = [
          'token',
          'create',
          'ficha',
          'criar',
          'crea',
          'crie',
          'investig',
          'incub',
          'fabric',
          'acumul',
          'enrolar',
          'amass'
        ];
        const text = (card.oracle_text || (card as CardWithAllParts).printed_text || '').toLowerCase();
        const hasTokenText = tokenKeywords.some((word) => text.includes(word));

        if (hasTokenText) {
          const fullCard = (await Scry.Cards.byName(card.name)) as CardWithAllParts;
          allParts = fullCard.all_parts || [];
        }
      }

      if (allParts && allParts.length > 0) {
        const tokenParts = allParts.filter((part) => part.id !== card.id && part.name !== card.name);

        if (tokenParts.length > 0) {
          const newTokens: DeckRelatedToken[] = [];
          await Promise.all(
            tokenParts.map(async (part) => {
              try {
                const fetchedCard = await Scry.Cards.byId(part.id);
                if (fetchedCard) {
                  const currentLang = i18n.language || 'en';
                  const translated = await translateCards([fetchedCard as unknown as Card], currentLang);
                  const finalCard = translated[0] || fetchedCard;

                  newTokens.push({
                    tokenCard: finalCard,
                    generatorCardName: card.printed_name || card.name,
                    isActive: true
                  });
                }
              } catch {
                // Ignore token fetch failures for isolated parts to avoid blocking deck updates.
              }
            })
          );

          if (newTokens.length > 0) {
            setCurrentDeckRelatedTokens((prev) => {
              const existingIds = new Set(prev.map((t) => t.tokenCard.id));
              const filteredNew = newTokens.filter((t) => !existingIds.has(t.tokenCard.id));
              return [...prev, ...filteredNew];
            });
          }
        }
      }
    } catch {
      // Ignore related token fetch failures to keep add-to-deck responsive.
    }
  };

  const handleAddTokenToDeck = (tokenCard: Card) => {
    const uniqueTokenCard = {
      ...tokenCard,
      id: `token-${tokenCard.id.split('-')[1] || tokenCard.id}-${Math.random().toString(36).substring(2, 9)}`
    };
    const newToken: DeckRelatedToken = {
      tokenCard: uniqueTokenCard,
      generatorCardName: t('manualAddition'),
      isActive: true
    };
    setCurrentDeckRelatedTokens((prev) => {
      const existingIds = new Set(prev.map((t) => t.tokenCard.id));
      if (existingIds.has(uniqueTokenCard.id)) return prev;
      return [...prev, newToken];
    });
    showToast(`${tokenCard.name}: ${t('tokenAdded')}`);
  };

  const handleRemoveFromDeck = (cardToRemove: Card) => {
    let remains = false;
    setCurrentDeck((prev) => {
      const index = prev.findIndex((c) => c.id === cardToRemove.id);
      if (index > -1) {
        const newDeck = [...prev];
        newDeck.splice(index, 1);
        remains = newDeck.some((c) => c.name === cardToRemove.name);
        return newDeck;
      }
      return prev;
    });

    if (!remains) {
      setCurrentDeckRelatedTokens((prevTokens) => {
        const cardName = cardToRemove.name;
        const printedName = cardToRemove.printed_name || cardToRemove.name;
        return prevTokens.filter((t) => t.generatorCardName !== cardName && t.generatorCardName !== printedName);
      });
    }
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
        setCurrentDeckRelatedTokens([]);
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

  const handleUpdateCard = (updatedCard: Card) => {
    setCurrentDeck((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  const handleLoadDeckToEdit = (
    id: string,
    name: string,
    format: DeckFormat,
    cards: Card[],
    notes?: string,
    relatedTokens?: DeckRelatedToken[]
  ) => {
    setEditingDeck({ deckId: id, deckName: name, deckFormat: format, deckNotes: notes || '' });
    setCurrentDeck(cards);
    setCurrentDeckRelatedTokens(relatedTokens || []);
  };

  const handleCancelEdit = () => {
    setEditingDeck(INITIAL_EDITING_STATE);
    setCurrentDeck([]);
    setCurrentDeckRelatedTokens([]);
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
            <div className="app-brand">
              <div className="app-brand-logo-wrapper">
                <div className="app-brand-logo-glow"></div>
                <img src={pwLogo} alt="MTG Deck Forge Logo" className="app-brand-logo-image" />
              </div>
              <h1 className="app-brand-title">{t('appTitle')}</h1>
            </div>
            <nav className="tab-group">
              <button
                onClick={() => setActiveTab('search')}
                className={`tab-button ${activeTab === 'search' ? 'tab-button-active' : ''}`}
                aria-label={t('searchTab')}
              >
                <FaSearch className="tab-button-icon" />
                <span>{t('searchTab')}</span>
              </button>
              <button
                onClick={() => setActiveTab('deck')}
                className={`tab-button ${activeTab === 'deck' ? 'tab-button-active' : ''}`}
                aria-label={t('decksTab')}
              >
                <FaLayerGroup className="tab-button-icon" />
                <span>{t('decksTab')}</span>
                {currentDeck.length > 0 && <span className="count-badge">{currentDeck.length}</span>}
              </button>
            </nav>
          </div>
          <div className="header-actions">
            <ProfileMenu isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          </div>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'search' ? (
          <CardSearch
            onAddToDeck={handleAddToDeck}
            onAddTokenToDeck={handleAddTokenToDeck}
            activeFormat={editingDeck.deckFormat}
          />
        ) : (
          <DeckManager
            currentDeck={currentDeck}
            deckRelatedTokens={currentDeckRelatedTokens}
            onUpdateTokens={setCurrentDeckRelatedTokens}
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
            onUpdateCard={handleUpdateCard}
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
