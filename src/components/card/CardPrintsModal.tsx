import { useTranslation } from 'react-i18next';
import { FaTimes, FaSpinner, FaPalette } from 'react-icons/fa';
import { Card } from '../../types/Card';
import { CardWithScryfallMetadata } from '../../types/Scryfall';
import { useCardPrints } from '../../hooks/useCardPrints';

interface CardPrintsModalProps {
  cardName: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectPrint: (selectedCard: Card) => void;
}

export function CardPrintsModal({ cardName, isOpen, onClose, onSelectPrint }: CardPrintsModalProps) {
  const { t } = useTranslation();
  const { prints, isLoading } = useCardPrints(cardName);

  if (!isOpen) return null;

  const getCardFaceImageUrl = (printCard: Card): string => {
    if (printCard.selectedPrintImageUri) return printCard.selectedPrintImageUri;
    const imageUris = printCard.image_uris ?? printCard.card_faces?.[0]?.image_uris;
    if (!imageUris) return '';
    if (printCard.image_uris?.gatherer) return printCard.image_uris.gatherer;
    return imageUris.normal || imageUris.large || '';
  };

  const handleSelectPrint = (printCard: Card) => {
    const imageUrl = getCardFaceImageUrl(printCard);

    // Pass the printCard with selectedPrintId and selectedPrintImageUri set
    const updatedCard: Card = {
      ...printCard,
      selectedPrintId: printCard.id,
      selectedPrintImageUri: imageUrl
    };

    onSelectPrint(updatedCard);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FaPalette className="text-pink-500" />
            {t('cardDetails.otherVersions')} &mdash; {cardName}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-all"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <FaSpinner className="text-3xl text-pink-500 animate-spin" />
              <p className="text-sm font-semibold">{t('cardDetails.loadingAlternateArts')}</p>
            </div>
          ) : prints.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-500">
              <FaPalette className="text-3xl" />
              <p className="text-sm italic">{t('cardDetails.noArtFound')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {prints.map((printCard: CardWithScryfallMetadata) => {
                const imgUrl = getCardFaceImageUrl(printCard);
                const printMetadata = printCard as CardWithScryfallMetadata;
                const collectorNumber = printMetadata.collector_number || '';
                const artist = printMetadata.artist || '';

                return (
                  <div
                    key={printCard.id}
                    onClick={() => handleSelectPrint(printCard)}
                    className="border border-slate-800 hover:border-pink-500/50 bg-slate-950/40 hover:bg-pink-500/5 rounded-xl p-2.5 flex flex-col items-center justify-between cursor-pointer transition-all duration-300 hover:scale-102 group shadow-sm hover:shadow-lg"
                  >
                    {/* Visual Card image */}
                    <div className="relative w-full h-44 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center mb-3">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={`${printCard.name} - ${printCard.set_name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-[10px] text-slate-500 font-bold p-2 text-center">{printCard.name}</div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="w-full text-left space-y-0.5">
                      <h4 className="text-[11px] font-bold text-slate-200 truncate leading-tight group-hover:text-pink-400 transition-colors">
                        {printCard.set_name} ({printCard.set?.toUpperCase()})
                      </h4>
                      {collectorNumber && <p className="text-[9px] text-slate-500">#{collectorNumber}</p>}
                      {artist && (
                        <p className="text-[9px] text-slate-400 truncate italic">
                          {t('cardDetails.artBy', { artist })}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      className="mt-3 w-full justify-center bg-pink-500/20 text-pink-400 border border-pink-500/20 hover:bg-pink-500 hover:text-white rounded-lg py-1.5 text-[9px] font-bold transition-all uppercase tracking-wider"
                    >
                      {t('cardDetails.selectArt')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
