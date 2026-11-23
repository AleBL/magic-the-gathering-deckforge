import { Card } from '../../types/Card';
import { CardSize } from '../../types';
import locales from '../../locales';
import { scryfallNamedImageUrl, scryfallPrintingUrl } from '../../constants/urls';

export const getGlowColor = (rarity: string | undefined): string => {
  switch (rarity?.toLowerCase()) {
    case 'mythic':
      return 'rgba(249, 115, 22, 0.4)'; // orange
    case 'rare':
      return 'rgba(245, 158, 11, 0.4)'; // amber
    case 'uncommon':
      return 'rgba(148, 163, 184, 0.4)'; // slate
    case 'common':
    default:
      return 'rgba(255, 255, 255, 0.2)'; // white/subtle
  }
};

type LocaleTranslations = (typeof locales)['en']['translations'];
type BasicLandKey = keyof LocaleTranslations['land'];

const getBasicLandNamesMap = (): Record<string, string> => {
  const map: Record<string, string> = {};
  const landKeys: BasicLandKey[] = ['plains', 'island', 'swamp', 'mountain', 'forest', 'wastes'];

  landKeys.forEach((key) => {
    map[key] = key;
  });

  Object.values(locales).forEach(({ translations }) => {
    landKeys.forEach((key) => {
      const translatedName = translations.land[key];
      if (typeof translatedName === 'string') {
        map[translatedName.toLowerCase()] = key;
      }
    });
  });

  return map;
};

const BASIC_LAND_NAMES = getBasicLandNamesMap();

const IMAGE_VERSION: Record<CardSize, string> = { small: 'small', medium: 'normal', large: 'large', xlarge: 'png' };

/**
 * A localized printing whose scan Scryfall does not have shows the "Localized image not
 * available" stand-in. The English scan of the same printing is a better picture of the card.
 */
function englishScanFallback(card: Card, size: CardSize): string | null {
  const isStandIn = card.image_status === 'placeholder' || card.image_status === 'missing';
  if (!isStandIn || !card.lang || card.lang === 'en' || !card.set || !card.collector_number) return null;
  return `${scryfallPrintingUrl(card.set, card.collector_number, 'en')}?format=image&version=${IMAGE_VERSION[size]}`;
}

export function getCardItemImageUrl(card: Card, size: CardSize): string {
  if (card.selectedPrintImageUri) return card.selectedPrintImageUri;

  const fallback = englishScanFallback(card, size);
  if (fallback) return fallback;

  const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  if (!imageUris) {
    const landName = BASIC_LAND_NAMES[card.name?.toLowerCase()];
    return landName ? scryfallNamedImageUrl(landName) : '';
  }

  if (card.image_uris?.gatherer) return card.image_uris.gatherer;

  const sizeToUriKey: Record<CardSize, keyof typeof imageUris> = {
    small: 'small',
    medium: 'normal',
    large: 'large',
    xlarge: 'png'
  };

  const prioritizedUri = imageUris[sizeToUriKey[size]];
  if (prioritizedUri) return prioritizedUri;

  const landName = BASIC_LAND_NAMES[card.name?.toLowerCase()];
  return landName ? scryfallNamedImageUrl(landName) : '';
}
