import { Card } from '../types/Card';

/**
 * Translates a list of cards to a target language (e.g., 'en', 'es', 'pt') in batch
 * using the Scryfall search API.
 * Keeps cards in their original order, falling back to the original card object
 * if the translation query fails or if a translation is not available for a specific card.
 */
export async function translateCards(cards: Card[], targetLang: string): Promise<Card[]> {
  if (cards.length === 0) return [];

  // Normalize language (e.g. "en-US" -> "en") for Scryfall compatibility
  const lang = (targetLang || 'en').split('-')[0].toLowerCase();

  // Group unique oracle_ids to reduce search overhead
  const oracleIdMap = new Map<string, Card>();
  cards.forEach((card) => {
    if (card.oracle_id) {
      oracleIdMap.set(card.oracle_id, card);
    }
  });

  const uniqueOracleIds = Array.from(oracleIdMap.keys());
  const translatedMap = new Map<string, Card>();

  // Process in batches of 20 to keep URL query size reasonable
  const BATCH_SIZE = 20;
  for (let batchStartIndex = 0; batchStartIndex < uniqueOracleIds.length; batchStartIndex += BATCH_SIZE) {
    const batch = uniqueOracleIds.slice(batchStartIndex, batchStartIndex + BATCH_SIZE);

    // Query looks like: oracle_id:(id1 or id2 or ...) lang:lang
    const oracleQuery = batch.map((id) => `oracle_id:${id}`).join(' OR ');
    const query = `${oracleQuery} lang:${lang}`;
    const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json.data && Array.isArray(json.data)) {
          json.data.forEach((card: Card & { multiverse_ids?: number[] }) => {
            if (card.oracle_id) {
              const multiverseId = card.multiverse_ids?.[0];
              const gathererUrl = multiverseId
                ? `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${multiverseId}&type=card`
                : '';

              const image_uris = card.image_uris || {
                small: '',
                normal: '',
                large: '',
                png: ''
              };
              translatedMap.set(card.oracle_id, {
                ...card,
                image_uris: {
                  ...image_uris,
                  gatherer: gathererUrl || image_uris.gatherer
                }
              });
            }
          });
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error translating card batch:', error);
    }
  }

  // Map the original cards to their translated counterpart or fallback to the original
  return cards.map((card) => {
    if (card.oracle_id && translatedMap.has(card.oracle_id)) {
      const translated = translatedMap.get(card.oracle_id)!;
      const hasImage = translated.image_uris?.normal || translated.card_faces?.[0]?.image_uris?.normal;
      const originalHasImage = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;

      if (!hasImage && originalHasImage) {
        const gatherer = translated.image_uris?.gatherer;
        return {
          ...translated,
          image_uris: card.image_uris
            ? {
                ...card.image_uris,
                gatherer: gatherer || card.image_uris.gatherer
              }
            : gatherer
              ? { small: '', normal: '', large: '', png: '', gatherer }
              : undefined,
          card_faces: card.card_faces
        };
      }
      return translated;
    }
    return card;
  });
}
