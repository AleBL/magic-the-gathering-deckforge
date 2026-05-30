import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaUser,
  FaChevronDown,
  FaInfoCircle,
  FaKeyboard,
  FaGithub,
  FaTimes,
  FaMoon,
  FaSun,
  FaGlobeAmericas,
  FaCheck
} from 'react-icons/fa';

interface ProfileMenuProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

const APP_VERSION = '0.1.0';

function ProfileMenu({ isDarkMode, setIsDarkMode }: ProfileMenuProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'main' | 'about' | 'help' | 'language'>('main');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSection('main');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    {
      key: 'en',
      label: 'English',
      iconPath: new URL(`../assets/locales/en.svg`, import.meta.url).href
    },
    {
      key: 'pt',
      label: 'Português',
      iconPath: new URL(`../assets/locales/pt.svg`, import.meta.url).href
    },
    {
      key: 'es',
      label: 'Español',
      iconPath: new URL(`../assets/locales/es.svg`, import.meta.url).href
    }
  ];

  const currentLang = languages.find((l) => l.key === (i18n.language?.split('-')[0] || 'en')) || languages[0];

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    const safeWindow = window as unknown as {
      ipcRenderer?: { send: (channel: string, data: string) => void };
    };
    if (safeWindow.ipcRenderer) {
      safeWindow.ipcRenderer.send('change-language', lang);
    }
    setActiveSection('main');
  };

  const shortcuts = [
    { keys: ['Ctrl', 'F'], label: t('shortcutSearch') },
    { keys: ['Ctrl', 'S'], label: t('shortcutSave') },
    { keys: ['Ctrl', 'P'], label: t('shortcutPlaytest') },
    { keys: ['Ctrl', 'Shift', 'N'], label: t('shortcutClear') }
  ];

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (isOpen) setActiveSection('main');
  };

  return (
    <div className="profile-menu-wrapper" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="profile-menu-trigger"
        aria-label={t('profileMenu')}
        title={t('profileMenu')}
      >
        <div className="profile-avatar">
          <FaUser className="text-xs text-white" />
        </div>
        <FaChevronDown
          className={`text-gray-500 dark:text-gray-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="profile-menu-panel animate-fadeIn">
          {/* ── MAIN SECTION ── */}
          {activeSection === 'main' && (
            <>
              {/* Header badge */}
              <div className="profile-menu-header">
                <div className="flex items-center gap-3">
                  <div className="profile-avatar-lg">
                    <FaUser className="text-sm text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">MTG Deck Forge</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('version')} {APP_VERSION}
                    </p>
                  </div>
                </div>
              </div>

              <div className="profile-menu-divider" />

              {/* Dark Mode Toggle */}
              <div className="profile-menu-row">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  {isDarkMode ? (
                    <FaMoon className="text-indigo-400 text-sm" />
                  ) : (
                    <FaSun className="text-amber-400 text-sm" />
                  )}
                  <span className="text-sm font-medium">{isDarkMode ? t('darkMode') : t('lightMode')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`profile-toggle ${isDarkMode ? 'profile-toggle-on' : 'profile-toggle-off'}`}
                  aria-label={isDarkMode ? t('lightMode') : t('darkMode')}
                >
                  <span className={`profile-toggle-thumb ${isDarkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Language */}
              <button
                type="button"
                className="profile-menu-item"
                onClick={() => setActiveSection('language')}
              >
                <div className="flex items-center gap-2">
                  <FaGlobeAmericas className="text-blue-500 text-sm shrink-0" />
                  <span>{t('language')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <img src={currentLang.iconPath} alt={currentLang.label} className="w-4 h-4 rounded-full object-cover" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{currentLang.label}</span>
                  <FaChevronDown className="text-gray-400 text-xs -rotate-90" />
                </div>
              </button>

              <div className="profile-menu-divider" />

              {/* About */}
              <button
                type="button"
                className="profile-menu-item"
                onClick={() => setActiveSection('about')}
              >
                <div className="flex items-center gap-2">
                  <FaInfoCircle className="text-purple-500 text-sm shrink-0" />
                  <span>{t('aboutApp')}</span>
                </div>
                <FaChevronDown className="text-gray-400 text-xs -rotate-90" />
              </button>

              {/* Help */}
              <button
                type="button"
                className="profile-menu-item"
                onClick={() => setActiveSection('help')}
              >
                <div className="flex items-center gap-2">
                  <FaKeyboard className="text-green-500 text-sm shrink-0" />
                  <span>{t('help')}</span>
                </div>
                <FaChevronDown className="text-gray-400 text-xs -rotate-90" />
              </button>

              {/* GitHub */}
              <a
                href="https://github.com/AleBL/magic-the-gathering-search"
                target="_blank"
                rel="noopener noreferrer"
                className="profile-menu-item"
              >
                <div className="flex items-center gap-2">
                  <FaGithub className="text-gray-600 dark:text-gray-300 text-sm shrink-0" />
                  <span>{t('gitHub')}</span>
                </div>
                <span className="text-xs text-gray-400">↗</span>
              </a>
            </>
          )}

          {/* ── LANGUAGE SECTION ── */}
          {activeSection === 'language' && (
            <>
              <div className="profile-menu-back-header">
                <button type="button" onClick={() => setActiveSection('main')} className="profile-back-btn">
                  <FaChevronDown className="rotate-90 text-xs" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{t('language')}</span>
                </button>
                <button type="button" onClick={() => { setIsOpen(false); setActiveSection('main'); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded">
                  <FaTimes className="text-xs" />
                </button>
              </div>
              <div className="profile-menu-divider" />
              {languages.map((lang) => (
                <button
                  key={lang.key}
                  type="button"
                  onClick={() => changeLanguage(lang.key)}
                  className="profile-menu-item"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={lang.iconPath} alt={lang.label} className="w-5 h-5 rounded-full object-cover shadow-sm" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">{lang.label}</span>
                  </div>
                  {currentLang.key === lang.key && (
                    <FaCheck className="text-blue-500 text-xs" />
                  )}
                </button>
              ))}
            </>
          )}

          {/* ── ABOUT SECTION ── */}
          {activeSection === 'about' && (
            <>
              <div className="profile-menu-back-header">
                <button type="button" onClick={() => setActiveSection('main')} className="profile-back-btn">
                  <FaChevronDown className="rotate-90 text-xs" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{t('aboutApp')}</span>
                </button>
                <button type="button" onClick={() => { setIsOpen(false); setActiveSection('main'); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded">
                  <FaTimes className="text-xs" />
                </button>
              </div>
              <div className="profile-menu-divider" />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="profile-avatar-lg">
                    <FaUser className="text-sm text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">MTG Deck Forge</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('version')} {APP_VERSION} · MIT</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{t('appDescription')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Alessandro Barros</p>
                <a
                  href="https://github.com/AleBL/magic-the-gathering-search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <FaGithub />
                  {t('gitHub')}
                </a>
              </div>
            </>
          )}

          {/* ── HELP / KEYBOARD SHORTCUTS SECTION ── */}
          {activeSection === 'help' && (
            <>
              <div className="profile-menu-back-header">
                <button type="button" onClick={() => setActiveSection('main')} className="profile-back-btn">
                  <FaChevronDown className="rotate-90 text-xs" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{t('keyboardShortcuts')}</span>
                </button>
                <button type="button" onClick={() => { setIsOpen(false); setActiveSection('main'); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded">
                  <FaTimes className="text-xs" />
                </button>
              </div>
              <div className="profile-menu-divider" />
              <div className="p-4 space-y-2.5">
                {shortcuts.map((sc, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">{sc.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
