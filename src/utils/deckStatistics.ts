import { Card } from '../types/Card';
import { BASIC_LAND_NAMES, MIN_DECK_SIZE, COMMANDER_DECK_SIZE } from '../constants';

type StatFilterType = 'cmc' | 'color' | 'type';

export interface StatFilter {
  type: StatFilterType;
  value: string | number;
}

export interface DeckStatistics {
  averageConvertedManaCost: string;
  convertedManaCostCounts: Record<number | string, number>;
  maximumConvertedManaCostCount: number;
  colorDistributionCounts: Record<string, number>;
  totalColorsOccurrenceCount: number;
  cardTypeCounts: Record<string, number>;
  rarityCounts: Record<string, number>;
  totalCards: number;
  suggestedBasicLandCounts: Record<string, number>;
  neededBasicLands: number;
  targetTotalLands: number;
  totalNonBasicCards: number;
  finalDeckSize: number;
  targetDeckLimit: number;
  removeCount: number;
  totalUsdPrice: number;
  totalEurPrice: number;
  mostExpensiveCards: Card[];
  manaColorSymbolCounts: Record<'W' | 'U' | 'B' | 'R' | 'G', number>;
  landColorCounts: Record<'W' | 'U' | 'B' | 'R' | 'G', number>;
}

/** Returns the cards matching the currently active stat filter (excluding commanders). */
export function filterCardsByStat(currentDeck: Card[], activeFilter: StatFilter | null): Card[] {
  if (!activeFilter) return [];
  return currentDeck
    .filter((card) => {
      if (activeFilter.type === 'cmc') {
        if (card.type_line?.toLowerCase().includes('land')) return false;
        const cmc = Math.floor(card.cmc || 0);
        if (activeFilter.value === '7+') return cmc >= 7;
        return cmc.toString() === activeFilter.value.toString();
      }
      if (activeFilter.type === 'color') {
        if (activeFilter.value === 'C') {
          if (card.type_line?.toLowerCase().includes('land')) return false;
          const hasColor = ['W', 'U', 'B', 'R', 'G'].some(
            (c) => card.colors?.includes(c) || card.mana_cost?.includes(c)
          );
          return !hasColor;
        }
        return (
          card.colors?.includes(activeFilter.value as string) || card.mana_cost?.includes(activeFilter.value as string)
        );
      }
      if (activeFilter.type === 'type') {
        return card.type_line?.toLowerCase().includes(activeFilter.value as string);
      }
      return true;
    })
    .filter((c) => !c.isCommander);
}

