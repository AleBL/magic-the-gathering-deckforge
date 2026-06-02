import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../types/Card';
import { FaChartBar, FaPalette, FaFileInvoice, FaCoins, FaInfoCircle } from 'react-icons/fa';

interface DeckStatsProps {
  currentDeck: Card[];
  onApplySuggestedLands?: (landCounts: Record<string, number>) => void;
}

function DeckStats({ currentDeck, onApplySuggestedLands }: DeckStatsProps) {
  const { t } = useTranslation();

  const deckStatistics = useMemo(() => {
    // 1. Filter out land cards to analyze non-land spells
    const nonLandCards = currentDeck.filter((card) => !card.type_line?.toLowerCase().includes('land'));

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

    const totalColorsOccurrenceCount =
      Object.values(colorDistributionCounts).reduce((sum, count) => sum + count, 0) || 1;

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

    const targetLandCount = currentDeck.length >= 80 ? 38 : 24;
    const suggestedBasicLandCounts: Record<string, number> = { Plains: 0, Island: 0, Swamp: 0, Mountain: 0, Forest: 0 };

    if (totalManaColorSymbols > 0) {
      let remainingLandsToAllocate = targetLandCount;
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
          const allocationShare = Math.round((symbolCount / totalManaColorSymbols) * targetLandCount);
          const allocatedLands = Math.min(allocationShare, remainingLandsToAllocate);
          suggestedBasicLandCounts[basicLandName] = allocatedLands;
          remainingLandsToAllocate -= allocatedLands;
        }
      });
    } else {
      // Fallback wastes allocation for completely colorless spells
      suggestedBasicLandCounts['Wastes'] = targetLandCount;
    }

    // 7. Budget Price Estimator Calculations
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
      totalCards: currentDeck.length,
      suggestedBasicLandCounts,
      totalUsdPrice,
      totalEurPrice,
      mostExpensiveCards
    };
  }, [currentDeck]);

  if (currentDeck.length === 0) return null;

  const colorLabels: Record<string, { name: string; color: string; fill: string }> = {
    W: { name: t('white'), color: 'bg-yellow-100 border-yellow-300 text-yellow-800', fill: 'bg-yellow-400' },
    U: { name: t('blue'), color: 'bg-blue-500 text-white', fill: 'bg-blue-500' },
    B: { name: t('black'), color: 'bg-gray-900 text-white', fill: 'bg-gray-800' },
    R: { name: t('red'), color: 'bg-red-600 text-white', fill: 'bg-red-600' },
    G: { name: t('green'), color: 'bg-green-600 text-white', fill: 'bg-green-600' },
    C: {
      name: t('colorless', 'Incolor'),
      color: 'bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
      fill: 'bg-gray-400'
    }
  };

  return (
    <div className="deck-stats-container">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Curva de Mana */}
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <FaChartBar className="text-blue-500" />
            {t('manaCurve')}
          </h4>
          <div className="flex items-end justify-between h-40 pt-6 px-2 border-b border-gray-200 dark:border-gray-700">
            {Object.entries(deckStatistics.convertedManaCostCounts).map(([convertedManaCost, count]) => {
              const heightPct = `${(count / deckStatistics.maximumConvertedManaCostCount) * 100}%`;
              return (
                <div key={convertedManaCost} className="mana-bar-group group flex-1">
                  <div className="mana-bar-tooltip">
                    {count} {t('cards')}
                  </div>
                  <div className="mana-bar-column" style={{ height: heightPct }} />
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-2 block text-center">
                    {convertedManaCost}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('averageCmc')}:{' '}
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {deckStatistics.averageConvertedManaCost}
            </span>
          </div>
        </div>

        {/* Distribuição de Cores */}
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <FaPalette className="text-purple-500" />
            {t('colorsDistribution')}
          </h4>
          <div className="space-y-3">
            {Object.entries(deckStatistics.colorDistributionCounts).map(([colorKey, count]) => {
              if (count === 0) return null;
              const meta = colorLabels[colorKey];
              const pct = ((count / deckStatistics.totalColorsOccurrenceCount) * 100).toFixed(0);
              return (
                <div key={colorKey} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <span className={`w-2.5 h-2.5 rounded-full inline-block ${meta.fill}`} />
                      {meta.name}
                    </span>
                    <span className="text-gray-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="color-progress-bar">
                    <div className={`color-progress-fill ${meta.fill}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Divisão por Tipos */}
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <FaFileInvoice className="text-green-500" />
            {t('typesBreakdown')}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(deckStatistics.cardTypeCounts).map(([typeKey, count]) => {
              if (count === 0) return null;
              return (
                <div
                  key={typeKey}
                  className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/20 flex justify-between items-center transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-800/40"
                >
                  <span className="capitalize text-gray-600 dark:text-gray-400 font-medium">{t(typeKey)}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-[10px]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* additions: Mana Base Suggester & Budget Estimator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6 text-left">
        {/* Land suggester card */}
        <div className="space-y-4 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-500/5 dark:bg-blue-950/10 transition-colors duration-300">
          <h4 className="font-bold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <FaInfoCircle className="text-blue-500" />
            {t('manaBaseOptimizer')}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t(
              'manaBaseExplanation',
              'Analyze colors in your spells and auto-add basic lands to reach a solid {{target}} lands ratio.'
            ).replace('{{target}}', String(currentDeck.length >= 80 ? 38 : 24))}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {Object.entries(deckStatistics.suggestedBasicLandCounts).map(([landName, count]) => {
              if (count === 0) return null;
              return (
                <div
                  key={landName}
                  className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-sm"
                >
                  <span className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-bold">
                    {t(landName.toLowerCase(), landName)}
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{count}</span>
                </div>
              );
            })}
          </div>

          {onApplySuggestedLands && (
            <button
              type="button"
              onClick={() => onApplySuggestedLands(deckStatistics.suggestedBasicLandCounts)}
              className="primary-button text-xs py-1.5 px-4 mt-2 w-full justify-center shadow-sm font-semibold"
            >
              {t('applySuggestedLands')}
            </button>
          )}
        </div>

        {/* Budget Estimator card */}
        <div className="space-y-4 p-4 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-500/5 dark:bg-purple-950/10 transition-colors duration-300">
          <h4 className="font-bold text-sm text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
            <FaCoins className="text-purple-500" />
            {t('budgetEstimator')}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/80 dark:bg-gray-850/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">{t('totalUsd')}</span>
              <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                ${deckStatistics.totalUsdPrice.toFixed(2)}
              </span>
            </div>
            <div className="bg-white/80 dark:bg-gray-850/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">{t('totalEur')}</span>
              <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                €{deckStatistics.totalEurPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {deckStatistics.mostExpensiveCards.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                ⭐ {t('topExpensiveCards')}
              </span>
              <div className="space-y-1 text-xs">
                {deckStatistics.mostExpensiveCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex justify-between items-center bg-white/60 dark:bg-gray-800/40 px-2.5 py-1.5 rounded-lg border border-gray-150 dark:border-gray-700 shadow-xs"
                  >
                    <span className="truncate max-w-[200px] text-gray-700 dark:text-gray-300 font-medium">
                      {card.printed_name || card.name}
                    </span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-400">
                      ${parseFloat(card.prices?.usd || '0').toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeckStats;
