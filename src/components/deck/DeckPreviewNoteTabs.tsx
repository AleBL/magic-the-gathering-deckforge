import { useTranslation } from 'react-i18next';
import { LuChartColumn, LuLayers, LuPencil } from 'react-icons/lu';

export type DeckPreviewNoteTab = 'cards' | 'stats' | 'notes';

interface DeckPreviewNoteTabsProps {
  readonly activeNoteTab: DeckPreviewNoteTab;
  readonly isStatsTabActive: boolean;
  readonly onSelectCardsTab: () => void;
  readonly onSelectStatsTab: () => void;
  readonly onSelectNotesTab: () => void;
}

/** The cards / stats / notes tab bar above a deck's content. */
export function DeckPreviewNoteTabs({
  activeNoteTab,
  isStatsTabActive,
  onSelectCardsTab,
  onSelectStatsTab,
  onSelectNotesTab
}: DeckPreviewNoteTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="deck-content-tab-bar">
      <button
        type="button"
        onClick={onSelectCardsTab}
        className={`deck-content-tab ${activeNoteTab === 'cards' ? 'deck-content-tab-active' : ''}`}
      >
        <LuLayers className="text-sm" /> {t('deck.tabCards')}
      </button>
      <button
        type="button"
        onClick={onSelectStatsTab}
        className={`deck-content-tab ${isStatsTabActive ? 'deck-content-tab-active' : ''}`}
      >
        <LuChartColumn className="text-sm" /> {t('deck.tabAnalysis')}
      </button>
      <button
        type="button"
        onClick={onSelectNotesTab}
        className={`deck-content-tab ${activeNoteTab === 'notes' ? 'deck-content-tab-active' : ''}`}
      >
        <LuPencil className="text-sm" /> {t('deck.tabNotes')}
      </button>
    </div>
  );
}
