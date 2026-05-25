import { useTranslation } from 'react-i18next';
import { FaList, FaTh, FaLayerGroup } from 'react-icons/fa';

type ViewMode = 'list' | 'grid' | 'stack';

interface DeckViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

function DeckViewToggle({ viewMode, onViewModeChange }: DeckViewToggleProps) {
  const { t } = useTranslation();

  const btnClass = (mode: ViewMode) =>
    `flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
      viewMode === mode
        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
    }`;

  return (
    <div className="inline-flex rounded-lg bg-gray-200 dark:bg-gray-700 p-0.5 border border-gray-350 dark:border-gray-600 mr-1 shadow-sm shrink-0">
      <button type="button" onClick={() => onViewModeChange('list')} className={btnClass('list')} title={t('listView')}>
        <FaList className="text-[9px]" />
        <span>{t('listView')}</span>
      </button>
      <button type="button" onClick={() => onViewModeChange('grid')} className={btnClass('grid')} title={t('gridView')}>
        <FaTh className="text-[9px]" />
        <span>{t('gridView')}</span>
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('stack')}
        className={btnClass('stack')}
        title={t('stackView')}
      >
        <FaLayerGroup className="text-[9px]" />
        <span>{t('stackView')}</span>
      </button>
    </div>
  );
}

export default DeckViewToggle;
