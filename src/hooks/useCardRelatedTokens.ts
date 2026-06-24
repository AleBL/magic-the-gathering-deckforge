import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Scry from 'scryfall-sdk';
import { Card } from '../types/Card';
import { CardWithScryfallMetadata, ScryfallCardPart } from '../types/Scryfall';
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
        let allParts = (card as CardWithScryfallMetadata).all_parts;
        if (!allParts) {
          try {
            // Fetch by English name to ensure we get the English card which has all_parts
            const fullCard = (await Scry.Cards.byName(card.name)) as CardWithScryfallMetadata;
            allParts = fullCard.all_parts || [];
          } catch {
            allParts = [];
          }
        }

        const tokenParts = allParts.filter((part) => part.id !== card.id && part.name !== card.name);

        if (tokenParts.length === 0) {
          setTokens([]);
          return;
        }

        const fetched: Card[] = [];

        // Fetch each token by ID in parallel
        await Promise.all(
          tokenParts.map(async (part: ScryfallCardPart) => {
            try {
              const fetchedCard = await Scry.Cards.byId(part.id);
              if (fetchedCard) {
                fetched.push(fetchedCard as unknown as Card);
              }
            } catch {
              // Ignore isolated token fetch failures.
            }
          })
        );

        // Translate the fetched tokens to the selected language if available
        const currentLang = i18n.language || 'en';
        const translated = await translateCards(fetched, currentLang);
        setTokens(translated);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch related tokens';
        setError(message);
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
        const nonLandCards = cards.filter((card) => !card.type_line?.toLowerCase().includes('land'));
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
          nonLandCards.map(async (card) => {
            let allParts = (card as CardWithScryfallMetadata).all_parts;
            if (!allParts) {
              const text = (card.oracle_text || (card as CardWithScryfallMetadata).printed_text || '').toLowerCase();
              const hasTokenText = tokenKeywords.some((word) => text.includes(word));

              if (hasTokenText) {
                try {
                  // Fetch by English name to ensure we get the English card which has all_parts
                  const fullCard = (await Scry.Cards.byName(card.name)) as CardWithScryfallMetadata;
                  allParts = fullCard.all_parts || [];
                } catch {
                  allParts = [];
                }
              } else {
                allParts = [];
              }
            }

            const tokens = allParts.filter((part) => part.id !== card.id && part.name !== card.name);

            tokens.forEach((tokenPart: ScryfallCardPart) => {
              if (!tokenPartsMap.has(tokenPart.id)) {
                tokenPartsMap.set(tokenPart.id, { id: tokenPart.id, generatorName: card.printed_name || card.name });
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
            } catch {
              // Ignore isolated token fetch failures.
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
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch deck tokens';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDeckTokens();
  }, [cards, i18n.language]);

  return { relatedTokens, isLoading, error };
}
