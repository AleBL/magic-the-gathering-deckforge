import { describe, expect, it } from 'vitest';
import { getCardItemImageUrl } from '../cardItemImage';
import type { Card } from '../../../types/Card';

const localized = (overrides: Partial<Card> = {}): Card =>
  ({
    id: 'pt-bolt',
    name: 'Relâmpago',
    lang: 'pt',
    set: 'm11',
    collector_number: '149',
    image_status: 'placeholder',
    image_uris: { normal: 'https://cards.scryfall.io/normal/pt-placeholder.jpg' },
    ...overrides
  }) as Card;

describe('getCardItemImageUrl', () => {
  it('uses the English scan when the localized printing only has a stand-in image', () => {
    expect(getCardItemImageUrl(localized(), 'medium')).toBe(
      'https://api.scryfall.com/cards/m11/149/en?format=image&version=normal'
    );
  });

  it('keeps the localized scan when Scryfall has one', () => {
    expect(getCardItemImageUrl(localized({ image_status: 'highres_scan' }), 'medium')).toBe(
      'https://cards.scryfall.io/normal/pt-placeholder.jpg'
    );
  });

  it('never rewrites an English printing', () => {
    expect(getCardItemImageUrl(localized({ lang: 'en' }), 'large')).not.toContain('format=image');
  });

  it('lets a chosen printing win over the fallback', () => {
    expect(getCardItemImageUrl(localized({ selectedPrintImageUri: 'https://example.test/chosen.jpg' }), 'small')).toBe(
      'https://example.test/chosen.jpg'
    );
  });
});
