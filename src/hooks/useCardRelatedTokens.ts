import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Scry from 'scryfall-sdk';
import { Card } from '../types/Card';
import { translateCards } from '../utils/translationHelper';

export interface RelatedToken {
  tokenCard: Card;
  generatorCardName: string;
  isActive?: boolean;
}

// Hook to fetch related tokens for a single card (Improvement 9)
export function useCardRelatedTokensForCard(card: Card | null) {
  const [tokens, setTokens] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!card) {
      setTokens([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const fetchTokens = async () => {
      try {
        let allParts = (card as any).all_parts;
        if (!allParts) {
          try {
            // Fetch by English name to ensure we get the English card which has all_parts
            const fullCard = await Scry.Cards.byName(card.name);
            allParts = (fullCard as any).all_parts || [];
          } catch (e) {
            console.error(`Failed to fetch full card ${card.name} for related tokens:`, e);
            allParts = [];
          }
        }

        const tokenParts = allParts.filter((part: any) => part.id !== card.id && part.name !== card.name);

        if (tokenParts.length === 0) {
          setTokens([]);
          return;
        }

        const fetched: Card[] = [];

        // Fetch each token by ID in parallel
        await Promise.all(
          tokenParts.map(async (part: any) => {
            try {
              const fetchedCard = await Scry.Cards.byId(part.id);
              if (fetchedCard) {
                fetched.push(fetchedCard as unknown as Card);
              }
            } catch (err) {
              console.error(`Failed to fetch token part with id ${part.id}:`, err);
            }
          })
        );

        // Translate the fetched tokens to the selected language if available
        const currentLang = i18n.language || 'en';
        const translated = await translateCards(fetched, currentLang);
        setTokens(translated);
      } catch (err: any) {
        console.error('Error fetching related tokens:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [card, i18n.language]);

  return { tokens, isLoading, error };
}

// Hook to fetch related tokens for a list of deck cards (Improvement 5)
export function useCardRelatedTokens(cards: Card[]) {
  const [relatedTokens, setRelatedTokens] = useState<RelatedToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!cards || cards.length === 0) {
      setRelatedTokens([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const fetchAllDeckTokens = async () => {
      try {
        // Filter non-land cards
        const nonLandCards = cards.filter((c) => !c.type_line?.toLowerCase().includes('land'));
        const tokenPartsMap = new Map<string, { id: string; generatorName: string }>();

        // Fetch full card details for cards lacking all_parts only if they contain token keywords
        const tokenKeywords = [
          'token',
          'create',
          'ficha',
          'criar',
          'crea',
          'crie',
          'investig',
          'incub',
          'fabric',
          'acumul',
          'enrolar',
          'amass'
        ];
        await Promise.all(
          nonLandCards.map(async (c) => {
            let allParts = (c as any).all_parts;
            if (!allParts) {
              const text = (c.oracle_text || (c as any).printed_text || '').toLowerCase();
              const hasTokenText = tokenKeywords.some((word) => text.includes(word));

              if (hasTokenText) {
                try {
                  // Fetch by English name to ensure we get the English card which has all_parts
                  const fullCard = await Scry.Cards.byName(c.name);
                  allParts = (fullCard as any).all_parts || [];
                } catch (err) {
                  allParts = [];
                }
              } else {
                allParts = [];
              }
            }

            const tokens = allParts.filter((part: any) => part.id !== c.id && part.name !== c.name);

            tokens.forEach((t: any) => {
              if (!tokenPartsMap.has(t.id)) {
                tokenPartsMap.set(t.id, { id: t.id, generatorName: c.printed_name || c.name });
              }
            });
          })
        );

        const tokenPartsList = Array.from(tokenPartsMap.values());

        if (tokenPartsList.length === 0) {
          setRelatedTokens([]);
          return;
        }

        const fetchedList: RelatedToken[] = [];

        await Promise.all(
          tokenPartsList.map(async (part) => {
            try {
              const fetchedCard = await Scry.Cards.byId(part.id);
              if (fetchedCard) {
                fetchedList.push({
                  tokenCard: fetchedCard as unknown as Card,
                  generatorCardName: part.generatorName
                });
              }
            } catch (err) {
              console.error(`Failed to fetch token ${part.id} for deck:`, err);
            }
          })
        );

        // Translate token cards to target language if available
        const currentLang = i18n.language || 'en';
        const tokenCards = fetchedList.map((item) => item.tokenCard);
        const translatedCards = await translateCards(tokenCards, currentLang);

        const translatedList = fetchedList.map((item, index) => ({
          ...item,
          tokenCard: translatedCards[index] || item.tokenCard
        }));

        setRelatedTokens(translatedList);
      } catch (err: any) {
        console.error('Error fetching all deck tokens:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDeckTokens();
  }, [cards, i18n.language]);

  return { relatedTokens, isLoading, error };
}
