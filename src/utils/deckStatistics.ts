import { Card } from '../types/Card';
import { BASIC_LAND_NAMES, MIN_DECK_SIZE, COMMANDER_DECK_SIZE } from '../constants';

type StatFilterType = 'cmc' | 'color' | 'type';

/** The five castable colors plus true colorless ({C}) mana. */
export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'C';
export const MANA_COLORS: readonly ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];

/** Which basic land produces each kind of mana (Wastes covers {C}). */
export const MANA_COLOR_TO_BASIC_LAND: Record<ManaColor, string> = {
  W: 'Plains',
  U: 'Island',
  B: 'Swamp',
  R: 'Mountain',
  G: 'Forest',
  C: 'Wastes'
};

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
  /**
   * Every land in the deck (basic + non-basic), classified by type_line alone.
   * Use this — not cardTypeCounts.land, whose else-if chain files "Artifact
   * Land"/"Creature — Land" under artifact/creature — wherever a number must
   * reconcile with targetTotalLands and neededBasicLands.
   */
  totalLands: number;
  totalNonBasicCards: number;
  finalDeckSize: number;
  targetDeckLimit: number;
  removeCount: number;
  totalUsdPrice: number;
  totalEurPrice: number;
  mostExpensiveCards: Card[];
  manaColorSymbolCounts: Record<ManaColor, number>;
  landColorCounts: Record<ManaColor, number>;
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

/**
 * Splits `landsToAllocate` basic lands across the colors actually used, proportional
 * to their pip counts (largest-remainder rounding so the total is exact), while
 * guaranteeing every used color gets at least one source whenever there are enough
 * land slots. With fewer slots than colors, the most-demanded colors are covered first.
 */
