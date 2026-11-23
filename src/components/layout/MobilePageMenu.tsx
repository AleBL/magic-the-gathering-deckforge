import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LuColumns2,
  LuDices,
  LuFileInput,
  LuFileOutput,
  LuHistory,
  LuLayers,
  LuMenu,
  LuPlus,
  LuPrinter,
  LuSave,
  LuSquarePen,
  LuTrash2
} from 'react-icons/lu';
import { PendingAction, useDeckStore } from '../../store/useDeckStore';
import { dispatchPendingAction } from '../../hooks/usePendingAction';
import { deckActionLabels } from '../../utils/deckActionLabels';
import BottomSheet from '../ui/BottomSheet';
import { AppTab } from '../../types';

interface MobilePageMenuProps {
  activeTab: AppTab;
}

interface PageMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  action: PendingAction;
  disabled?: boolean;
}

/**
 * Mobile-only (< sm) page-actions menu in the navbar. Opens a bottom sheet with
 * the current page's actions. Below `sm` this menu REPLACES the on-screen
 * toolbars (search filter row, DeckManagerToolbar, DeckActionBar) — they are
 * hidden at the same breakpoint that shows this button, so every action they
 * offer must exist here. Actions are dispatched through the store's
 * pendingAction channel — the same mechanism keyboard shortcuts use — so the
 * owning component executes them with its full context.
 */
function MobilePageMenu({ activeTab }: MobilePageMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentDeckLength = useDeckStore((state) => state.currentDeck.length);
  const editingDeck = useDeckStore((state) => state.editingDeck);
  const selectedDeckSummary = useDeckStore((state) => state.selectedDeckSummary);
  const savedDeckCount = useDeckStore((state) => state.savedDeckCount);

  const hasDeckCards = currentDeckLength > 0;
  const isEditing = editingDeck.deckId !== null;
  const { saveLabel, clearLabel } = deckActionLabels(t, editingDeck.deckId, editingDeck.deckName);

  // The on-screen toolbars (DeckManagerToolbar, DeckActionBar) are hidden
  // below `sm`, so every action they offer must be reachable from here. Items
  // mirror the deck screen's three states: viewing a saved deck, editing a
  // deck, or building the temporary deck. The search tab has no item list of
  // its own — see handleButtonClick below.
  let items: PageMenuItem[];
  if (selectedDeckSummary) {
    const hasSelectedCards = selectedDeckSummary.cardCount > 0;
    items = [
      { key: 'edit', label: t('common.edit'), icon: <LuSquarePen />, action: 'edit-selected-deck' },
      {
        key: 'playtest',
        label: t('playtest.playtest'),
        icon: <LuDices />,
        action: 'playtest-deck',
        disabled: !hasSelectedCards
      },
      {
        key: 'print',
        label: t('print.printProxies'),
        icon: <LuPrinter />,
        action: 'print-proxies',
        disabled: !hasSelectedCards
      },
      {
        key: 'export',
        label: t('deck.export'),
        icon: <LuFileOutput />,
        action: 'export-deck',
        disabled: !hasSelectedCards
      },
      { key: 'history', label: t('deck.versionHistory'), icon: <LuHistory />, action: 'open-history' },
      { key: 'toggle-list', label: t('deck.hideDeckList'), icon: <LuColumns2 />, action: 'toggle-deck-list' },
      { key: 'saved', label: t('deck.savedDecks'), icon: <LuLayers />, action: 'show-saved-decks' }
    ];
  } else {
    items = [
      { key: 'save', label: saveLabel, icon: <LuSave />, action: 'save-deck', disabled: !hasDeckCards },
      ...(isEditing
        ? [
            {
              key: 'save-as-new',
              label: t('deck.saveAsNew'),
              icon: <LuPlus />,
              action: 'save-deck-as-new' as PendingAction,
              disabled: !hasDeckCards
            }
          ]
        : []),
      { key: 'clear', label: clearLabel, icon: <LuTrash2 />, action: 'clear-deck', disabled: !hasDeckCards },
      {
        key: 'playtest',
        label: t('playtest.playtest'),
        icon: <LuDices />,
        action: 'playtest-deck',
        disabled: !hasDeckCards
      },
      {
        key: 'print',
        label: t('print.printProxies'),
        icon: <LuPrinter />,
        action: 'print-proxies',
        disabled: !hasDeckCards
      },
      {
        key: 'export',
        label: t('deck.export'),
        icon: <LuFileOutput />,
        action: 'export-deck',
        disabled: !hasDeckCards
      },
      { key: 'import-text', label: t('deck.importTextList'), icon: <LuFileInput />, action: 'import-deck-text' },
      { key: 'import-file', label: t('deck.importDeck'), icon: <LuFileInput />, action: 'import-deck-file' },
      {
        key: 'export-all',
        label: t('deck.exportAllDecks'),
        icon: <LuFileOutput />,
        action: 'export-all-decks',
        disabled: savedDeckCount === 0
      },
      { key: 'saved', label: t('deck.savedDecks'), icon: <LuLayers />, action: 'show-saved-decks' }
    ];
  }

  const handleItemClick = (action: PendingAction) => {
    setIsOpen(false);
    dispatchPendingAction(action);
  };

  // Only the deck tab has page actions. Search already shows its filters button next to
  // the search field, and the collection keeps its own toolbar; a second filters button
  // in the header only duplicated the first.
  if (activeTab !== 'deck') return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="sm:hidden flex items-center justify-center w-11 h-11 rounded-xl text-fg-secondary hover:bg-surface-2 active:scale-[0.98] transition-colors duration-150 cursor-pointer"
        aria-label={t('common.pageMenu')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <LuMenu className="text-base" />
      </button>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} labelledBy="page-menu-title">
        <h3 id="page-menu-title" className="text-xs font-semibold text-fg-muted mb-3">
          {t('common.pageMenu')} — {t('common.decksTab')}
        </h3>
        <div className="flex flex-col gap-1 pb-2">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              onClick={() => handleItemClick(item.action)}
              className="flex items-center gap-3 w-full min-h-11 px-3 py-2.5 rounded-xl text-left text-sm font-semibold text-fg hover:bg-surface-2 active:scale-[0.99] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="text-fg-muted shrink-0 w-5 flex justify-center">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

export default MobilePageMenu;
