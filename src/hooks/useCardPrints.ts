import { useState, useEffect } from 'react';
import * as Scry from 'scryfall-sdk';
import { Card } from '../types/Card';

export function useCardPrints(cardName: string | undefined) {
  const [prints, setPrints] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cardName) {
      setPrints([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const query = `!"${cardName}" unique:prints`;
    const results: Card[] = [];
    const emitter = Scry.Cards.search(query);

    emitter.on('data', (card: Scry.Card) => {
      const multiverseId = card.multiverse_ids?.[0];
      const gathererUrl = multiverseId
        ? `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${multiverseId}&type=card`
        : '';

      results.push({
        ...(card as unknown as Card),
        image_uris: card.image_uris
          ? {
              ...card.image_uris,
              gatherer: gathererUrl
            }
          : undefined
      });
    });

    emitter.on('done', () => {
      // Sort: place versions with images first
      const sorted = results.sort((a, b) => {
        const aImg = a.image_uris?.normal || a.card_faces?.[0]?.image_uris?.normal;
        const bImg = b.image_uris?.normal || b.card_faces?.[0]?.image_uris?.normal;
        if (aImg && !bImg) return -1;
        if (!aImg && bImg) return 1;
        return 0;
      });
      setPrints(sorted);
      setIsLoading(false);
    });

    emitter.on('error', (err: Error) => {
      console.error('Error fetching card prints:', err);
      // Suppress 404/not found errors, just return empty list
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        setPrints([]);
      } else {
        setError(err.message);
      }
      setIsLoading(false);
    });

    return () => {
      // Cancel search emitter on unmount/card change
      try {
        emitter.cancel();
      } catch (e) {
        // Suppress emitter cancellation errors
      }
    };
  }, [cardName]);

  return { prints, isLoading, error };
}
