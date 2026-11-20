import { useTranslation } from 'react-i18next';
import { LuCheck } from 'react-icons/lu';
import { ProfileMenuBackHeader } from './ProfileMenuBackHeader';
import { PROFILE_MENU_LANGUAGES, ProfileMenuLanguageOption } from './profileMenuLanguages';

interface ProfileMenuLanguageSectionProps {
  readonly currentLang: ProfileMenuLanguageOption;
  readonly onSelectLanguage: (key: string) => void;
  readonly onBack: () => void;
  readonly onClose: () => void;
}

export function ProfileMenuLanguageSection({
  currentLang,
  onSelectLanguage,
  onBack,
  onClose
}: ProfileMenuLanguageSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      <ProfileMenuBackHeader title={t('common.language')} onBack={onBack} onClose={onClose} />
      <div className="profile-menu-divider" />
      {PROFILE_MENU_LANGUAGES.map((lang) => (
        <button
          key={lang.key}
          type="button"
          onClick={() => onSelectLanguage(lang.key)}
          className="profile-menu-item"
          role="menuitem"
        >
          <div className="flex items-center gap-2.5">
            <img src={lang.iconPath} alt={lang.label} className="w-5 h-5 rounded-full object-cover shadow-sm" />
            <span className="font-medium text-fg">{lang.label}</span>
          </div>
          {currentLang.key === lang.key ? <LuCheck className="text-accent text-xs" /> : null}
        </button>
      ))}
    </>
  );
}
