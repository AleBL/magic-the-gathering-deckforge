import { Card } from '../../types/Card';

interface DeckFloatingPreviewProps {
  card: Card;
  mousePos: { x: number; y: number };
}

const CARD_WIDTH = 260;
const CARD_HEIGHT = 364;

import { getCardImageUrl } from '../../utils/deckGrouping';
function DeckFloatingPreview({ card, mousePos }: DeckFloatingPreviewProps) {
  const imageUrl = getCardImageUrl(card);
  if (!imageUrl) return null;

  let left = mousePos.x + 20;
  let top = mousePos.y - CARD_HEIGHT / 2;

  if (left + CARD_WIDTH > window.innerWidth) left = mousePos.x - CARD_WIDTH - 20;
  if (left < 0) left = 10;
  if (top + CARD_HEIGHT > window.innerHeight) top = window.innerHeight - CARD_HEIGHT - 20;
  if (top < 10) top = 10;

  return (
    <div className="floating-card-preview" style={{ left: `${left}px`, top: `${top}px` }}>
      <img src={imageUrl} alt={card.name} className="floating-card-image" />
    </div>
  );
}

export default DeckFloatingPreview;
