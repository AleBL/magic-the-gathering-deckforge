import { useTranslation } from 'react-i18next';
import { LuTriangleAlert } from 'react-icons/lu';

function OfflineIndicator() {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-semibold text-on-warning bg-warning shrink-0"
      role="status"
      aria-live="polite"
    >
      <LuTriangleAlert className="text-xs shrink-0" />
      <span>{t('common.offlineIndicator')}</span>
    </div>
  );
}

export default OfflineIndicator;
