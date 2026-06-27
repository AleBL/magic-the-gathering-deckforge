import { DeckFormatType } from '../types/enums';

/**
 * Builds the i18n key for a deck format's display label.
 *
 * The format label strings (standard, modern, commander, vintage, pauper, freeform)
 * live under the `validation` namespace in the locale files, and the app's default
 * namespace is `translations`. Consuming a bare `t(format)` therefore misses the
 * `validation.` prefix and renders the raw key. Always route format labels through
 * this helper so the prefix (and freeform fallback / lowercasing) stays consistent.
 */
export function formatLabelKey(format?: string | null): string {
  const key = (format || DeckFormatType.FREEFORM).toLowerCase();
  return `validation.${key}`;
}