/** Computes the full statistics summary (mana curve, colors, types, mana base, prices) for a deck. */
export function computeDeckStatistics(currentDeck: Card[]): DeckStatistics {
  // 1. Filter out land cards and commanders to analyze non-land spells in the 99
  const nonLandCards = currentDeck.filter(
    (card) => !card.type_line?.toLowerCase().includes('land') && !card.isCommander
  );

  // 2. Average Converted Mana Cost (CMC)
  const totalConvertedManaCost = nonLandCards.reduce((sum, card) => sum + (card.cmc || 0), 0);
  const averageConvertedManaCost =
    nonLandCards.length > 0 ? (totalConvertedManaCost / nonLandCards.length).toFixed(2) : '0.00';

  // 3. Mana Curve (Converted Mana Cost distribution for non-land cards)
  const convertedManaCostCounts: Record<number | string, number> = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    '7+': 0
  };

  nonLandCards.forEach((card) => {
    const manaCostValue = Math.floor(card.cmc || 0);
    if (manaCostValue >= 7) {
      convertedManaCostCounts['7+'] += 1;
    } else if (manaCostValue in convertedManaCostCounts) {
      convertedManaCostCounts[manaCostValue] += 1;
    } else {
      convertedManaCostCounts[0] += 1;
    }
  });

  const maximumConvertedManaCostCount = Math.max(...Object.values(convertedManaCostCounts), 1);

  // 4. Color Distribution Counts
  const colorDistributionCounts: Record<string, number> = {
    W: 0,
    U: 0,
    B: 0,
    R: 0,
    G: 0,
    C: 0 // Colorless
  };

  currentDeck.forEach((card) => {
    const cardColorsList = card.colors;
    if (cardColorsList && cardColorsList.length > 0) {
      cardColorsList.forEach((colorSymbol) => {
        if (colorSymbol in colorDistributionCounts) {
          colorDistributionCounts[colorSymbol] += 1;
        }
      });
    } else if (card.mana_cost) {
      let hasColorSymbol = false;
      ['W', 'U', 'B', 'R', 'G'].forEach((colorSymbol) => {
        if (card.mana_cost?.includes(colorSymbol)) {
          colorDistributionCounts[colorSymbol] += 1;
          hasColorSymbol = true;
        }
      });
      if (!hasColorSymbol && !card.type_line?.toLowerCase().includes('land')) {
        colorDistributionCounts.C += 1;
      }
    } else if (!card.type_line?.toLowerCase().includes('land')) {
      colorDistributionCounts.C += 1;
    }
  });

  const totalColorsOccurrenceCount = Object.values(colorDistributionCounts).reduce((sum, count) => sum + count, 0) || 1;

  // 5. Card Type Breakdown Counts
  const cardTypeCounts = {
    creature: 0,
    instant: 0,
    sorcery: 0,
    enchantment: 0,
    artifact: 0,
    planeswalker: 0,
    land: 0
  };

  currentDeck.forEach((card) => {
    const cardTypeLine = card.type_line?.toLowerCase() || '';
    if (cardTypeLine.includes('creature')) cardTypeCounts.creature += 1;
    else if (cardTypeLine.includes('instant')) cardTypeCounts.instant += 1;
    else if (cardTypeLine.includes('sorcery')) cardTypeCounts.sorcery += 1;
    else if (cardTypeLine.includes('enchantment')) cardTypeCounts.enchantment += 1;
    else if (cardTypeLine.includes('artifact')) cardTypeCounts.artifact += 1;
    else if (cardTypeLine.includes('planeswalker')) cardTypeCounts.planeswalker += 1;
    else if (cardTypeLine.includes('land')) cardTypeCounts.land += 1;
  });

  // Rarity breakdown
  const rarityCounts: Record<string, number> = { common: 0, uncommon: 0, rare: 0, mythic: 0 };
  currentDeck.forEach((card) => {
    const rarity = (card.rarity || '').toLowerCase();
    if (rarity in rarityCounts) rarityCounts[rarity] += 1;
  });

  // 6. Mana Base Suggester Calculations
  const manaColorSymbolCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  nonLandCards.forEach((card) => {
    const manaCostString = card.mana_cost || '';
    const manaCostSymbolMatches = manaCostString.match(/\{[WUBRG](\/[WUBRG])?\}/g) || [];
    manaCostSymbolMatches.forEach((manaSymbol) => {
      ['W', 'U', 'B', 'R', 'G'].forEach((manaColor) => {
        if (manaSymbol.includes(manaColor)) {
          manaColorSymbolCounts[manaColor as 'W' | 'U' | 'B' | 'R' | 'G'] += 1;
        }
      });
    });
  });

  const totalManaColorSymbols = Object.values(manaColorSymbolCounts).reduce((a, b) => a + b, 0);

  const targetTotalLands = nonLandCards.length === 0 ? 0 : Math.floor(nonLandCards.length * (2 / 3));

  // Count existing non-basic lands (don't replace them, only add basics)
  const existingNonBasicLandCount = currentDeck.filter((card) => {
    const typeLine = card.type_line?.toLowerCase() || '';
    const isLand = typeLine.includes('land');
    const isBasic = typeLine.includes('basic land') || BASIC_LAND_NAMES.includes(card.name);
    return isLand && !isBasic;
  }).length;

  // How many basic lands we actually need to add
  const neededBasicLands = Math.max(0, targetTotalLands - existingNonBasicLandCount);

  // Calculate limit warnings
  const nonBasicCardsList = currentDeck.filter((card) => {
    const typeLine = card.type_line?.toLowerCase() || '';
    const isBasic = typeLine.includes('basic land') || BASIC_LAND_NAMES.includes(card.name);
    return !isBasic;
  });
  const totalNonBasicCards = nonBasicCardsList.length;
  const finalDeckSize = totalNonBasicCards + neededBasicLands;
  const targetDeckLimit = currentDeck.length >= 80 ? COMMANDER_DECK_SIZE : MIN_DECK_SIZE;
  const removeCount = Math.max(0, finalDeckSize - targetDeckLimit);

  const suggestedBasicLandCounts: Record<string, number> = { Plains: 0, Island: 0, Swamp: 0, Mountain: 0, Forest: 0 };

  if (neededBasicLands > 0 && totalManaColorSymbols > 0) {
    let remainingLandsToAllocate = neededBasicLands;
    const sortedColorSymbolEntries = Object.entries(manaColorSymbolCounts).sort((a, b) => b[1] - a[1]);
    const colorToBasicLandNameMap: Record<string, string> = {
      W: 'Plains',
      U: 'Island',
      B: 'Swamp',
      R: 'Mountain',
      G: 'Forest'
    };

    sortedColorSymbolEntries.forEach(([manaColor, symbolCount], allocationIndex) => {
      const basicLandName = colorToBasicLandNameMap[manaColor];
      if (allocationIndex === sortedColorSymbolEntries.length - 1) {
        suggestedBasicLandCounts[basicLandName] = remainingLandsToAllocate;
      } else {
        const allocationShare = Math.round((symbolCount / totalManaColorSymbols) * neededBasicLands);
        const allocatedLands = Math.min(allocationShare, remainingLandsToAllocate);
        suggestedBasicLandCounts[basicLandName] = allocatedLands;
        remainingLandsToAllocate -= allocatedLands;
      }
    });
  } else if (neededBasicLands > 0) {
    // Fallback wastes allocation for completely colorless spells
    suggestedBasicLandCounts['Wastes'] = neededBasicLands;
  }

  const targetLandCount = neededBasicLands;

  // 7. Land Color Counter for Mana Pip Analysis
  const landColorCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  currentDeck.forEach((card) => {
    const isLand = card.type_line?.toLowerCase().includes('land');
    if (!isLand) return;

    const name = card.name.toLowerCase();
    const oracleText = card.oracle_text?.toLowerCase() || '';

    // Check basic lands first
    if (name.includes('plains') || name.includes('planície')) landColorCounts.W += 1;
    else if (name.includes('island') || name.includes('ilha')) landColorCounts.U += 1;
    else if (name.includes('swamp') || name.includes('pântano')) landColorCounts.B += 1;
    else if (name.includes('mountain') || name.includes('montanha')) landColorCounts.R += 1;
    else if (name.includes('forest') || name.includes('floresta')) landColorCounts.G += 1;
    else {
      // Non-basic lands: check color_identity first
      if (card.color_identity && card.color_identity.length > 0) {
        card.color_identity.forEach((color) => {
          if (color in landColorCounts) {
            landColorCounts[color as 'W' | 'U' | 'B' | 'R' | 'G'] += 1;
          }
        });
      } else {
        // Fallback to searching oracle text
        if (oracleText.includes('{t}: add {w}')) landColorCounts.W += 1;
        if (oracleText.includes('{t}: add {u}')) landColorCounts.U += 1;
        if (oracleText.includes('{t}: add {b}')) landColorCounts.B += 1;
        if (oracleText.includes('{t}: add {r}')) landColorCounts.R += 1;
        if (oracleText.includes('{t}: add {g}')) landColorCounts.G += 1;
      }
    }
  });

  // 8. Budget Price Estimator Calculations
  let totalUsdPrice = 0;
  let totalEurPrice = 0;
  currentDeck.forEach((card) => {
    const usdPriceValue = card.prices?.usd ? parseFloat(card.prices.usd) : 0;
    const eurPriceValue = card.prices?.eur ? parseFloat(card.prices.eur) : 0;
    totalUsdPrice += usdPriceValue;
    totalEurPrice += eurPriceValue;
  });

  const mostExpensiveCards = [...currentDeck]
    .filter((card) => card.prices?.usd)
    .sort((a, b) => parseFloat(b.prices!.usd!) - parseFloat(a.prices!.usd!))
    .slice(0, 3);

  return {
    averageConvertedManaCost,
    convertedManaCostCounts,
    maximumConvertedManaCostCount,
    colorDistributionCounts,
    totalColorsOccurrenceCount,
    cardTypeCounts,
    rarityCounts,
    totalCards: currentDeck.length,
    suggestedBasicLandCounts,
    neededBasicLands: targetLandCount,
    targetTotalLands: currentDeck.length >= 80 ? 38 : 24,
    totalNonBasicCards,
    finalDeckSize,
    targetDeckLimit,
    removeCount,
    totalUsdPrice,
    totalEurPrice,
    mostExpensiveCards,
    manaColorSymbolCounts,
    landColorCounts
  };
}

/** Binomial coefficient "n choose r", computed multiplicatively to avoid factorial overflow. */
function combinations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  const k = Math.min(r, n - r);
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

/**
 * Hypergeometric distribution of how many lands appear in an opening hand.
 * Returns P(exactly k lands) for k from 0 up to min(handSize, landCount).
 */
export function landDrawProbabilities(
  deckSize: number,
  landCount: number,
  handSize = 7
): { lands: number; prob: number }[] {
  if (deckSize < handSize || handSize <= 0 || landCount < 0) return [];
  const denominator = combinations(deckSize, handSize);
  if (denominator === 0) return [];

  const maxLands = Math.min(handSize, landCount);
  const distribution: { lands: number; prob: number }[] = [];
  for (let k = 0; k <= maxLands; k++) {
    const prob = (combinations(landCount, k) * combinations(deckSize - landCount, handSize - k)) / denominator;
    distribution.push({ lands: k, prob });
  }
  return distribution;
}
