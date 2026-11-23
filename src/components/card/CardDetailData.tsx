import { useTranslation } from 'react-i18next';
import { LuBan, LuCheck, LuCircleAlert, LuCrown, LuMinus } from 'react-icons/lu';
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

/** Formats shown in the legality grid: the five the app validates plus the other common ones. */
const LEGALITY_FORMATS = [
  ...DECK_FORMATS,
  'pioneer',
  'legacy',
  'historic',
  'timeless',
  'brawl',
  'oathbreaker',
  'premodern'
] as const;

const EXTRA_FORMAT_NAMES: Record<string, string> = {
  pioneer: 'Pioneer',
  legacy: 'Legacy',
  historic: 'Historic',
  timeless: 'Timeless',
  brawl: 'Brawl',
  oathbreaker: 'Oathbreaker',
  premodern: 'Premodern'
};

/** Status always carries an icon and a word, never colour alone. */
function LegalityStatus({ status }: { status: string }) {
  const { t } = useTranslation();
  if (status === LEGALITY.LEGAL)
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-success">
        <LuCheck className="shrink-0" aria-hidden="true" />
        {t('cardDetails.legal')}
      </span>
    );
  if (status === LEGALITY.BANNED)
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-danger">
        <LuBan className="shrink-0" aria-hidden="true" />
        {t('cardDetails.banned')}
      </span>
    );
  if (status === LEGALITY.RESTRICTED)
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-warning">
        <LuCircleAlert className="shrink-0" aria-hidden="true" />
        {t('cardDetails.restricted')}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-fg-muted">
      <LuMinus className="shrink-0" aria-hidden="true" />
      {t('cardDetails.notLegal')}
    </span>
  );
}

export function CardDetailData({ card, currentFace, hidePriceAndLegality, isToken, allFaces }: CardDetailDataProps) {
  const { t } = useTranslation();

  // Rules-reference order: name and cost on one line, type, rules text, then the body.
  const renderFace = (source: FaceLike, isTitle: boolean, key?: string | number) => (
    <div key={key} className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        {isTitle ? (
          <h2 id="modal-card-title" className="font-serif text-2xl font-semibold leading-tight text-fg">
            {source.printed_name || source.name}
          </h2>
        ) : (
          <h3 className="text-base font-semibold text-fg">{source.printed_name || source.name}</h3>
        )}
        {source.mana_cost && (
          <span
            className="flex items-center flex-wrap justify-end gap-0.5 pt-1 shrink-0"
            aria-label={t('cardDetails.manaCostLabel')}
          >
            {parseTextWithSymbols(source.mana_cost, true)}
          </span>
        )}
      </div>
      <p className="text-sm text-fg-secondary">{source.printed_type_line || source.type_line}</p>
      {(source.printed_text || source.oracle_text) && (
        <p className="text-body text-fg whitespace-pre-line">
          {parseTextWithSymbols(source.printed_text || source.oracle_text)}
        </p>
      )}
      {source.power && source.toughness && (
        <p className="flex justify-end">
          <span
            className="px-2 py-0.5 rounded-md border border-line-strong text-sm font-semibold text-fg"
            aria-label={t('cardDetails.powerToughnessLabel')}
          >
            {source.power}/{source.toughness}
          </span>
        </p>
      )}
    </div>
  );

  const showAllFaces = !!allFaces && allFaces.length > 1;
  const titleSource: FaceLike = currentFace ?? card;
  const prices = [
    { key: 'usd', label: t('common.usd'), value: card.prices?.usd ? `$${card.prices.usd}` : null },
    { key: 'eur', label: t('common.eur'), value: card.prices?.eur ? `€${card.prices.eur}` : null },
    { key: 'tix', label: t('common.tix'), value: card.prices?.tix ?? null }
  ].filter((price) => price.value);
  // Scryfall sends every format it tracks; the Card type only names the ones the app validates.
  const legalityMap: Record<string, string | undefined> = card.legalities ?? {};
  const legalities = LEGALITY_FORMATS.filter((format) => legalityMap[format]);

  return (
    <>
      {card.isCommander && (
        <span className="inline-flex self-start items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning-soft text-warning border border-warning/40">
          <LuCrown className="text-xs shrink-0" />
          {t('cardDetails.commanderBadge')}
        </span>
      )}

      {showAllFaces ? (
        <div className="flex flex-col gap-3 divide-y divide-line [&>*+*]:pt-3">
          <h2 id="modal-card-title" className="font-serif text-2xl font-semibold leading-tight text-fg">
            {card.printed_name || card.name}
          </h2>
          {allFaces!.map((face, index) => renderFace(face, false, index))}
        </div>
      ) : (
        renderFace(titleSource, true)
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm border-t border-line pt-3">
        <dt className="text-fg-muted">{t('cardDetails.rarityLabel')}</dt>
        <dd className="text-fg">{t(`search.${card.rarity.toLowerCase()}`, { defaultValue: card.rarity })}</dd>
        <dt className="text-fg-muted">{t('cardDetails.setLabel')}</dt>
        <dd className="text-fg">{card.set_name}</dd>
        {card.artist && (
          <>
            <dt className="text-fg-muted">{t('cardDetails.artistLabel')}</dt>
            <dd className="text-fg">{card.artist}</dd>
          </>
        )}
        {!isToken && !hidePriceAndLegality && (
          <>
            <dt className="text-fg-muted">{t('stats.prices')}</dt>
            <dd className="text-fg">
              {prices.length > 0 ? (
                <span className="flex flex-wrap gap-x-4 gap-y-0.5">
                  {prices.map((price) => (
                    <span key={price.key}>
                      <span className="text-fg-muted">{price.label}</span> {price.value}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-fg-muted">{t('cardDetails.noPrice')}</span>
              )}
            </dd>
          </>
        )}
      </dl>

      {legalities.length > 0 && !isToken && !hidePriceAndLegality && (
        <div className="border-t border-line pt-3">
          <h3 className="mb-2 text-sm font-medium text-fg-secondary">{t('cardDetails.legality')}</h3>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            {legalities.map((format) => (
              <li key={format} className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-fg-secondary truncate">
                  {EXTRA_FORMAT_NAMES[format] ?? t(formatLabelKey(format))}
                </span>
                <LegalityStatus status={legalityMap[format]!} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
