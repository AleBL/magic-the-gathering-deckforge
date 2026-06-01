import { useState, useEffect } from 'react';
import * as Scry from 'scryfall-sdk';
import { Card } from '../types/Card';

export interface RelatedToken {
  tokenCard: Card;
  generatorCardName: string;
}

// Hook to fetch related tokens for a single card (Improvement 9)
export function useCardRelatedTokensForCard(card: Card | null) {
  const [tokens, setTokens] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!card) {
      setTokens([]);
      return;
    }

    // Scryfall's all_parts holds related card objects
    const allParts = (card as any).all_parts || [];
    const tokenParts = allParts.filter(
      (part: any) => part.component === 'token' || part.type_line?.toLowerCase().includes('token')
    );

    if (tokenParts.length === 0) {
      setTokens([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const fetchTokens = async () => {
      try {
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

        setTokens(fetched);
      } catch (err: any) {
        console.error('Error fetching related tokens:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [card]);

  return { tokens, isLoading, error };
}

// Hook to fetch related tokens for a list of deck cards (Improvement 5)
export function useCardRelatedTokens(cards: Card[]) {
  const [relatedTokens, setRelatedTokens] = useState<RelatedToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Filter non-land cards that have token parts
    const nonLandCards = cards.filter((c) => !c.type_line?.toLowerCase().includes('land'));
    const tokenPartsMap = new Map<string, { id: string; generatorName: string }>();

    nonLandCards.forEach((c) => {
      const allParts = (c as any).all_parts || [];
      const tokens = allParts.filter(
        (part: any) => part.component === 'token' || part.type_line?.toLowerCase().includes('token')
      );

      tokens.forEach((t: any) => {
        if (!tokenPartsMap.has(t.id)) {
          tokenPartsMap.set(t.id, { id: t.id, generatorName: c.printed_name || c.name });
        }
      });
    });

    const tokenPartsList = Array.from(tokenPartsMap.values());

    if (tokenPartsList.length === 0) {
      setRelatedTokens([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const fetchAllDeckTokens = async () => {
      try {
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

        setRelatedTokens(fetchedList);
      } catch (err: any) {
        console.error('Error fetching all deck tokens:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDeckTokens();
  }, [cards]);

  return { relatedTokens, isLoading, error };
}
