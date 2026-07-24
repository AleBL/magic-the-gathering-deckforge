import { Card } from '../types/Card';
import { Deck } from '../types/Deck';
import i18n from '../plugins/i18n';

export interface DecklistLine {
  count: number;
  name: string;
}

/** Groups a flat card array into `{ count, name }` lines sorted by card name. */
export function buildDecklistLines(cards: Card[]): DecklistLine[] {
  const counts = new Map<string, number>();
  for (const card of cards) counts.set(card.name, (counts.get(card.name) ?? 0) + 1);
  return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
}

/** Renders a deck's list to a shareable PNG using the Canvas API (no dependency). */
export async function renderDeckImage(deck: Deck): Promise<Blob> {
  const lines = buildDecklistLines(deck.cards);
  const width = 600;
  const padding = 32;
  const lineHeight = 26;
  const headerHeight = 92;
  const height = headerHeight + lines.length * lineHeight + padding;

  const scale = 2; // render at 2x for crisp text
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.scale(scale, scale);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#0f172a'; // slate-900
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(deck.name, padding, padding + 22);

  ctx.fillStyle = '#94a3b8'; // slate-400
  ctx.font = '14px sans-serif';
  ctx.fillText(`${deck.format} · ${deck.cards.length} ${i18n.t('common.cards')}`, padding, padding + 46);

  ctx.font = '15px sans-serif';
  let y = headerHeight + 4;
  for (const line of lines) {
    ctx.fillStyle = '#38bdf8'; // sky-400 for the count
    ctx.fillText(`${line.count}×`, padding, y);
    ctx.fillStyle = '#e2e8f0'; // slate-200 for the name
    ctx.fillText(line.name, padding + 40, y);
    y += lineHeight;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Failed to render deck image'))), 'image/png');
  });
}
