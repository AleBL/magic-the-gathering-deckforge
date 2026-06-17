import { CardSize, SearchFilters } from '../types';

export const CARD_SIZES: readonly CardSize[] = ['small', 'medium', 'large', 'xlarge'] as const;

export const EMPTY_SEARCH_FILTERS: SearchFilters = {
  colors: [],
  types: [],
  rarity: '',
  cmc: ''
};

export const TOAST_DURATION_MS = 2500;

export const APP_VERSION = '0.1.0';
export const AUTHOR_NAME = 'Alessandro Barros';
export const APP_NAME = 'MTG Deck Forge';
export const GITHUB_REPO_URL = 'https://github.com/AleBL/magic-the-gathering-search';

export const SUPPORTED_LANGUAGES = ['en', 'pt', 'es'] as const;
export const DEFAULT_LANGUAGE = 'en';
