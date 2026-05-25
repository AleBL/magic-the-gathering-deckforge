import { useTranslation } from 'react-i18next';

interface DeckZoneTabsProps {
  mainCount: number;
  sideCount: number;
  maybeCount: number;
  activeZone: 'main' | 'sideboard' | 'maybeboard';
  onZoneChange: (zone: 'main' | 'sideboard' | 'maybeboard') => void;
}

function DeckZoneTabs({ mainCount, sideCount, maybeCount, activeZone, onZoneChange }: DeckZoneTabsProps) {
  const { t } = useTranslation();

  const tabClass = (zone: string) =>
    `px-3 py-1.5 rounded-t-lg transition-all text-xs font-semibold ${
      activeZone === zone
        ? 'bg-blue-600 text-white font-extrabold shadow-sm'
        : 'bg-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
    }`;

  return (
    <div className="flex border-b border-gray-200 dark:border-slate-800 mb-4 text-xs font-semibold gap-2 select-none">
      <button type="button" onClick={() => onZoneChange('main')} className={tabClass('main')}>
        {t('mainDeck')} ({mainCount})
      </button>
      <button type="button" onClick={() => onZoneChange('sideboard')} className={tabClass('sideboard')}>
        {t('sideboard')} ({sideCount})
      </button>
      <button type="button" onClick={() => onZoneChange('maybeboard')} className={tabClass('maybeboard')}>
        {t('maybeboard')} ({maybeCount})
      </button>
    </div>
  );
}

export default DeckZoneTabs;
