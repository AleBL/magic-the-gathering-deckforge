import { Card } from '../types/Card';
import { DeckFormat } from '../types/Deck';

export function useSuggestedLands(
  currentDeck: Card[],
  editingDeckId: string | null,
  editingDeckName: string,
  activeFormat: DeckFormat,
  editingDeckNotes: string | undefined,
  onLoadDeckToEdit: (id: string, name: string, format: DeckFormat, cards: Card[], notes?: string) => void,
  showToast: (text: string) => void,
  t: (key: string) => string
) {
  const handleApplySuggestedLands = (landCounts: Record<string, number>) => {
    const basicLandsList = [
      'Plains',
      'Island',
      'Swamp',
      'Mountain',
      'Forest',
      'Wastes',
      'Planície',
      'Ilha',
      'Pântano',
      'Montanha',
      'Floresta',
      'Deserto'
    ];

    const nonBasicLands = currentDeck.filter((card) => {
      const isBasic = card.type_line?.toLowerCase().includes('basic land') || basicLandsList.includes(card.name);
      return !isBasic;
    });

    const createBasicLandCard = (name: string): Card => {
      const ids: Record<string, string> = {
        Plains: 'plains-basic-land',
        Island: 'island-basic-land',
        Swamp: 'swamp-basic-land',
        Mountain: 'mountain-basic-land',
        Forest: 'forest-basic-land',
        Wastes: 'wastes-basic-land'
      };

      const colorsMap: Record<string, string[]> = {
        Plains: ['W'],
        Island: ['U'],
        Swamp: ['B'],
        Mountain: ['R'],
        Forest: ['G'],
        Wastes: []
      };

      const imagesMap: Record<string, string> = {
        Plains: 'https://cards.scryfall.io/normal/front/a/e/ae53a152-4043-424d-9050-8b186f982829.jpg',
        Island: 'https://cards.scryfall.io/normal/front/1/c/1c84cb13-43ef-4d37-84ec-86cffcd14984.jpg',
        Swamp: 'https://cards.scryfall.io/normal/front/2/a/2ae68e9f-7df8-43d9-a78b-49ef4599c9c8.jpg',
        Mountain: 'https://cards.scryfall.io/normal/front/0/e/0efad862-2ee7-4a0b-93ff-1830491fb342.jpg',
        Forest: 'https://cards.scryfall.io/normal/front/5/4/5446059d-47fe-493e-8120-cfbc11d29377.jpg',
        Wastes: 'https://cards.scryfall.io/normal/front/0/3/036c84c1-6b45-4424-aa61-5991d7c35fa9.jpg'
      };

      return {
        id: ids[name] || `basic-land-${name.toLowerCase()}`,
        oracle_id: `basic-land-oracle-${name.toLowerCase()}`,
        name: name,
        printed_name: name,
        type_line: 'Basic Land',
        printed_type_line: 'Terreno Básico',
        mana_cost: '',
        cmc: 0,
        rarity: 'common',
        set_name: 'Standard Basic Lands',
        colors: colorsMap[name] || [],
        color_identity: colorsMap[name] || [],
        image_uris: {
          small: imagesMap[name] || '',
          normal: imagesMap[name] || '',
          large: imagesMap[name] || '',
          png: imagesMap[name] || ''
        }
      };
    };

    const newBasicLands: Card[] = [];
    Object.entries(landCounts).forEach(([landName, count]) => {
      for (let landCopyIndex = 0; landCopyIndex < count; landCopyIndex++) {
        newBasicLands.push(createBasicLandCard(landName));
      }
    });

    const newDeckCards = [...nonBasicLands, ...newBasicLands];
    // Preserve the current editing state — never use '' as deckId if we're genuinely editing
    onLoadDeckToEdit(editingDeckId ?? '', editingDeckName || '', activeFormat, newDeckCards, editingDeckNotes);
    showToast(t('deck.deckSaved'));
  };

  return { handleApplySuggestedLands };
}
