import { useTranslation } from 'react-i18next';
import { FaSlidersH, FaList, FaTh, FaLayerGroup } from 'react-icons/fa';
import { CardSize } from '../../types';
import { GroupCriteria, SortCriteria } from '../../types/enums';
import { ViewMode } from '../../hooks/useDeckPreviewState';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface DeckDisplayOptionsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  groupBy: GroupCriteria;
  setGroupBy: (group: GroupCriteria) => void;
  sortBy: SortCriteria;
  setSortBy: (sort: SortCriteria) => void;
  cardSize: CardSize;
  onCardSizeChange?: (size: CardSize) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

/** Dropdown controlling deck view mode, grouping, sorting, and card size. */
export function DeckDisplayOptions({
  viewMode,
  setViewMode,
  groupBy,
  setGroupBy,
  sortBy,
  setSortBy,
  cardSize,
  onCardSizeChange,
  isOpen,
  setIsOpen
}: DeckDisplayOptionsProps) {
  const { t } = useTranslation();
  useEscapeKey(() => setIsOpen(false), isOpen);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`display-settings-btn ${isOpen ? 'display-settings-btn-active' : ''}`}
        title={t('common.displaySettings')}
      >
        <FaSlidersH className="text-xs shrink-0 text-blue-500 dark:text-blue-400" />
        <span>{t('common.viewMode')}</span>
        <span
          className="text-[9px] opacity-60 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
        >
          ▼
        </span>
      </button>
      {isOpen ? (
        <>
          {/* Backdrop click is a mouse-only convenience; Escape provides the keyboard-equivalent action. */}
          <div className="fixed inset-0 z-[var(--z-backdrop)]" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="display-settings-dropdown">
            <div className="space-y-2">
              <span className="display-settings-section-label">{t('common.viewMode')}</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { mode: 'list', label: t('common.listView'), icon: FaList },
                    { mode: 'grid', label: t('common.gridView'), icon: FaTh },
                    { mode: 'stack', label: t('strategy.stackView'), icon: FaLayerGroup }
                  ] as const
                ).map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`option-toggle-btn ${viewMode === mode ? 'option-toggle-btn-active' : ''}`}
                  >
                    <Icon className="text-sm" />
                    <span className="text-[10px] leading-none">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="display-settings-section-label">{t('deck.groupBy')}</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { key: 'none', label: t('deck.groupNone') },
                    { key: 'type', label: t('deck.groupType') },
                    { key: 'cmc', label: t('deck.groupCmc') },
                    { key: 'color', label: t('deck.groupColor') }
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setGroupBy(key)}
                    className={`option-toggle-btn-compact ${groupBy === key ? 'option-toggle-btn-compact-active' : ''}`}
                    title={label}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="display-settings-section-label">{t('deck.sortBy')}</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { key: 'name', label: t('deck.sortName') },
                    { key: 'cmc', label: t('deck.sortCmc') },
                    { key: 'rarity', label: t('deck.sortRarity') }
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSortBy(key)}
                    className={`option-toggle-btn-compact ${sortBy === key ? 'option-toggle-btn-compact-active' : ''}`}
                    title={label}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {viewMode !== 'list' && onCardSizeChange ? (
              <div className="space-y-2">
                <span className="display-settings-section-label">{t('search.cardSize')}</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { key: 'small', label: t('search.smallInitial') },
                      { key: 'medium', label: t('search.mediumInitial') },
                      { key: 'large', label: t('search.largeInitial') },
                      { key: 'xlarge', label: t('search.xlargeInitial') }
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onCardSizeChange(key)}
                      className={`option-toggle-btn-compact ${cardSize === key ? 'option-toggle-btn-compact-active' : ''}`}
                      title={t(`search.${key}`)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
