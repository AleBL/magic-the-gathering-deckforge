import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaBook, FaSave, FaFlask, FaTrash, FaSun, FaMoon, FaKeyboard, FaGlobe } from 'react-icons/fa';
import { useDeckStore } from '../store/useDeckStore';
import { SUPPORTED_LANGUAGES } from '../constants';

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  keywords: string;
  run: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: 'search' | 'deck') => void;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onShowShortcuts: () => void;
}

const LANGUAGE_LABELS: Record<string, string> = { en: 'English', pt: 'Português', es: 'Español' };

/** Fuzzy-ish command launcher opened with Ctrl/Cmd+K. */
export default function CommandPalette({
  isOpen,
  onClose,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  onShowShortcuts
}: CommandPaletteProps) {
  const { t, i18n } = useTranslation();
  const setPendingAction = useDeckStore((state) => state.setPendingAction);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (action: () => void) => {
    action();
    onClose();
  };

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      {
        id: 'search',
        label: t('commandPalette.goToSearch'),
        icon: <FaSearch />,
        keywords: 'search buscar cards cartas find',
        run: () => {
          setActiveTab('search');
          setPendingAction('focus-search');
        }
      },
      {
        id: 'decks',
        label: t('commandPalette.goToDecks'),
        icon: <FaBook />,
        keywords: 'deck decks mazo manager',
        run: () => setActiveTab('deck')
      },
      {
        id: 'save',
        label: t('commandPalette.saveDeck'),
        hint: 'Ctrl+S',
        icon: <FaSave />,
        keywords: 'save salvar guardar deck',
        run: () => {
          setActiveTab('deck');
          setPendingAction('save-deck');
        }
      },
      {
        id: 'playtest',
        label: t('commandPalette.playtest'),
        hint: 'Ctrl+P',
        icon: <FaFlask />,
        keywords: 'playtest simular test jugar jogar',
        run: () => {
          setActiveTab('deck');
          setPendingAction('playtest-deck');
        }
      },
      {
        id: 'clear',
        label: t('commandPalette.clearDeck'),
        hint: 'Ctrl+Shift+N',
        icon: <FaTrash />,
        keywords: 'clear limpar limpiar deck reset',
        run: () => {
          setActiveTab('deck');
          setPendingAction('clear-deck');
        }
      },
      {
        id: 'theme',
        label: isDarkMode ? t('commandPalette.lightMode') : t('commandPalette.darkMode'),
        icon: isDarkMode ? <FaSun /> : <FaMoon />,
        keywords: 'theme tema dark light claro escuro modo',
        run: () => setIsDarkMode((prev) => !prev)
      },
      {
        id: 'shortcuts',
        label: t('commandPalette.shortcuts'),
        hint: '?',
        icon: <FaKeyboard />,
        keywords: 'shortcuts atalhos atajos keyboard teclado help',
        run: onShowShortcuts
      }
    ];

    const languageCommands: Command[] = SUPPORTED_LANGUAGES.map((lng) => ({
      id: `lang-${lng}`,
      label: `${t('commandPalette.language')}: ${LANGUAGE_LABELS[lng] ?? lng}`,
      icon: <FaGlobe />,
      keywords: `language idioma ${lng} ${LANGUAGE_LABELS[lng] ?? ''}`,
      run: () => i18n.changeLanguage(lng)
    }));

    return [...base, ...languageCommands];
  }, [t, i18n, isDarkMode, setActiveTab, setIsDarkMode, setPendingAction, onShowShortcuts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.keywords}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Focus after the portal mounts.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const command = filtered[selectedIndex];
      if (command) run(command.run);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-toast)] flex items-start justify-center pt-[15vh] px-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-dropdownEnter"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-slate-800">
          <FaSearch className="text-gray-400 shrink-0 text-sm" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('commandPalette.placeholder')}
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-slate-100 placeholder-gray-400 outline-none"
          />
          <kbd className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t('commandPalette.noResults')}</p>
          ) : (
            filtered.map((command, index) => (
              <button
                key={command.id}
                type="button"
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => run(command.run)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  index === selectedIndex
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="text-sm shrink-0 opacity-80">{command.icon}</span>
                <span className="flex-1 text-sm font-medium">{command.label}</span>
                {command.hint && (
                  <kbd className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-1.5 py-0.5">
                    {command.hint}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
