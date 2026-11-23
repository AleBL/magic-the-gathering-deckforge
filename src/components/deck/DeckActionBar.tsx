import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LuChevronDown,
  LuClipboardList,
  LuCopy,
  LuDices,
  LuDownload,
  LuFileOutput,
  LuLink,
  LuPrinter,
  LuSquarePen,
  LuX
} from 'react-icons/lu';
import { Card } from '../../types/Card';
import { Deck } from '../../types/Deck';
import { DeckFormatType } from '../../types/enums';
import { downloadAsJson } from '../../services/fileDownload';
import { buildShareUrl } from '../../services/deckShare';

/** One shape for every action in the bar; only Playtest is primary. */
const BAR_BUTTON =
  'flex items-center justify-center gap-1.5 w-11 h-11 sm:w-8 sm:h-8 lg:w-auto lg:px-3 rounded-lg text-xs font-medium transition-colors duration-150 active:scale-[0.98]';
const BAR_PRIMARY = 'bg-primary text-on-primary hover:bg-primary-hover';
const BAR_SECONDARY = 'bg-surface-1 border border-line-strong text-fg hover:bg-surface-2';
const BAR_GHOST = 'text-fg-secondary hover:bg-surface-2 hover:text-fg';

/**
 * Hover tooltip for the icon-only action buttons. Hidden at lg and up, where
 * each button shows its text label inline instead.
 */
function ActionTooltip({ label }: { label: string }) {
  return (
    <div className="lg:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-slate-900 dark:bg-slate-950 text-white text-[11px] text-center rounded-lg shadow-xl border border-slate-700 dark:border-slate-800 opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition duration-300 z-50 transform translate-y-1 group-hover/tooltip:translate-y-0 whitespace-nowrap">
      <p className="font-medium leading-none">{label}</p>
    </div>
  );
}

interface DeckActionBarProps {
  cards: Card[];
  selectedDeck?: Deck | null;
  showToast: (text: string) => void;
  onPlaytest: () => void;
  onPrintProxies?: () => void;
  /** Mostrado apenas quando há deck selecionado */
  onLoadDeckToEdit?: () => void;
  onDeselectDeck?: () => void;
}

