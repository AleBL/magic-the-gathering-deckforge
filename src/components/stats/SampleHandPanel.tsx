import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuHand, LuPlus, LuRefreshCw, LuUndo2 } from 'react-icons/lu';
import { Card } from '../../types/Card';
import { isLandCard } from '../../utils/cardTypePredicates';
import { getCardItemImageUrl } from '../card/cardItemImage';
import { canDraw, handSize, libraryOf, newHand, OPENING_HAND_SIZE, visibleCards } from '../../utils/sampleHand';

interface SampleHandPanelProps {
  currentDeck: Card[];
}

/**
 * A glance at what the deck opens with, without the full simulator: a fresh seven, a
 * mulligan that shows one card fewer, and the next draws.
 */
function SampleHandPanel({ currentDeck }: SampleHandPanelProps) {
  const { t } = useTranslation();
  const [hand, setHand] = useState(() => newHand(currentDeck));
  const [handDeck, setHandDeck] = useState(currentDeck);
  const library = useMemo(() => libraryOf(currentDeck), [currentDeck]);

  // A deck edit invalidates the hand on screen; deal again from the new list.
  if (handDeck !== currentDeck) {
    setHandDeck(currentDeck);
    setHand(newHand(currentDeck));
  }

  if (library.length < OPENING_HAND_SIZE) return null;

  const cards = visibleCards(hand);
  const lands = cards.slice(0, handSize(hand)).filter((card) => isLandCard(card)).length;

  return (
    <section className="md:col-span-3 space-y-3 p-4 rounded-xl border border-line bg-surface-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium text-fg">
            <LuHand className="text-fg-muted" aria-hidden="true" />
            {t('stats.sampleHand')}
          </h3>
          <p className="text-xs text-fg-muted" aria-live="polite">
            {t('stats.sampleHandSummary', { cards: handSize(hand), lands })}
            {hand.drawn > 0 ? ` ${t('stats.sampleHandDrawn', { count: hand.drawn })}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="secondary-button" onClick={() => setHand(newHand(currentDeck))}>
            <LuRefreshCw aria-hidden="true" />
            {t('stats.newHand')}
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={handSize(hand) <= 1}
            onClick={() => setHand(newHand(currentDeck, hand.mulligans + 1))}
          >
            <LuUndo2 aria-hidden="true" />
            {t('stats.mulliganTo', { count: handSize(hand) - 1 })}
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={!canDraw(hand)}
            onClick={() => setHand({ ...hand, drawn: hand.drawn + 1 })}
          >
            <LuPlus aria-hidden="true" />
            {t('stats.drawNext')}
          </button>
        </div>
      </div>

      <ul className="flex gap-2 overflow-x-auto pb-1" aria-label={t('stats.sampleHand')}>
        {cards.map((card, index) => (
          <li key={`${card.instanceId ?? card.id}-${index}`} className="shrink-0">
            <img
              src={getCardItemImageUrl(card, 'small')}
              alt={card.name}
              loading="lazy"
              className={`w-24 aspect-[5/7] rounded-md border object-cover ${
                index >= handSize(hand) ? 'border-accent' : 'border-line'
              }`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default SampleHandPanel;
