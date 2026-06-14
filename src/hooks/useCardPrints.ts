import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Scry from 'scryfall-sdk';
import { Card } from '../types/Card';

export function useCardPrints(cardOrName: Card | string | undefined, oracleId?: string, isToken?: boolean) {
  const [prints, setPrints] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { i18n } = useTranslation();

  const cardName = typeof cardOrName === 'string' ? cardOrName : cardOrName?.name;
  const targetOracleId = typeof cardOrName === 'string' ? oracleId : cardOrName?.oracle_id;
  const originalPower = typeof cardOrName === 'string' ? undefined : cardOrName?.power;
  const originalToughness = typeof cardOrName === 'string' ? undefined : cardOrName?.toughness;
  const originalColors = typeof cardOrName === 'string' ? undefined : cardOrName?.colors;
  const originalTypeLine = typeof cardOrName === 'string' ? undefined : cardOrName?.type_line;
  const originalOracleText = typeof cardOrName === 'string' ? undefined : cardOrName?.oracle_text;

  useEffect(() => {
    if (!cardName && !targetOracleId) {
      setPrints([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const targetLang = i18n.language || 'en';
    const cleanLang = targetLang.split('-')[0].toLowerCase();

    // Construct a language query that tries to fetch the target language OR English for each print
    const langCondition = cleanLang !== 'en' ? `(lang:${cleanLang} OR lang:en)` : 'lang:en';

    let query = '';
    if (isToken) {
      // Use name:!"name" for exact name match on Scryfall
      query = `t:token name:!"${cardName}" unique:prints ${langCondition}`;
    } else if (targetOracleId && !targetOracleId.startsWith('token-oracle-')) {
      query = `oracle_id:${targetOracleId} unique:prints ${langCondition}`;
    } else {
      query = `!"${cardName}" unique:prints ${langCondition}`;
    }

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
      // Group prints by set & collector number, prioritizing the target language print
      const uniqueMap = new Map<string, Card>();
      results.forEach((c) => {
        // If it's a token and we have the original attributes, filter out non-matching tokens
        if (isToken && typeof cardOrName !== 'string') {
          const powerMatches = (c.power || '') === (originalPower || '');
          const toughnessMatches = (c.toughness || '') === (originalToughness || '');
          const colorsMatches = (c.colors ?? []).sort().join(',') === (originalColors ?? []).sort().join(',');
          const typeLineMatches = (c.type_line || '') === (originalTypeLine || '');
          const oracleTextMatches =
            (c.oracle_text || '').trim().toLowerCase() === (originalOracleText || '').trim().toLowerCase();

          if (!powerMatches || !toughnessMatches || !colorsMatches || !typeLineMatches || !oracleTextMatches) {
            return;
          }
        }

        const key = `${c.set}_${c.collector_number || ''}`;
        const existing = uniqueMap.get(key);
        if (!existing) {
          uniqueMap.set(key, c);
        } else {
          const existingIsEnglish = existing.lang === 'en' || !existing.lang;
          const newIsPreferred = c.lang === cleanLang;
          if (existingIsEnglish && newIsPreferred) {
            uniqueMap.set(key, c);
          }
        }
      });

      const uniqueResults = Array.from(uniqueMap.values());

      // Sort: place versions with images first
      const sorted = uniqueResults.sort((a, b) => {
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
      } catch {
        // Suppress emitter cancellation errors
      }
    };
  }, [
    cardName,
    targetOracleId,
    i18n.language,
    isToken,
    originalPower,
    originalToughness,
    originalColors,
    originalTypeLine,
    originalOracleText
  ]);

  return { prints, isLoading, error };
}
