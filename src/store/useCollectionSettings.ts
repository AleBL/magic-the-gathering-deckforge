import { create } from 'zustand';
import { Currency } from '../types/Collection';

const STORAGE_KEY = 'deckforge_collection_currency';

const readInitialCurrency = (): Currency => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'eur' ? 'eur' : 'usd';
  } catch {
    return 'usd';
  }
};

interface CollectionSettingsState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

/** Small shared store so the collection screen and deck summary agree on currency. */
export const useCollectionSettings = create<CollectionSettingsState>((set) => ({
  currency: readInitialCurrency(),
  setCurrency: (currency) => {
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // Ignore persistence failures (e.g. private mode); in-memory state still updates.
    }
    set({ currency });
  }
}));
