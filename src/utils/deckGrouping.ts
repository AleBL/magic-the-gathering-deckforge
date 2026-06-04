import { Card } from '../types/Card';

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

/** Fallback images for basic lands in case they were saved without image_uris */
const BASIC_LAND_FALLBACK_IMAGES: Record<string, string> = {
  plains: 'https://cards.scryfall.io/normal/front/a/e/ae53a152-4043-424d-9050-8b186f982829.jpg',
  island: 'https://cards.scryfall.io/normal/front/1/c/1c84cb13-43ef-4d37-84ec-86cffcd14984.jpg',
  swamp: 'https://cards.scryfall.io/normal/front/2/a/2ae68e9f-7df8-43d9-a78b-49ef4599c9c8.jpg',
  mountain: 'https://cards.scryfall.io/normal/front/0/e/0efad862-2ee7-4a0b-93ff-1830491fb342.jpg',
  forest: 'https://cards.scryfall.io/normal/front/5/4/5446059d-47fe-493e-8120-cfbc11d29377.jpg',
  wastes: 'https://cards.scryfall.io/normal/front/0/3/036c84c1-6b45-4424-aa61-5991d7c35fa9.jpg',
  // Portuguese names
  planície: 'https://cards.scryfall.io/normal/front/a/e/ae53a152-4043-424d-9050-8b186f982829.jpg',
  ilha: 'https://cards.scryfall.io/normal/front/1/c/1c84cb13-43ef-4d37-84ec-86cffcd14984.jpg',
  pântano: 'https://cards.scryfall.io/normal/front/2/a/2ae68e9f-7df8-43d9-a78b-49ef4599c9c8.jpg',
  montanha: 'https://cards.scryfall.io/normal/front/0/e/0efad862-2ee7-4a0b-93ff-1830491fb342.jpg',
  floresta: 'https://cards.scryfall.io/normal/front/5/4/5446059d-47fe-493e-8120-cfbc11d29377.jpg'
};

/** URL of the best available image for the card. */
export const getCardImageUrl = (card: Card): string => {
  // Use selected print override if available
  if ((card as any).selectedPrintImageUri) return (card as any).selectedPrintImageUri;

  const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  const baseUrl = imageUris ? imageUris.normal || imageUris.large || card.image_uris?.gatherer || '' : '';

  if (baseUrl) return baseUrl;

  // Fallback for basic lands that were stored without image_uris (pre-existing decks)
  const isBasicLand =
    card.type_line?.toLowerCase().includes('basic land') || !!BASIC_LAND_FALLBACK_IMAGES[card.name?.toLowerCase()];

  if (isBasicLand) {
    return BASIC_LAND_FALLBACK_IMAGES[card.name?.toLowerCase()] || '';
  }

  return '';
};
