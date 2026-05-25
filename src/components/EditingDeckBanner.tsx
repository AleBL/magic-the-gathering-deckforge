import { useTranslation } from 'react-i18next';

interface EditingDeckBannerProps {
  deckName: string;
  deckFormat: string;
  cardCount: number;
  onGoToDecks: () => void;
  onCancelEdit: () => void;
}

function EditingDeckBanner({ deckName, deckFormat, cardCount, onGoToDecks, onCancelEdit }: EditingDeckBannerProps) {
  const { t } = useTranslation();

  return (
    <div className="editing-banner">
      <div className="flex items-center gap-2">
        <span className="banner-status-dot" />
        <span>
          {t('editingDeck')}: <span className="font-bold">{deckName}</span> ({t(deckFormat)}) — {cardCount} {t('cards')}
        </span>
      </div>
      <div className="flex gap-2">
        <button onClick={onGoToDecks} className="banner-button-secondary">
          {t('decksTab')}
        </button>
        <button onClick={onCancelEdit} className="banner-button-danger">
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}

export default EditingDeckBanner;