function allocateLandsByPips(
  pipCounts: Record<ManaColor, number>,
  activeColors: readonly ManaColor[],
  landsToAllocate: number
): Partial<Record<ManaColor, number>> {
  const allocations: Partial<Record<ManaColor, number>> = {};
  if (landsToAllocate <= 0 || activeColors.length === 0) return allocations;

  // Not enough slots for every color: give one land each to the most-demanded colors.
  if (landsToAllocate < activeColors.length) {
    [...activeColors]
      .sort((a, b) => pipCounts[b] - pipCounts[a])
      .slice(0, landsToAllocate)
      .forEach((color) => {
        allocations[color] = 1;
      });
    return allocations;
  }

  const totalPips = activeColors.reduce((sum, color) => sum + pipCounts[color], 0);

  // Largest-remainder (Hamilton) apportionment: floor each proportional quota,
  // then hand out the leftover lands to the largest fractional remainders.
  const quotas = activeColors.map((color) => {
    const quota = (pipCounts[color] / totalPips) * landsToAllocate;
    return { color, quota, lands: Math.floor(quota) };
  });
  let remaining = landsToAllocate - quotas.reduce((sum, q) => sum + q.lands, 0);
  [...quotas]
    .sort((a, b) => b.quota - b.lands - (a.quota - a.lands))
    .forEach((entry) => {
      if (remaining > 0) {
        entry.lands += 1;
        remaining -= 1;
      }
    });

  // Minimum floor: a used color can never end at zero sources — without one the
  // spell is uncastable. Feasible because landsToAllocate >= activeColors.length.
  quotas.forEach((zeroed) => {
    if (zeroed.lands > 0) return;
    const donor = quotas.reduce((max, q) => (q.lands > max.lands ? q : max), quotas[0]);
    if (donor.lands > 1) {
      donor.lands -= 1;
      zeroed.lands += 1;
    }
  });

  quotas.forEach((entry) => {
    allocations[entry.color] = entry.lands;
  });
  return allocations;
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
  // Counts colored pips plus true colorless ({C}) requirements — Wastes is the
  // basic land that satisfies {C}. Generic ({2}, {X}) and snow ({S}) costs are
  // intentionally excluded: any land pays them.
  const manaColorSymbolCounts: Record<ManaColor, number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
  nonLandCards.forEach((card) => {
    const manaCostString = card.mana_cost || '';
    const manaCostSymbolMatches = manaCostString.match(/\{[WUBRGC](\/[WUBRGC])?\}/g) || [];
    manaCostSymbolMatches.forEach((manaSymbol) => {
      MANA_COLORS.forEach((manaColor) => {
        if (manaSymbol.includes(manaColor)) {
          manaColorSymbolCounts[manaColor] += 1;
        }
      });
    });
  });

  const totalManaColorSymbols = Object.values(manaColorSymbolCounts).reduce((a, b) => a + b, 0);
  const activeManaColors = MANA_COLORS.filter((color) => manaColorSymbolCounts[color] > 0);

  // ~2/3 land ratio, but never below one source per mana kind actually used:
  // even a one-spell deck needs at least one land that can cast that spell.
  const targetTotalLands =
    nonLandCards.length === 0 ? 0 : Math.max(Math.floor(nonLandCards.length * (2 / 3)), activeManaColors.length, 1);

  // Count existing non-basic lands (don't replace them, only add basics)
  const existingNonBasicLandCount = currentDeck.filter((card) => {
    const typeLine = card.type_line?.toLowerCase() || '';
    const isLand = typeLine.includes('land');
    const isBasic = typeLine.includes('basic land') || BASIC_LAND_NAMES.includes(card.name);
    return isLand && !isBasic;
  }).length;

  const existingBasicLandCount = currentDeck.filter((card) => {
    const typeLine = card.type_line?.toLowerCase() || '';
    return typeLine.includes('basic land') || BASIC_LAND_NAMES.includes(card.name);
  }).length;

  // How many basic lands we actually need to ADD on top of what's already
  // there (applying is additive — see useSuggestedLands). Counting existing
  // basics here is what makes a second "apply" a no-op AND the panel flip to
  // the "lands already sufficient" state instead of offering the same +N.
  const neededBasicLands = Math.max(0, targetTotalLands - existingNonBasicLandCount - existingBasicLandCount);

  // Calculate limit warnings
  const nonBasicCardsList = currentDeck.filter((card) => {
    const typeLine = card.type_line?.toLowerCase() || '';
    const isBasic = typeLine.includes('basic land') || BASIC_LAND_NAMES.includes(card.name);
    return !isBasic;
  });
  const totalNonBasicCards = nonBasicCardsList.length;
  const finalDeckSize = currentDeck.length + neededBasicLands;
  const targetDeckLimit = currentDeck.length >= 80 ? COMMANDER_DECK_SIZE : MIN_DECK_SIZE;
  const removeCount = Math.max(0, finalDeckSize - targetDeckLimit);

  const suggestedBasicLandCounts: Record<string, number> = {
    Plains: 0,
    Island: 0,
    Swamp: 0,
    Mountain: 0,
    Forest: 0,
    Wastes: 0
  };

  if (neededBasicLands > 0 && totalManaColorSymbols > 0) {
    const allocations = allocateLandsByPips(manaColorSymbolCounts, activeManaColors, neededBasicLands);
    activeManaColors.forEach((color) => {
      suggestedBasicLandCounts[MANA_COLOR_TO_BASIC_LAND[color]] = allocations[color] ?? 0;
    });
  } else if (neededBasicLands > 0) {
    // Spells exist but demand no colored/colorless pips (pure generic costs):
    // any land works, so default to Wastes.
    suggestedBasicLandCounts['Wastes'] = neededBasicLands;
  }

  const targetLandCount = neededBasicLands;

  // 7. Land Color Counter for Mana Pip Analysis
  const landColorCounts: Record<ManaColor, number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
  currentDeck.forEach((card) => {
    const isLand = card.type_line?.toLowerCase().includes('land');
    if (!isLand) return;

    const name = card.name.toLowerCase();
    const oracleText = card.oracle_text?.toLowerCase() || '';

    // Check basic lands first (Wastes/Ermos is the colorless basic)
    if (name.includes('plains') || name.includes('planície')) landColorCounts.W += 1;
    else if (name.includes('island') || name.includes('ilha')) landColorCounts.U += 1;
    else if (name.includes('swamp') || name.includes('pântano')) landColorCounts.B += 1;
    else if (name.includes('mountain') || name.includes('montanha')) landColorCounts.R += 1;
    else if (name.includes('forest') || name.includes('floresta')) landColorCounts.G += 1;
    else if (name.includes('wastes') || name.includes('ermo')) landColorCounts.C += 1;
    else {
      // Non-basic lands: check color_identity first
      if (card.color_identity && card.color_identity.length > 0) {
        card.color_identity.forEach((color) => {
          if (color in landColorCounts) {
            landColorCounts[color as ManaColor] += 1;
          }
        });
      } else if (oracleText) {
        // Fallback to searching oracle text ({C} covers colorless utility lands)
        if (oracleText.includes('{t}: add {w}')) landColorCounts.W += 1;
        if (oracleText.includes('{t}: add {u}')) landColorCounts.U += 1;
        if (oracleText.includes('{t}: add {b}')) landColorCounts.B += 1;
        if (oracleText.includes('{t}: add {r}')) landColorCounts.R += 1;
        if (oracleText.includes('{t}: add {g}')) landColorCounts.G += 1;
        if (oracleText.includes('{t}: add {c}')) landColorCounts.C += 1;
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

  // Dedupe by name so a playset of one expensive card doesn't fill every slot.
  const seenExpensiveNames = new Set<string>();
  const mostExpensiveCards = [...currentDeck]
    .filter((card) => card.prices?.usd)
    .sort((a, b) => parseFloat(b.prices!.usd!) - parseFloat(a.prices!.usd!))
    .filter((card) => (seenExpensiveNames.has(card.name) ? false : (seenExpensiveNames.add(card.name), true)))
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
    targetTotalLands,
    totalLands: existingNonBasicLandCount + existingBasicLandCount,
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