function DeckActionBar({
  cards,
  selectedDeck,
  showToast,
  onPlaytest,
  onPrintProxies,
  onLoadDeckToEdit,
  onDeselectDeck
}: DeckActionBarProps) {
  const { t } = useTranslation();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCopyDeckList = () => {
    if (cards.length === 0) return;
    const counts: Record<string, { count: number; card: Card }> = {};
    cards.forEach((c) => {
      const key = `${c.name}|${c.set}|${c.collector_number}`;
      if (counts[key]) counts[key].count += 1;
      else counts[key] = { count: 1, card: c };
    });
    const listStr = Object.values(counts)
      .map(({ count, card }) => {
        const setCode = card.set ? card.set.toUpperCase() : '';
        const collNum = card.collector_number || '';
        return `${count} ${card.name}${setCode ? ` (${setCode})` : ''}${collNum ? ` ${collNum}` : ''}`;
      })
      .join('\n');
    navigator.clipboard.writeText(listStr).then(() => showToast(t('deck.listCopied')));
  };

  const handleCopyArenaFormat = () => {
    if (cards.length === 0) return;
    const counts: Record<string, { count: number; card: Card }> = {};
    cards.forEach((c) => {
      const key = `${c.name}|${c.set}|${c.collector_number}`;
      if (counts[key]) counts[key].count += 1;
      else counts[key] = { count: 1, card: c };
    });
    const arenaStr = Object.values(counts)
      .map(({ count, card }) => {
        const setCode = card.set ? card.set.toUpperCase() : 'SET';
        const collNum = card.collector_number || '1';
        return `${count} ${card.name} (${setCode}) ${collNum}`;
      })
      .join('\n');
    navigator.clipboard.writeText(arenaStr).then(() => showToast(t('strategy.exportArenaCopied')));
  };

  const handleCopyShareLink = () => {
    if (cards.length === 0) return;
    const deck: Deck = selectedDeck ?? {
      id: '',
      name: t('deck.unnamedDeck'),
      format: DeckFormatType.FREEFORM,
      cards,
      createdAt: new Date().toISOString()
    };
    navigator.clipboard.writeText(buildShareUrl(deck)).then(() => showToast(t('export.linkCopied')));
  };

  const handleDownloadDecFile = () => {
    if (cards.length === 0) return;
    const counts: Record<string, { count: number; card: Card }> = {};
    cards.forEach((c) => {
      const key = `${c.name}|${c.set}|${c.collector_number}`;
      if (counts[key]) counts[key].count += 1;
      else counts[key] = { count: 1, card: c };
    });
    const decContent = Object.values(counts)
      .map(({ count, card }) => {
        const setCode = card.set ? card.set.toUpperCase() : '';
        const collNum = card.collector_number || '';
        return `${count} ${card.name}${setCode ? ` (${setCode})` : ''}${collNum ? ` ${collNum}` : ''}`;
      })
      .join('\r\n');
    const blob = new Blob([decContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedDeck?.name || 'deck'}.dec`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t('deck.deckExported'));
  };

  if (cards.length === 0 && !selectedDeck) return null;

  return (
    // Hidden below `sm`: the navbar's MobilePageMenu (visible at the same
    // breakpoint) owns every action here — playtest/print/export plus
    // edit/back-to-decks when a saved deck is selected.
    <div className="hidden sm:flex flex-wrap gap-2 items-center">
      {cards.length > 0 && (
        <>
          {/* Export Dropdown */}
          <div className="relative inline-flex items-center" ref={dropdownRef}>
            <div className="relative group/tooltip inline-flex items-center">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className={`${BAR_BUTTON} ${BAR_SECONDARY} ${showExportMenu ? 'bg-surface-2' : ''}`}
                aria-label={t('deck.export')}
              >
                <LuFileOutput className="text-sm shrink-0" />
                <span className="hidden lg:inline">{t('deck.export')}</span>
                <LuChevronDown
                  className={`text-[10px] transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`}
                />
              </button>
              {!showExportMenu && <ActionTooltip label={t('deck.export')} />}
            </div>

            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 rounded-lg shadow-lg bg-surface-1 border border-line z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                <button
                  type="button"
                  onClick={() => {
                    handleCopyShareLink();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-fg-secondary hover:bg-surface-2 hover:text-fg flex items-center gap-2 cursor-pointer"
                >
                  <LuLink className="text-fg-muted shrink-0" />
                  {t('export.copyLink')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadDecFile();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-fg-secondary hover:bg-surface-2 hover:text-fg flex items-center gap-2 cursor-pointer"
                >
                  <LuDownload className="text-fg-muted shrink-0" />
                  {t('strategy.downloadDec')} (.dec)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadAsJson(selectedDeck || { cards }, `${selectedDeck?.name || 'deck'}.json`);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-fg-secondary hover:bg-surface-2 hover:text-fg flex items-center gap-2 cursor-pointer"
                >
                  <LuDownload className="text-fg-muted shrink-0" />
                  {t('export.downloadJson') || 'Download'} (.json)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCopyArenaFormat();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-fg-secondary hover:bg-surface-2 hover:text-fg flex items-center gap-2 cursor-pointer"
                >
                  <LuClipboardList className="text-fg-muted shrink-0" />
                  {t('strategy.exportArena')} (Arena)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCopyDeckList();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-fg-secondary hover:bg-surface-2 hover:text-fg flex items-center gap-2 cursor-pointer"
                >
                  <LuCopy className="text-fg-muted shrink-0" />
                  {t('deck.copyList')} (.txt)
                </button>
                {onPrintProxies && (
                  <>
                    <div className="my-1 h-px bg-line" role="separator" />
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        onPrintProxies();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-fg-secondary hover:bg-surface-2 hover:text-fg flex items-center gap-2 cursor-pointer"
                    >
                      <LuPrinter className="text-fg-muted shrink-0" />
                      {t('print.printProxies')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Playtest button — hidden below sm: the multi-zone simulator isn't
              usable on phone-width screens, so we don't expose an entry point there. */}
          <div className="hidden sm:inline-flex relative group/tooltip items-center">
            <button
              id="playtest-btn"
              type="button"
              onClick={onPlaytest}
              className={`${BAR_BUTTON} ${BAR_PRIMARY}`}
              aria-label={t('playtest.playtest')}
            >
              <LuDices className="text-sm shrink-0" />
              <span className="hidden lg:inline">{t('playtest.playtest')}</span>
            </button>
            <ActionTooltip label={t('playtest.playtest')} />
          </div>
        </>
      )}

      {selectedDeck && onLoadDeckToEdit && (
        <div className="relative group/tooltip inline-flex items-center">
          <button
            type="button"
            onClick={onLoadDeckToEdit}
            className={`${BAR_BUTTON} ${BAR_SECONDARY}`}
            aria-label={t('common.edit')}
          >
            <LuSquarePen className="text-sm shrink-0" />
            <span className="hidden lg:inline">{t('common.edit')}</span>
          </button>
          <ActionTooltip label={t('common.edit')} />
        </div>
      )}

      {onDeselectDeck && (
        <div className="relative group/tooltip inline-flex items-center">
          <button
            type="button"
            onClick={onDeselectDeck}
            className={`${BAR_BUTTON} ${BAR_GHOST}`}
            aria-label={t('common.cancel')}
          >
            <LuX className="text-sm shrink-0" />
            <span className="hidden lg:inline">{t('common.cancel')}</span>
          </button>
          <ActionTooltip label={t('common.cancel')} />
        </div>
      )}
    </div>
  );
}

export default DeckActionBar;
