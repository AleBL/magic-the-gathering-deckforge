import { useTranslation } from 'react-i18next';
import { FaCrown, FaShieldAlt } from 'react-icons/fa';
import { Card, CardFace } from '../../types/Card';
import { parseTextWithSymbols } from '../../utils/symbolHelper';
import { DECK_FORMATS, LEGALITY } from '../../types/enums';
import { formatLabelKey } from '../../utils/formatLabel';

interface CardDetailDataProps {
  readonly card: Card;
  readonly currentFace: CardFace | null | undefined;
  readonly hidePriceAndLegality: boolean;
  readonly isToken: boolean;
  /** Renders every face stacked (split/aftermath cards, whose text lives only in
   *  the faces and must all be shown at once — there is no side to flip to). */
  readonly allFaces?: CardFace[] | null;
}

/** Name / type / mana / text / P–T block for one face or the whole card.
 *  Both `Card` and `CardFace` are assignable to this shape. */
interface FaceLike {
  name: string;
  printed_name?: string;
  type_line: string;
  printed_type_line?: string;
  mana_cost?: string;
  oracle_text?: string;
  printed_text?: string;
  power?: string;
  toughness?: string;
}

export function CardDetailData({ card, currentFace, hidePriceAndLegality, isToken, allFaces }: CardDetailDataProps) {
  const { t } = useTranslation();

  const renderFaceBlock = (source: FaceLike, key?: string | number) => (
    <div key={key} className="space-y-1">
      <p className="text-fg-secondary transition-colors duration-300 font-semibold">
        {source.printed_name || source.name}
      </p>
      <p className="text-fg-secondary transition-colors duration-300">{source.printed_type_line || source.type_line}</p>
      {source.mana_cost && (
        <p className="text-warning transition-colors duration-300 flex items-center flex-wrap gap-1">
          {t('cardDetails.manaCostLabel')}: {parseTextWithSymbols(source.mana_cost, true)}
        </p>
      )}
      {(source.printed_text || source.oracle_text) && (
        <p className="text-fg-secondary whitespace-pre-line transition-colors duration-300 leading-relaxed">
          {parseTextWithSymbols(source.printed_text || source.oracle_text)}
        </p>
      )}
      {source.power && source.toughness && (
        <p className="text-success dark:text-success transition-colors duration-300">
          {t('cardDetails.powerToughnessLabel')}: {source.power}/{source.toughness}
        </p>
      )}
    </div>
  );

  const showAllFaces = !!allFaces && allFaces.length > 1;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="modal-card-title" className="text-2xl font-bold">
          {currentFace ? currentFace.printed_name || currentFace.name : card.printed_name || card.name}
        </h2>
        {card.isCommander && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-warning-soft text-warning border border-warning/40 shadow-sm animate-pulse">
            <FaCrown className="text-warning text-xs shrink-0" />
            {t('cardDetails.commanderBadge')}
          </span>
        )}
      </div>

      {showAllFaces ? (
        <div className="flex flex-col gap-3 divide-y divide-line [&>*+*]:pt-3">
          {allFaces!.map((face, index) => renderFaceBlock(face, index))}
        </div>
      ) : (
        <>
          <p className="text-fg-secondary transition-colors duration-300">
            {currentFace
              ? currentFace.printed_type_line || currentFace.type_line
              : card.printed_type_line || card.type_line}
          </p>
          {((currentFace && currentFace.mana_cost) || card.mana_cost) && (
            <p className="text-warning transition-colors duration-300 flex items-center flex-wrap gap-1">
              {t('cardDetails.manaCostLabel')}:{' '}
              {parseTextWithSymbols(currentFace ? currentFace.mana_cost : card.mana_cost, true)}
            </p>
          )}
          {((currentFace && (currentFace.printed_text || currentFace.oracle_text)) ||
            card.printed_text ||
            card.oracle_text) && (
            <div>
              <h3 className="font-semibold mb-1">{t('cardDetails.textLabel')}:</h3>
              <p className="text-fg-secondary whitespace-pre-line transition-colors duration-300 leading-relaxed">
                {parseTextWithSymbols(
                  currentFace
                    ? currentFace.printed_text || currentFace.oracle_text
                    : card.printed_text || card.oracle_text
                )}
              </p>
            </div>
          )}
          {((currentFace && currentFace.power && currentFace.toughness) || (card.power && card.toughness)) && (
            <p className="text-success dark:text-success transition-colors duration-300">
              {t('cardDetails.powerToughnessLabel')}: {currentFace ? currentFace.power : card.power}/
              {currentFace ? currentFace.toughness : card.toughness}
            </p>
          )}
        </>
      )}
      <p className="text-fg-secondary transition-colors duration-300">
        {t('cardDetails.rarityLabel')}: {t(`search.${card.rarity.toLowerCase()}`, { defaultValue: card.rarity })}
      </p>
      <p className="text-fg-secondary transition-colors duration-300">
        {t('cardDetails.setLabel')}: {card.set_name}
      </p>

      {!isToken && !hidePriceAndLegality && (
        <div className="border-t border-line pt-3">
          <h3 className="font-semibold mb-2 text-sm text-fg-muted uppercase tracking-wider">{t('stats.prices')}:</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-surface-2/50 border border-line rounded-lg p-2 text-center">
              <span className="block text-xs text-gray-500">{t('common.usd')}</span>
              <span className="font-semibold text-sm text-fg">
                {card.prices?.usd ? `$${card.prices.usd}` : t('common.priceNotAvailable')}
              </span>
            </div>
            <div className="bg-surface-2/50 border border-line rounded-lg p-2 text-center">
              <span className="block text-xs text-gray-500">{t('common.eur')}</span>
              <span className="font-semibold text-sm text-fg">
                {card.prices?.eur ? `€${card.prices.eur}` : t('common.priceNotAvailable')}
              </span>
            </div>
            <div className="bg-surface-2/50 border border-line rounded-lg p-2 text-center">
              <span className="block text-xs text-gray-500">{t('common.tix')}</span>
              <span className="font-semibold text-sm text-fg">
                {card.prices?.tix ? `${card.prices.tix}` : t('common.priceNotAvailable')}
              </span>
            </div>
          </div>
        </div>
      )}

      {card.legalities && !isToken && !hidePriceAndLegality && (
        <div className="border-t border-line pt-4 mt-1">
          <h3 className="font-bold mb-3 text-xs text-fg-muted uppercase tracking-widest flex items-center gap-1.5">
            <FaShieldAlt className="text-accent text-xs shrink-0" />
            <span>{t('cardDetails.legality')}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {DECK_FORMATS.map((deckFormat) => {
              const status = card.legalities?.[deckFormat];
              if (!status) return null;

              let bgClass = '';
              let dotClass = '';
              let label = t('cardDetails.notLegal');

              if (status === LEGALITY.LEGAL) {
                bgClass = 'bg-success-soft text-success border-success/40';
                dotClass = 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]';
                label = t('cardDetails.legal');
              } else if (status === LEGALITY.BANNED) {
                bgClass = 'bg-danger-soft text-danger border-danger/40';
                dotClass = 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse';
                label = t('cardDetails.banned');
              } else if (status === LEGALITY.RESTRICTED) {
                bgClass = 'bg-warning-soft text-warning border-warning/40';
                dotClass = 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]';
                label = t('cardDetails.restricted');
              } else {
                bgClass = 'bg-gray-500/5 text-fg-muted border-line';
                dotClass = 'bg-gray-400 dark:bg-gray-500';
                label = t('cardDetails.notLegal');
              }

              return (
                <div
                  key={deckFormat}
                  className={`flex flex-col justify-center px-2.5 py-1.5 rounded-xl border transition-all duration-200 hover:brightness-105 hover:shadow-xs ${bgClass}`}
                >
                  <span className="text-[10px] font-bold text-fg-muted uppercase tracking-wider leading-none">
                    {t(formatLabelKey(deckFormat))}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${dotClass}`} />
                    <span className="text-[10px] font-extrabold uppercase tracking-wide select-none leading-none">
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
