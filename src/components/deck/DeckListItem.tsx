import { memo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaDownload, FaTrash } from 'react-icons/fa';
import { Deck, DeckFormat } from '../../types/Deck';
import { DeckFormatType } from '../../types/enums';
import { validateDeck } from '../../utils/deckValidator';
import DeckValidationBadge from '../DeckValidationBadge';

interface DeckListItemProps {
  deck: Deck;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (deck: Deck) => void;
  onEdit: (
    id: string,
    name: string,
    format: DeckFormat,
    cards: Deck['cards'],
    notes?: string,
    relatedTokens?: Deck['relatedTokens']
  ) => void;
  onExport: (deck: Deck) => void;
  onDelete: (deck: Deck) => void;
}

export const DeckListItem = memo(function DeckListItem({
  deck,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onExport,
  onDelete
}: DeckListItemProps) {
  const { t } = useTranslation();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const validation = validateDeck(deck.cards, deck.format || DeckFormatType.FREEFORM);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(deck)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(deck);
        }
      }}
      className={`deck-list-item cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isSelected ? 'deck-list-item-active' : 'deck-list-item-inactive'} ${showExportMenu ? 'z-50' : 'z-0'}`}
    >
      {/* Subtle visual glow under selection */}
      {isSelected && <div className="deck-list-item-glow pointer-events-none" />}

      <div className="deck-list-item-content">
        <div className="w-full text-left pointer-events-none">
          <div className="flex items-center gap-2">
            <p
              className={`deck-list-item-title ${isSelected ? 'deck-list-item-title-selected' : 'deck-list-item-title-default'}`}
            >
              {deck.name}
            </p>
            {isEditing && <span className="deck-list-item-editing-badge" title={t('deck.editingDeck')} />}
          </div>
          <div className="deck-list-item-meta">
            <span
              className={`text-xs ${isSelected ? 'text-blue-700 dark:text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {deck.cards.length} {t('common.cards')}
            </span>
            <span
              className={`format-badge deck-list-item-format-badge ${isSelected ? 'deck-list-item-format-badge-selected' : 'deck-list-item-format-badge-default'}`}
            >
              {t((deck.format || DeckFormatType.FREEFORM).toLowerCase())}
            </span>
            <DeckValidationBadge validation={validation} formatKey={deck.format || DeckFormatType.FREEFORM} variant="compact" />
          </div>
        </div>

        <div className="deck-list-item-actions pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(deck.id, deck.name, deck.format || DeckFormatType.FREEFORM, deck.cards, deck.notes, deck.relatedTokens);
            }}
            className={`button-small deck-list-action-btn bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center min-w-[32px]`}
            title={t('common.edit')}
            aria-label={`${t('common.edit')} ${deck.name}`}
          >
            <FaEdit className="text-sm" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExport(deck);
            }}
            className="button-small deck-list-action-btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center min-w-[32px]"
            title={t('deck.export')}
            aria-label={`${t('deck.export')} ${deck.name}`}
          >
            <FaDownload className="text-sm" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(deck);
            }}
            className={`button-small deck-list-action-btn danger-button flex items-center justify-center min-w-[32px]`}
            title={t('deck.delete')}
            aria-label={`${t('deck.delete')} ${deck.name}`}
          >
            <FaTrash className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
});
