import { useMemo } from 'react';
import { Card } from '../../types/Card';

import { useDeckStore } from '../../store/useDeckStore';

const COLOR_MAP: Record<string, string> = {
  W: '255, 249, 196', // warm white/gold
  U: '59, 130, 246', // blue
  B: '88, 28, 135', // purple-dark
  R: '239, 68, 68', // red
  G: '34, 197, 94' // green
};

function AmbientGlow() {
  const cards = useDeckStore((state) => state.currentDeck);
  const glowColors = useMemo(() => {
    const counts: Record<string, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };

    cards.forEach((card) => {
      const colors = card.colors || [];
      colors.forEach((color) => {
        if (color in counts) counts[color] += 1;
      });
      // Fallback to mana_cost symbols
      if (colors.length === 0 && card.mana_cost) {
        ['W', 'U', 'B', 'R', 'G'].forEach((color) => {
          if (card.mana_cost?.includes(color)) counts[color] += 1;
        });
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    // Return the top 3 colors sorted by count
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([color, count]) => ({
        rgb: COLOR_MAP[color],
        weight: count / total
      }));
  }, [cards]);

  if (glowColors.length === 0) return null;

  // Build radial gradient stops from the dominant colors
  const gradientStops = glowColors.map((glowColor, i) => {
    const opacity = Math.max(0.06, glowColor.weight * 0.18);
    const position = i === 0 ? '20%' : i === 1 ? '50%' : '80%';
    return `rgba(${glowColor.rgb}, ${opacity}) ${position}`;
  });

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-[2000ms] opacity-80"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${gradientStops.join(', ')}, transparent 100%)`
      }}
      aria-hidden="true"
    />
  );
}

export default AmbientGlow;
