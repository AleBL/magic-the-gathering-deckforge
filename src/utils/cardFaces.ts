import { Card } from '../types/Card';

export interface CardFaceImages {
  front: string;
  back: string;
}

function faceImage(face: NonNullable<Card['card_faces']>[number]): string {
  return face.image_uris?.normal || face.image_uris?.large || face.image_uris?.png || '';
}

/**
 * Returns the two face image URLs for a genuinely double-faced card
 * (transform / modal double-faced), or `null` otherwise.
 *
 * Only cards whose two faces each carry their own `image_uris` qualify —
 * that excludes split, adventure and flip cards, which share a single
 * physical image and must not be flipped.
 */
export function getCardFaceImages(card: Card): CardFaceImages | null {
  const faces = card.card_faces;
  if (!faces || faces.length < 2) return null;

  const front = faceImage(faces[0]);
  const back = faceImage(faces[1]);
  if (!front || !back) return null;

  return { front, back };
}

/** Whether the card can be flipped to reveal a distinct back face. */
export function isDoubleFaced(card: Card): boolean {
  return getCardFaceImages(card) !== null;
}
