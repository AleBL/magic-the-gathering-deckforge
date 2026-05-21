export type CardSize = 'small' | 'medium' | 'large' | 'xlarge';

export const CARD_SIZES: readonly CardSize[] = ['small', 'medium', 'large', 'xlarge'] as const;

export interface SearchFilters {
  colors: string[];
  types: string[];
  rarity: string;
  cmc: string;
}

export const EMPTY_SEARCH_FILTERS: SearchFilters = {
  colors: [],
  types: [],
  rarity: '',
  cmc: ''
};
