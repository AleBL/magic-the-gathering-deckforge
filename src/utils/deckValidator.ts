import { Card } from '../types/Card';
import { DeckFormat } from '../types/Deck';

export interface ValidationError {
  key: string;
  params?: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export function validateDeck(cards: Card[], format: DeckFormat): ValidationResult {
  const errors: ValidationError[] = [];

  if (cards.length === 0) {
    return {
      isValid: false,
      errors: [{ key: 'validationEmptyDeck' }]
    };
  }

  if (format === 'freeform') {
    return { isValid: true, errors: [] };
  }

  // Count copies of each card (excluding basic lands)
  const cardCounts: { [name: string]: number } = {};
  const basicLands = [
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

  cards.forEach((card) => {
    const { name } = card;
    const isBasic = card.type_line?.toLowerCase().includes('basic land') || basicLands.includes(name);
    if (!isBasic) {
      cardCounts[name] = (cardCounts[name] || 0) + 1;
    }
  });

  // Rules: Max 4 copies of any non-basic land card for Standard, Modern, Vintage, Pauper
  if (['standard', 'modern', 'vintage', 'pauper'].includes(format)) {
    if (cards.length < 60) {
      errors.push({
        key: 'validationMinCards',
        params: { count: cards.length }
      });
    }

    Object.entries(cardCounts).forEach(([name, count]) => {
      if (count > 4) {
        errors.push({
          key: 'validationMaxCopies',
          params: { name, count, max: 4 }
        });
      }
    });
  }

  // Commander Format Rules
  if (format === 'commander') {
    if (cards.length !== 100) {
      errors.push({
        key: 'validationCommanderExactCards',
        params: { count: cards.length }
      });
    }

    // Singleton rule: Max 1 copy of any non-basic land card
    Object.entries(cardCounts).forEach(([name, count]) => {
      if (count > 1) {
        errors.push({
          key: 'validationCommanderSingleton',
          params: { name, count }
        });
      }
    });
  }

  // Pauper Format Rules
  if (format === 'pauper') {
    const nonCommonCards = cards.filter((card) => card.rarity !== 'common');
    if (nonCommonCards.length > 0) {
      const uniqueNonCommons = Array.from(new Set(nonCommonCards.map((c) => c.name)));
      const list = uniqueNonCommons.slice(0, 5).join(', ') + (uniqueNonCommons.length > 5 ? '...' : '');
      errors.push({
        key: 'validationPauperCommonsOnly',
        params: { list }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
