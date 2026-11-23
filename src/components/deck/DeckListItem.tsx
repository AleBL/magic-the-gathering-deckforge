import { memo, useState, useRef, useEffect, useMemo, type MouseEvent as ReactMouseEvent } from 'react';
import { useDropDirection } from '../../hooks/useDropDirection';
import { useTranslation } from 'react-i18next';
import {
  LuCopyPlus,
  LuDownload,
  LuEllipsis,
  LuGitCompareArrows,
  LuImage,
  LuLayers,
  LuPlus,
  LuSquarePen,
  LuTag,
  LuTrash2
} from 'react-icons/lu';
import { Deck, DeckFormat } from '../../types/Deck';
import { DeckFormatType } from '../../types/enums';
import { validateDeck } from '../../utils/deckValidator';
import { formatLabelKey } from '../../utils/formatLabel';
import { resolveDeckCoverArt } from '../../utils/deckCover';
import { getSymbolUrl } from '../../utils/symbolHelper';
import DeckValidationBadge from './DeckValidationBadge';

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G'];
const MENU_ITEM =
  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-fg-secondary hover:bg-surface-2 hover:text-fg';

interface DeckListItemProps {
  deck: Deck;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (deck: Deck) => void;
  /** Double-click: select and commit — the modal uses it to pick a deck and close. */
  onActivate?: (deck: Deck) => void;
  onEdit: (
    id: string,
    name: string,
    format: DeckFormat,
    cards: Deck['cards'],
    notes?: string,
    relatedTokens?: Deck['relatedTokens']
  ) => void;
  onExport: (deck: Deck) => void;
  onDuplicate: (deck: Deck) => void;
  onNewFrom: (deck: Deck) => void;
  onDelete: (deck: Deck) => void;
  onChangeCover: (deck: Deck) => void;
  onCompare?: (deck: Deck) => void;
  onEditTags?: (deck: Deck) => void;
}

