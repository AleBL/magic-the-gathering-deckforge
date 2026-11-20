import { useTranslation } from 'react-i18next';
import { ProfileMenuBackHeader } from './ProfileMenuBackHeader';

interface ProfileMenuHelpSectionProps {
  readonly shortcuts: readonly { keys: readonly string[]; label: string }[];
  readonly onBack: () => void;
  readonly onClose: () => void;
}

export function ProfileMenuHelpSection({ shortcuts, onBack, onClose }: ProfileMenuHelpSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      <ProfileMenuBackHeader title={t('strategy.keyboardShortcuts')} onBack={onBack} onClose={onClose} />
      <div className="profile-menu-divider" />
      <div className="p-4 space-y-2.5">
        {shortcuts.map((sc, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className="text-xs text-fg-secondary flex-1">{sc.label}</span>
            <div className="flex items-center gap-1 shrink-0">
              {sc.keys.map((k) => (
                <kbd
                  key={k}
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border border-line-strong bg-surface-2 text-fg-secondary shadow-sm"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
