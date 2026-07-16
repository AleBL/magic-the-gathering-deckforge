import { useMemo } from 'react';

import { useDeckStore } from '../../store/useDeckStore';
import { useVisualEffects } from '../../hooks/useVisualEffects';

const COLOR_MAP: Record<string, string> = {
  W: '255, 249, 196', // warm white/gold
  U: '59, 130, 246', // blue
  B: '88, 28, 135', // purple-dark
  R: '239, 68, 68', // red
  G: '34, 197, 94' // green
};

interface AmbientGlowProps {
  /** In the playtest, a critical life total floods the scene red and pulses. */
  lowLife?: boolean;
  /** Opacity multiplier for the glow — >1 for the premium playtest ambience. */
  intensity?: number;
  /** Override positioning (default is a fixed full-viewport layer). */
  positionClassName?: string;
}

function AmbientGlow({ lowLife = false, intensity = 1, positionClassName = 'fixed inset-0 z-0' }: AmbientGlowProps) {
  const { effectsEnabled, motionEnabled } = useVisualEffects();
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

  // The whole ambient layer is part of the opt-in visual-effects package.
  if (!effectsEnabled) return null;
  if (glowColors.length === 0 && !lowLife) return null;

  // Low life overrides the deck-identity palette with an urgent red wash.
  const gradientStops = lowLife
    ? [`rgba(239, 68, 68, ${0.24 * intensity})`, `rgba(220, 38, 38, ${0.14 * intensity}) 55%`, 'transparent 100%']
    : glowColors.map((glowColor, i) => {
        const opacity = Math.max(0.06, glowColor.weight * 0.18 * intensity);
        const position = i === 0 ? '20%' : i === 1 ? '50%' : '80%';
        return `rgba(${glowColor.rgb}, ${opacity}) ${position}`;
      });

  const pulse = lowLife && motionEnabled ? 'ambient-glow-pulse' : '';

  return (
    <div
      className={`ambient-glow-layer pointer-events-none opacity-80 ${positionClassName} ${pulse}`}
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${gradientStops.join(', ')}, transparent 100%)`
      }}
      aria-hidden="true"
    />
  );
}

export default AmbientGlow;
