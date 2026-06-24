import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaCopy,
  FaClipboardList,
  FaDownload,
  FaDiceD20,
  FaEdit,
  FaTimes,
  FaPrint,
  FaFileExport,
  FaChevronDown
} from 'react-icons/fa';
import { Card } from '../../types/Card';
import { Deck } from '../../types/Deck';
import { downloadAsJson } from '../../services/fileDownload';

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
    <div className="flex flex-wrap gap-2 items-center">
      {cards.length > 0 && (
        <>
          {/* Export Dropdown */}
          <div className="relative inline-flex items-center" ref={dropdownRef}>
            <div className="relative group/tooltip inline-flex items-center">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className={`flex items-center justify-center gap-1 px-3 h-8 rounded-lg text-white transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 ${
                  showExportMenu ? 'bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
                }`}
                aria-label={t('deck.export')}
              >
                <FaFileExport className="text-sm shrink-0" />
                <FaChevronDown
                  className={`text-[10px] transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`}
                />
              </button>
              {!showExportMenu && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-slate-900 dark:bg-slate-950 text-white text-[11px] text-center rounded-lg shadow-xl border border-slate-700 dark:border-slate-800 opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all duration-300 z-50 transform translate-y-1 group-hover/tooltip:translate-y-0 whitespace-nowrap">
                  <p className="font-medium leading-none">{t('deck.export')}</p>
                </div>
              )}
            </div>

            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 rounded-xl shadow-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadDecFile();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <FaDownload className="text-purple-500 shrink-0" />
                  {t('strategy.downloadDec')} (.dec)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadAsJson(selectedDeck || { cards }, `${selectedDeck?.name || 'deck'}.json`);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <FaDownload className="text-emerald-500 shrink-0" />
                  {t('export.downloadJson') || 'Download'} (.json)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCopyArenaFormat();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <FaClipboardList className="text-amber-500 shrink-0" />
                  {t('strategy.exportArena')} (Arena)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCopyDeckList();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <FaCopy className="text-blue-500 shrink-0" />
                  {t('deck.copyList')} (.txt)
                </button>
              </div>
            )}
          </div>

          {/* Print Proxies */}
          {onPrintProxies && (
            <div className="relative group/tooltip inline-flex items-center">
              <button
                type="button"
                onClick={onPrintProxies}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-emerald-500/20 active:scale-95"
                aria-label={t('print.printProxies')}
              >
                <FaPrint className="text-sm shrink-0" />
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-slate-900 dark:bg-slate-950 text-white text-[11px] text-center rounded-lg shadow-xl border border-slate-700 dark:border-slate-800 opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all duration-300 z-50 transform translate-y-1 group-hover/tooltip:translate-y-0 whitespace-nowrap">
                <p className="font-medium leading-none">{t('print.printProxies')}</p>
              </div>
            </div>
          )}

          {/* Playtest button */}
          <div className="relative group/tooltip inline-flex items-center">
            <button
              id="playtest-btn"
              type="button"
              onClick={onPlaytest}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white transition-all duration-300 shadow-md hover:shadow-orange-500/40 active:scale-95 relative overflow-hidden group/playbtn"
              aria-label={t('playtest.playtest')}
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover/playbtn:scale-x-100 origin-left transition-transform duration-500 ease-out" />
              <FaDiceD20 className="text-sm shrink-0 relative z-10 group-hover/playbtn:animate-spin-slow" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-slate-900 dark:bg-slate-950 text-white text-[11px] text-center rounded-lg shadow-xl border border-slate-700 dark:border-slate-800 opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all duration-300 z-50 transform translate-y-1 group-hover/tooltip:translate-y-0 whitespace-nowrap">
              <p className="font-medium leading-none">{t('playtest.playtest')}</p>
            </div>
          </div>
        </>
      )}

      {selectedDeck && onLoadDeckToEdit && (
        <div className="relative group/tooltip inline-flex items-center">
          <button
            type="button"
            onClick={onLoadDeckToEdit}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
            aria-label={t('common.edit')}
          >
            <FaEdit className="text-sm shrink-0" />
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-slate-900 dark:bg-slate-950 text-white text-[11px] text-center rounded-lg shadow-xl border border-slate-700 dark:border-slate-800 opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all duration-300 z-50 transform translate-y-1 group-hover/tooltip:translate-y-0 whitespace-nowrap">
            <p className="font-medium leading-none">{t('common.edit')}</p>
          </div>
        </div>
      )}

      {onDeselectDeck && (
        <div className="relative group/tooltip inline-flex items-center">
          <button
            type="button"
            onClick={onDeselectDeck}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
            aria-label={t('common.cancel')}
          >
            <FaTimes className="text-sm shrink-0" />
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-slate-900 dark:bg-slate-950 text-white text-[11px] text-center rounded-lg shadow-xl border border-slate-700 dark:border-slate-800 opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all duration-300 z-50 transform translate-y-1 group-hover/tooltip:translate-y-0 whitespace-nowrap">
            <p className="font-medium leading-none">{t('common.cancel')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeckActionBar;