export const DeckListItem = memo(function DeckListItem({
  deck,
  isSelected,
  isEditing,
  onSelect,
  onActivate,
  onEdit,
  onExport,
  onDuplicate,
  onNewFrom,
  onDelete,
  onChangeCover,
  onCompare,
  onEditTags
}: DeckListItemProps) {
  const { t } = useTranslation();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  // ~5 items plus padding. Enough to decide the direction; the menu is not measured because
  // it does not exist until it is open.
  const dropDirection = useDropDirection(menuTriggerRef, showExportMenu, 240);
  const boxRef = useRef<HTMLDivElement>(null);

  // Bring the selected deck into view when it becomes the selection. Without this, picking a
  // deck in the all-decks modal left the sidebar scrolled wherever it happened to be, so the
  // deck you just chose was often off-screen once the modal closed.
  //
  // Only when it is actually out of view: scrolling something already on screen is motion for
  // nothing, and a smooth scroll keeps the whole layout moving — enough to make a click land
  // on a shifting target.
  useEffect(() => {
    const node = boxRef.current;
    if (!isSelected || !node) return;

    const rect = node.getBoundingClientRect();
    const fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
    if (fullyVisible) return;

    node.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [isSelected]);

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
  const coverArt = resolveDeckCoverArt(deck);
  const identity = useMemo(
    () =>
      COLOR_ORDER.filter((color) =>
        deck.cards.some((card) => (card.color_identity ?? card.colors ?? []).includes(color))
      ),
    [deck.cards]
  );

  const runFromMenu = (action: () => void) => (event: ReactMouseEvent) => {
    event.stopPropagation();
    setShowExportMenu(false);
    action();
  };

  return (
    <div
      ref={boxRef}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(deck)}
      onDoubleClick={() => onActivate?.(deck)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Enter is the keyboard equivalent of the double-click shortcut; Space just selects.
          if (e.key === 'Enter' && onActivate) onActivate(deck);
          else onSelect(deck);
        }
      }}
      className={`deck-box cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus ${isSelected ? 'deck-box-active' : 'deck-box-inactive'} ${showExportMenu ? 'z-50' : 'z-0'}`}
    >
      {/* A small crop of the cover keeps each deck recognisable while the whole library fits
          on screen; below lg the row drops it and stays text only. */}
      <div className="deck-box-art hidden lg:block">
        {coverArt ? (
          <img src={coverArt} alt="" loading="lazy" className="deck-box-art-image" />
        ) : (
          <div className="deck-box-art-placeholder">
            <LuLayers />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="deck-box-title-compact">{deck.name}</p>
          {isEditing && <span className="deck-list-item-editing-badge" title={t('deck.editingDeck')} />}
        </div>
        <div className="deck-list-item-meta pointer-events-none">
          {identity.length > 0 && (
            <span className="flex shrink-0 items-center gap-0.5" aria-label={identity.join('')}>
              {identity.map((color) => (
                <img key={color} src={getSymbolUrl(`{${color}}`)} alt="" className="w-3.5 h-3.5" />
              ))}
            </span>
          )}
          <span className="min-w-0 truncate text-xs text-fg-secondary">{t(formatLabelKey(deck.format))}</span>
          <span className="shrink-0 text-xs text-fg-muted">{deck.cards.length}</span>
          <DeckValidationBadge
            validation={validation}
            formatKey={deck.format || DeckFormatType.FREEFORM}
            variant="compact"
          />
          {deck.tags?.length ? (
            <span className="min-w-0 truncate text-xs text-fg-muted">{deck.tags.join(', ')}</span>
          ) : null}
        </div>
      </div>

      <div className="relative shrink-0 pointer-events-auto" ref={exportMenuRef}>
        <button
          ref={menuTriggerRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowExportMenu((open) => !open);
          }}
          aria-haspopup="menu"
          aria-expanded={showExportMenu}
          className="flex h-8 w-8 items-center justify-center rounded-md text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors duration-150"
          title={t('common.moreActions')}
          aria-label={`${t('common.moreActions')} ${deck.name}`}
        >
          <LuEllipsis className="text-base" />
        </button>
        {showExportMenu ? (
          <div
            role="menu"
            className={`absolute right-0 z-[var(--z-dropdown)] min-w-[200px] rounded-lg border border-line bg-surface-1 shadow-lg py-1 ${
              dropDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
          >
            <button
              type="button"
              role="menuitem"
              onClick={runFromMenu(() =>
                onEdit(
                  deck.id,
                  deck.name,
                  deck.format || DeckFormatType.FREEFORM,
                  deck.cards,
                  deck.notes,
                  deck.relatedTokens
                )
              )}
              className={MENU_ITEM}
            >
              <LuSquarePen className="shrink-0" />
              {t('common.edit')}
            </button>
            <button type="button" role="menuitem" onClick={runFromMenu(() => onExport(deck))} className={MENU_ITEM}>
              <LuDownload className="shrink-0" />
              {t('deck.export')}
            </button>
            <button type="button" role="menuitem" onClick={runFromMenu(() => onDuplicate(deck))} className={MENU_ITEM}>
              <LuCopyPlus className="shrink-0" />
              {t('deck.duplicateDeck')}
            </button>
            <button type="button" role="menuitem" onClick={runFromMenu(() => onNewFrom(deck))} className={MENU_ITEM}>
              <LuPlus className="shrink-0" />
              {t('deck.newDeckFromThis')}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={runFromMenu(() => onChangeCover(deck))}
              className={MENU_ITEM}
            >
              <LuImage className="shrink-0" />
              {t('deck.setCover')}
            </button>
            {onEditTags ? (
              <button type="button" role="menuitem" onClick={runFromMenu(() => onEditTags(deck))} className={MENU_ITEM}>
                <LuTag className="shrink-0" />
                {t('deckTags.edit')}
              </button>
            ) : null}
            {onCompare ? (
              <button type="button" role="menuitem" onClick={runFromMenu(() => onCompare(deck))} className={MENU_ITEM}>
                <LuGitCompareArrows className="shrink-0" />
                {t('deckCompare.compareWith')}
              </button>
            ) : null}
            {/* Destructive, so it sits apart at the end and asks for confirmation upstream. */}
            <div className="my-1 h-px bg-line" role="separator" />
            <button
              type="button"
              role="menuitem"
              onClick={runFromMenu(() => onDelete(deck))}
              className={`${MENU_ITEM} text-danger hover:text-danger`}
            >
              <LuTrash2 className="shrink-0" />
              {t('deck.delete')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
});
