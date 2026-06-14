import { Card } from '../types/Card';
import locales from '../locales';

interface CardWithSelectedPrintImage extends Card {
  selectedPrintImageUri?: string;
}

export interface GroupedCards {
  title: string;
  cards: Card[];
}

export interface DeckCardGrouped {
  name: string;
  count: number;
  card: Card;
}

export const sortCards = (cardsList: Card[], sortCriteria: 'name' | 'cmc' | 'rarity'): Card[] => {
  const list = [...cardsList];
  const rarityWeight: Record<string, number> = { mythic: 4, rare: 3, uncommon: 2, common: 1 };

  return list.sort((a, b) => {
    if (sortCriteria === 'cmc') {
      return (a.cmc || 0) - (b.cmc || 0) || a.name.localeCompare(b.name);
    }
    if (sortCriteria === 'rarity') {
      const weightA = rarityWeight[a.rarity?.toLowerCase()] || 0;
      const weightB = rarityWeight[b.rarity?.toLowerCase()] || 0;
      return weightB - weightA || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });
};

export const groupCards = (
  cardsList: Card[],
  groupCriteria: 'none' | 'type' | 'cmc' | 'color',
  sortCriteria: 'name' | 'cmc' | 'rarity'
): GroupedCards[] => {
  const sorted = sortCards(cardsList, sortCriteria);

  if (groupCriteria === 'none') {
    return [{ title: '', cards: sorted }];
  }

  const groups: Record<string, Card[]> = {};

  if (groupCriteria === 'type') {
    sorted.forEach((card) => {
      const typeLine = card.type_line?.toLowerCase() || '';
      let key = 'Other';
      if (typeLine.includes('creature')) key = 'creature';
      else if (typeLine.includes('planeswalker')) key = 'planeswalker';
      else if (typeLine.includes('instant')) key = 'instant';
      else if (typeLine.includes('sorcery')) key = 'sorcery';
      else if (typeLine.includes('enchantment')) key = 'enchantment';
      else if (typeLine.includes('artifact')) key = 'artifact';
      else if (typeLine.includes('land')) key = 'land';
      groups[key] = groups[key] || [];
      groups[key].push(card);
    });
  } else if (groupCriteria === 'cmc') {
    sorted.forEach((card) => {
      const cmc = Math.floor(card.cmc || 0);
      const key = cmc >= 7 ? 'CMC 7+' : `CMC ${cmc}`;
      groups[key] = groups[key] || [];
      groups[key].push(card);
    });
  } else if (groupCriteria === 'color') {
    sorted.forEach((card) => {
      const colors = card.colors;
      let key = 'colorless';
      if (colors && colors.length > 1) {
        key = 'multicolored';
      } else if (colors && colors.length === 1) {
        const c = colors[0];
        if (c === 'W') key = 'white';
        else if (c === 'U') key = 'blue';
        else if (c === 'B') key = 'black';
        else if (c === 'R') key = 'red';
        else if (c === 'G') key = 'green';
      }
      groups[key] = groups[key] || [];
      groups[key].push(card);
    });
  }

  const orderedGroups = Object.entries(groups).map(([title, cards]) => ({ title, cards }));

  if (groupCriteria === 'cmc') {
    return orderedGroups.sort((a, b) => {
      const numA = parseInt(a.title.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.title.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }

  return orderedGroups.sort((a, b) => a.title.localeCompare(b.title));
};

/** Groups duplicate cards by name, returning unique counts. */
export const groupCardsByUnique = (cardsList: Card[]): DeckCardGrouped[] => {
  const grouped: DeckCardGrouped[] = [];
  const visited = new Set<string>();

  cardsList.forEach((card) => {
    if (visited.has(card.name)) {
      const existing = grouped.find((g) => g.name === card.name);
      if (existing) existing.count += 1;
    } else {
      visited.add(card.name);
      grouped.push({ name: card.name, count: 1, card });
    }
  });

  return grouped;
};

const getBasicLandNamesMap = (): Record<string, string> => {
  const map: Record<string, string> = {};
  const landKeys = ['plains', 'island', 'swamp', 'mountain', 'forest', 'wastes'];

  landKeys.forEach((key) => {
    map[key] = key;
  });

  Object.values(locales).forEach((locale) => {
    const translations = locale.translations;
    if (translations) {
      landKeys.forEach((key) => {
        const translatedName = translations[key as keyof typeof translations];
        if (typeof translatedName === 'string') {
          map[translatedName.toLowerCase()] = key;
        }
      });
    }
  });

  return map;
};

const BASIC_LAND_NAMES = getBasicLandNamesMap();

/** URL of the best available image for the card. */
export const getCardImageUrl = (card: Card): string => {
  const cardWithSelectedPrintImage = card as CardWithSelectedPrintImage;

  // Use selected print override if available
  if (cardWithSelectedPrintImage.selectedPrintImageUri) return cardWithSelectedPrintImage.selectedPrintImageUri;

  // Prioritize gatherer first for localized translation support
  if (card.image_uris?.gatherer) return card.image_uris.gatherer;

  const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  const baseUrl = imageUris ? imageUris.normal || imageUris.large || '' : '';

  if (baseUrl) return baseUrl;

  const landName = BASIC_LAND_NAMES[card.name?.toLowerCase()];
  if (landName) {
    return `https://api.scryfall.com/cards/named?exact=${landName}&format=image`;
  }

  return '';
};
