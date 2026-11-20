import { useTranslation } from 'react-i18next';
import { FaUser, FaGithub } from 'react-icons/fa';
import { APP_VERSION, AUTHOR_NAME, GITHUB_REPO_URL, APP_NAME } from '../../constants';
import { ProfileMenuBackHeader } from './ProfileMenuBackHeader';

interface ProfileMenuAboutSectionProps {
  readonly onBack: () => void;
  readonly onClose: () => void;
}

export function ProfileMenuAboutSection({ onBack, onClose }: ProfileMenuAboutSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      <ProfileMenuBackHeader title={t('strategy.aboutApp')} onBack={onBack} onClose={onClose} />
      <div className="profile-menu-divider" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="profile-avatar-lg">
            <FaUser className="text-sm text-white" />
          </div>
          <div>
            <p className="font-bold text-fg text-sm">{APP_NAME}</p>
            <p className="text-xs text-fg-muted">
              {t('strategy.version')} {APP_VERSION} · MIT
            </p>
          </div>
        </div>
        <p className="text-xs text-fg-secondary leading-relaxed">{t('strategy.appDescription')}</p>
        <p className="text-xs text-fg-muted">{AUTHOR_NAME}</p>
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
        >
          <FaGithub />
          {t('strategy.gitHub')}
        </a>
      </div>
    </>
  );
}
