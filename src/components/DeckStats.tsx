import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Card } from '../types/Card';
import { parseTextWithSymbols } from '../utils/symbolHelper';
import {
  FaChartBar,
  FaPalette,
  FaFileInvoice,
  FaCoins,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTint,
  FaStar,
  FaTimes
} from 'react-icons/fa';
import CardItem from './card/CardItem';

interface DeckStatsProps {
  currentDeck: Card[];
  onApplySuggestedLands?: (landCounts: Record<string, number>) => void;
  renderFilteredCards?: (cards: Card[]) => React.ReactNode;
}

function DeckStats({ currentDeck, onApplySuggestedLands, renderFilteredCards }: DeckStatsProps) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<{ type: 'cmc' | 'color' | 'type'; value: string | number } | null>(
    null
  );

  const filteredCards = useMemo(() => {
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
            card.colors?.includes(activeFilter.value as string) ||
            card.mana_cost?.includes(activeFilter.value as string)
          );
        }
        if (activeFilter.type === 'type') {
          return card.type_line?.toLowerCase().includes(activeFilter.value as string);
        }
        return true;
      })
      .filter((c) => !c.isCommander);
  }, [currentDeck, activeFilter]);

  const deckStatistics = useMemo(() => {
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

    const targetTotalLands = nonLandCards.length === 0 ? 0 : Math.floor(nonLandCards.length * (2 / 3));

    // Count existing non-basic lands (don't replace them, only add basics)
    const basicLandNamesList = [
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
    const existingNonBasicLandCount = currentDeck.filter((card) => {
      const typeLine = card.type_line?.toLowerCase() || '';
      const isLand = typeLine.includes('land');
      const isBasic = typeLine.includes('basic land') || basicLandNamesList.includes(card.name);
      return isLand && !isBasic;
    }).length;

    // How many basic lands we actually need to add
    const neededBasicLands = Math.max(0, targetTotalLands - existingNonBasicLandCount);

    // Calculate limit warnings
    const nonBasicCardsList = currentDeck.filter((card) => {
      const typeLine = card.type_line?.toLowerCase() || '';
      const isBasic = typeLine.includes('basic land') || basicLandNamesList.includes(card.name);
      return !isBasic;
    });
    const totalNonBasicCards = nonBasicCardsList.length;
    const finalDeckSize = totalNonBasicCards + neededBasicLands;
    const targetDeckLimit = currentDeck.length >= 80 ? 100 : 60;
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
  }, [currentDeck]);

  const colorLabels: Record<string, { name: string; fill: string; color: string }> = useMemo(
    () => ({
      W: {
        name: t('search.white'),
        fill: 'bg-slate-200',
        color:
          'text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600'
      },
      U: {
        name: t('search.blue'),
        fill: 'bg-blue-400',
        color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800'
      },
      B: {
        name: t('search.black'),
        fill: 'bg-zinc-800',
        color: 'text-zinc-900 dark:text-zinc-300 bg-zinc-300 dark:bg-zinc-900/80 border-zinc-500 dark:border-zinc-700'
      },
      R: {
        name: t('search.red'),
        fill: 'bg-red-500',
        color: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-800'
      },
      G: {
        name: t('search.green'),
        fill: 'bg-green-500',
        color:
          'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-800'
      },
      C: {
        name: t('search.colorless'),
        fill: 'bg-slate-400',
        color:
          'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50'
      }
    }),
    [t]
  );

  const chartData = useMemo(() => {
    if (!deckStatistics || deckStatistics.totalColorsOccurrenceCount === 0) return [];

    // Filter out 'C' (Colorless)
    const validColors = Object.entries(deckStatistics.colorDistributionCounts).filter(([colorKey]) => colorKey !== 'C');
    const maxCount = Math.max(...validColors.map(([, count]) => count), 1);
    const totalValidColors = validColors.reduce((sum, [, count]) => sum + count, 0);

    return validColors.map(([colorKey, count]) => {
      const meta = colorLabels[colorKey];
      const pct = count > 0 && totalValidColors > 0 ? ((count / totalValidColors) * 100).toFixed(0) : '0';

      let hexColor = '#8b5cf6'; // default
      if (colorKey === 'W') hexColor = '#f3f4f6'; // light gray/ivory
      if (colorKey === 'U') hexColor = '#0ea5e9'; // sky blue
      if (colorKey === 'B') hexColor = '#3f3f46'; // visible dark gray (zinc-700) instead of pitch black
      if (colorKey === 'R') hexColor = '#ef4444'; // red
      if (colorKey === 'G') hexColor = '#22c55e'; // green

      return {
        subject: meta.name,
        A: count,
        pct: pct,
        fullMark: maxCount,
        colorKey,
        meta,
        hexColor
      };
    });
  }, [deckStatistics, colorLabels]);

  if (currentDeck.length === 0) return null;

  return (
    <div className="deck-stats-container">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4 min-w-0">
          <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <FaChartBar className="text-blue-500" />
            {t('stats.manaCurve')}
          </h4>
          <div className="flex items-end justify-between h-40 pt-6 px-2 border-b border-gray-200 dark:border-gray-700">
            {Object.entries(deckStatistics.convertedManaCostCounts).map(([convertedManaCost, count]) => {
              const heightPct = `${(count / deckStatistics.maximumConvertedManaCostCount) * 100}%`;
              return (
                <div
                  key={convertedManaCost}
                  className={`mana-bar-group group flex-1 h-full flex flex-col justify-end cursor-pointer transition-opacity duration-200 ${activeFilter?.type === 'cmc' && activeFilter.value !== convertedManaCost ? 'opacity-30' : 'opacity-100 hover:opacity-80'}`}
                  onClick={() =>
                    setActiveFilter((prev) =>
                      prev?.type === 'cmc' && prev.value === convertedManaCost
                        ? null
                        : { type: 'cmc', value: convertedManaCost }
                    )
                  }
                >
                  <div className="mana-bar-tooltip">
                    {count} {t('common.cards')}
                  </div>
                  <div className="h-24 w-full flex items-end justify-center">
                    <div className="mana-bar-column" style={{ height: heightPct }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-2 block text-center">
                    {convertedManaCost}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('stats.averageCmc')}:{' '}
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {deckStatistics.averageConvertedManaCost}
            </span>
          </div>
        </div>

        <div className="space-y-4 relative z-10 min-w-0">
          <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <FaPalette className="text-purple-500" />
            {t('stats.colorsDistribution')}
          </h4>

          {chartData.some((d) => d.A > 0) ? (
            <div className="w-full h-64 sm:h-72 bg-white/50 dark:bg-slate-900/50 rounded-xl p-2 shadow-inner border border-slate-200 dark:border-slate-800 backdrop-blur-sm relative z-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="A"
                    nameKey="subject"
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="75%"
                    paddingAngle={5}
                    stroke="none"
                    onClick={(data: any) => {
                      const colorKey = data?.payload?.colorKey || data?.colorKey;
                      if (colorKey) {
                        setActiveFilter((prev) =>
                          prev?.type === 'color' && prev.value === colorKey ? null : { type: 'color', value: colorKey }
                        );
                      }
                    }}
                  >
                    {chartData.map((entry, index) => {
                      const isSelected = activeFilter?.type === 'color' && activeFilter.value === entry.colorKey;
                      const isOtherSelected = activeFilter?.type === 'color' && activeFilter.value !== entry.colorKey;

                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.hexColor}
                          fillOpacity={isOtherSelected ? 0.2 : 1}
                          stroke={isSelected ? 'currentColor' : 'none'}
                          strokeWidth={isSelected ? 3 : 0}
                          className="dark:stroke-slate-900 stroke-white"
                          style={{ outline: 'none', cursor: 'pointer', transition: 'all 0.3s ease' }}
                        />
                      );
                    })}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/90 backdrop-blur-md text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-slate-700">
                              <span className="flex items-center shadow-sm">
                                {parseTextWithSymbols(`{${data.colorKey}}`)}
                              </span>
                              <span className="font-bold">{data.subject}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-slate-300">
                                {t('common.cards')}: <span className="text-white font-bold">{data.A}</span>
                              </span>
                              <span className="font-medium text-slate-300">
                                {t('stats.percentage')}: <span className="text-white font-bold">{data.pct}%</span>
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic text-center p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
              {t('export.noColorData')}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4 relative z-20">
            {chartData
              .filter((d) => d.A > 0)
              .map((data) => (
                <button
                  key={data.colorKey}
                  onClick={() =>
                    setActiveFilter((prev) =>
                      prev?.type === 'color' && prev.value === data.colorKey
                        ? null
                        : { type: 'color', value: data.colorKey }
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${activeFilter?.type === 'color' && activeFilter.value === data.colorKey ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 shadow-md scale-105' : 'opacity-80 hover:opacity-100 hover:scale-105'}`}
                >
                  <span className="flex items-center shadow-sm">{parseTextWithSymbols(`{${data.colorKey}}`)}</span>
                  {data.subject} ({data.A})
                </button>
              ))}
          </div>
        </div>

        <div className="space-y-4 min-w-0">
          <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <FaFileInvoice className="text-green-500" />
            {t('stats.typesBreakdown')}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(deckStatistics.cardTypeCounts).map(([typeKey, count]) => {
              if (count === 0) return null;
              return (
                <div
                  key={typeKey}
                  onClick={() =>
                    setActiveFilter((prev) =>
                      prev?.type === 'type' && prev.value === typeKey ? null : { type: 'type', value: typeKey }
                    )
                  }
                  className={`p-2 border rounded-lg flex justify-between items-center transition-all cursor-pointer ${activeFilter?.type === 'type' && activeFilter.value === typeKey
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500'
                    : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/20 hover:bg-gray-100/50 dark:hover:bg-gray-800/40'
                    } ${activeFilter?.type === 'type' && activeFilter.value !== typeKey ? 'opacity-40' : 'opacity-100'}`}
                >
                  <span className="capitalize text-gray-600 dark:text-gray-400 font-medium">{t(`search.${typeKey}`)}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-[10px]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6 text-left">
        <div className="space-y-4 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-500/5 dark:bg-blue-950/10 transition-colors duration-300">
          <h4 className="font-bold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <FaInfoCircle className="text-blue-500" />
            {t('stats.manaBaseOptimizer')}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('stats.manaBaseExplanation').replace('{{target}}', String(deckStatistics.targetTotalLands))}
          </p>
          {deckStatistics.neededBasicLands > 0 ? (
            <>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                {t('stats.willAddLands').replace('{{count}}', String(deckStatistics.neededBasicLands))}
              </p>

              {deckStatistics.removeCount > 0 ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-2.5 mt-2 animate-fadeIn">
                  <FaExclamationTriangle className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                    {t('stats.manaBaseWarning')
                      .replace('{{finalSize}}', String(deckStatistics.finalDeckSize))
                      .replace('{{limit}}', String(deckStatistics.targetDeckLimit))
                      .replace('{{removeCount}}', String(deckStatistics.removeCount))}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(deckStatistics.suggestedBasicLandCounts).map(([landName, count]) => {
                  if (count === 0) return null;
                  return (
                    <div
                      key={landName}
                      className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-sm"
                    >
                      <span className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-bold">
                        {t(`stats.${landName.toLowerCase()}`)}
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{count}</span>
                    </div>
                  );
                })}
              </div>

              {onApplySuggestedLands ? (
                <button
                  type="button"
                  onClick={() => onApplySuggestedLands(deckStatistics.suggestedBasicLandCounts)}
                  className="primary-button text-xs py-1.5 px-4 mt-2 w-full justify-center shadow-sm font-semibold"
                >
                  {t('stats.applySuggestedLands')}
                </button>
              ) : null}
            </>
          ) : (
            <div className="flex items-center gap-2 mt-4 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <FaTint className="shrink-0" />
              <p className="text-xs font-semibold">{t('stats.landsAlreadySufficient')}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-500/5 dark:bg-amber-950/10 transition-colors duration-300">
          <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <FaTint className="text-amber-500 animate-pulse" />
            {t('stats.manaPipAnalysis')}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('stats.manaPipAnalysisDesc')}</p>

          <div className="space-y-3 pt-1">
            {['W', 'U', 'B', 'R', 'G'].map((color) => {
              const pipsCount = deckStatistics.manaColorSymbolCounts[color as 'W' | 'U' | 'B' | 'R' | 'G'] || 0;
              const landsCount = deckStatistics.landColorCounts[color as 'W' | 'U' | 'B' | 'R' | 'G'] || 0;

              if (pipsCount === 0 && landsCount === 0) return null;

              const meta = colorLabels[color];
              const total = Math.max(pipsCount + landsCount, 1);
              const pipsPct = Math.round((pipsCount / total) * 100);
              const landsPct = Math.round((landsCount / total) * 100);

              return (
                <div key={color} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <span className={`w-2.5 h-2.5 rounded-full inline-block ${meta.fill}`} />
                      {meta.name}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1 gap-1">
                      <span>
                        {t('stats.pipsNeeded')}:{' '}
                        <span className="font-bold text-gray-900 dark:text-gray-100">{pipsCount}</span>
                      </span>
                      <span>
                        {t('stats.landsAvailable')}:{' '}
                        <span className="font-bold text-gray-900 dark:text-gray-100">{landsCount}</span>
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      className={`h-full opacity-90 transition-all duration-500 ${meta.fill}`}
                      style={{ width: `${pipsPct}%` }}
                      title={`${t('stats.pipsNeeded')}: ${pipsCount}`}
                    />
                    <div
                      className="h-full bg-emerald-500 opacity-60 transition-all duration-500"
                      style={{ width: `${landsPct}%` }}
                      title={`${t('stats.landsAvailable')}: ${landsCount}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 p-4 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-500/5 dark:bg-purple-950/10 transition-colors duration-300">
          <h4 className="font-bold text-sm text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
            <FaCoins className="text-purple-500" />
            {t('stats.budgetEstimator')}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/80 dark:bg-gray-850/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">
                {t('stats.totalUsd')}
              </span>
              <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                ${deckStatistics.totalUsdPrice.toFixed(2)}
              </span>
            </div>
            <div className="bg-white/80 dark:bg-gray-850/80 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">
                {t('stats.totalEur')}
              </span>
              <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                €{deckStatistics.totalEurPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {deckStatistics.mostExpensiveCards.length > 0 ? (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                <FaStar className="text-amber-500" />
                {t('stats.topExpensiveCards')}
              </span>
              <div className="space-y-1 text-xs">
                {deckStatistics.mostExpensiveCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex justify-between items-center bg-white/60 dark:bg-gray-800/40 px-2.5 py-1.5 rounded-lg border border-gray-150 dark:border-gray-700 shadow-xs"
                  >
                    <span className="flex-1 min-w-0 truncate mr-2 text-gray-700 dark:text-gray-300 font-medium">
                      {card.printed_name || card.name}
                    </span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-400">
                      ${parseFloat(card.prices?.usd || '0').toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {activeFilter ? (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">
              {t('search.filteredCards')} ({filteredCards.length})
            </h4>
            <button
              onClick={() => setActiveFilter(null)}
              className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-red-500 dark:hover:text-red-400 font-semibold px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
            >
              <FaTimes />
              {t('search.clearFilter')}
            </button>
          </div>
          {renderFilteredCards ? (
            renderFilteredCards(filteredCards)
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredCards.map((card) => (
                <div key={card.id} className="w-[146px] shrink-0">
                  <CardItem card={card} size="small" />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default DeckStats;
