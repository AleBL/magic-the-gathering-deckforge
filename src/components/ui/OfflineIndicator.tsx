import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle } from 'react-icons/fa';

function OfflineIndicator() {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-semibold text-amber-900 dark:text-amber-100 bg-amber-400/95 dark:bg-amber-600/90 shrink-0"
      role="status"
      aria-live="polite"
    >
      <FaExclamationTriangle className="text-xs shrink-0" />
      <span>{t('common.offlineIndicator')}</span>
    </div>
  );
}

export default OfflineIndicator;
