import { useTranslation } from 'react-i18next';
import {
  LuChevronDown,
  LuDownload,
  LuEarth,
  LuGithub,
  LuInfo,
  LuKeyboard,
  LuMoon,
  LuShield,
  LuSun,
  LuUser,
  LuWandSparkles,
  LuSwords
} from 'react-icons/lu';
import { APP_VERSION, APP_NAME } from '../../constants';
import { ProfileMenuLanguageOption } from './profileMenuLanguages';

interface ProfileMenuMainSectionProps {
  readonly isDarkMode: boolean;
  readonly setIsDarkMode: (value: boolean) => void;
  readonly effectsEnabled: boolean;
  readonly setEffectsEnabled: (value: boolean) => void;
  readonly currentLang: ProfileMenuLanguageOption;
  readonly canInstall: boolean;
  readonly onInstall: () => void;
  readonly onOpenLanguage: () => void;
  readonly onOpenBackup: () => void;
  readonly onOpenAbout: () => void;
  readonly onOpenHelp: () => void;
  readonly onOpenLifeCounter: () => void;
}

/** The profile menu's landing list: theme/effects toggles and links into the other sections. */
export function ProfileMenuMainSection({
  isDarkMode,
  setIsDarkMode,
  effectsEnabled,
  setEffectsEnabled,
  currentLang,
  canInstall,
  onInstall,
  onOpenLanguage,
  onOpenBackup,
  onOpenAbout,
  onOpenHelp,
  onOpenLifeCounter
}: ProfileMenuMainSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="profile-menu-header">
        <div className="flex items-center gap-3">
          <div className="profile-avatar-lg">
            <LuUser className="text-sm" />
          </div>
          <div>
            <p className="text-sm font-semibold text-fg">{APP_NAME}</p>
            <p className="text-xs text-fg-muted">
              {t('strategy.version')} {APP_VERSION}
            </p>
          </div>
        </div>
      </div>

      <div className="profile-menu-divider" />

      <div className="profile-menu-row">
        <div className="flex items-center gap-2 text-fg-secondary">
          {isDarkMode ? <LuMoon className="text-accent text-sm" /> : <LuSun className="text-warning text-sm" />}
          <span className="text-sm font-medium">{isDarkMode ? t('common.darkMode') : t('common.lightMode')}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`profile-toggle ${isDarkMode ? 'profile-toggle-on' : 'profile-toggle-off'}`}
          aria-label={isDarkMode ? t('common.lightMode') : t('common.darkMode')}
        >
          <span className={`profile-toggle-thumb ${isDarkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="profile-menu-row">
        <div className="flex items-center gap-2 text-fg-secondary">
          <LuWandSparkles className={`text-sm ${effectsEnabled ? 'text-accent' : 'text-gray-400'}`} />
          <span className="text-sm font-medium">{t('common.visualEffects')}</span>
        </div>
        <button
          type="button"
          onClick={() => setEffectsEnabled(!effectsEnabled)}
          className={`profile-toggle ${effectsEnabled ? 'profile-toggle-on' : 'profile-toggle-off'}`}
          aria-label={t('common.visualEffects')}
          aria-pressed={effectsEnabled}
        >
          <span className={`profile-toggle-thumb ${effectsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <button type="button" className="profile-menu-item" onClick={onOpenLanguage} role="menuitem">
        <div className="flex items-center gap-2">
          <LuEarth className="text-fg-muted text-sm shrink-0" />
          <span>{t('common.language')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <img src={currentLang.iconPath} alt={currentLang.label} className="w-4 h-4 rounded-full object-cover" />
          <span className="text-xs text-fg-muted">{currentLang.label}</span>
          <LuChevronDown className="text-gray-400 text-xs -rotate-90" />
        </div>
      </button>

      {canInstall ? (
        <button type="button" className="profile-menu-item" onClick={onInstall} role="menuitem">
          <div className="flex items-center gap-2">
            <LuDownload className="text-fg-muted text-sm shrink-0" />
            <span>{t('common.installApp')}</span>
          </div>
        </button>
      ) : null}

      <div className="profile-menu-divider" />

      <button type="button" className="profile-menu-item" onClick={onOpenBackup} role="menuitem">
        <div className="flex items-center gap-2">
          <LuShield className="text-fg-muted text-sm shrink-0" />
          <span>{t('backup.title')}</span>
        </div>
        <LuChevronDown className="text-gray-400 text-xs -rotate-90" />
      </button>

      <button type="button" className="profile-menu-item" onClick={onOpenAbout} role="menuitem">
        <div className="flex items-center gap-2">
          <LuInfo className="text-fg-muted text-sm shrink-0" />
          <span>{t('strategy.aboutApp')}</span>
        </div>
        <LuChevronDown className="text-gray-400 text-xs -rotate-90" />
      </button>

      <button type="button" className="profile-menu-item" onClick={onOpenLifeCounter} role="menuitem">
        <div className="flex items-center gap-2">
          <LuSwords className="text-fg-muted text-sm shrink-0" />
          <span>{t('lifeCounter.title')}</span>
        </div>
      </button>

      {/* Keyboard-shortcuts reference — hidden below sm: no physical
          keyboard on phone-width screens, so the shortcuts are unusable there. */}
      <button type="button" className="profile-menu-item hidden sm:flex" onClick={onOpenHelp} role="menuitem">
        <div className="flex items-center gap-2">
          <LuKeyboard className="text-fg-muted text-sm shrink-0" />
          <span>{t('common.help')}</span>
        </div>
        <LuChevronDown className="text-gray-400 text-xs -rotate-90" />
      </button>

      <a
        href="https://github.com/AleBL/magic-the-gathering-search"
        target="_blank"
        rel="noopener noreferrer"
        className="profile-menu-item"
        role="menuitem"
      >
        <div className="flex items-center gap-2">
          <LuGithub className="text-fg-secondary text-sm shrink-0" />
          <span>{t('strategy.gitHub')}</span>
        </div>
        <span className="text-xs text-gray-400">↗</span>
      </a>
    </>
  );
}
