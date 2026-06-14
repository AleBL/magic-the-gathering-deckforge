import { Card } from '../types/Card';

function getNormalizedTypeLine(card: Card): string {
  return card.type_line?.toLowerCase() ?? '';
}

export function isCreatureCard(card: Card): boolean {
  return getNormalizedTypeLine(card).includes('creature');
}

export function isPlaneswalkerCard(card: Card): boolean {
  return getNormalizedTypeLine(card).includes('planeswalker');
}

export function isArtifactCard(card: Card): boolean {
  return getNormalizedTypeLine(card).includes('artifact');
}

export function isEnchantmentCard(card: Card): boolean {
  return getNormalizedTypeLine(card).includes('enchantment');
}

export function isLandCard(card: Card): boolean {
  return getNormalizedTypeLine(card).includes('land');
}

export function isFrontlineCard(card: Card): boolean {
  return isCreatureCard(card) || isPlaneswalkerCard(card);
}

export function isBacklineSupportCard(card: Card): boolean {
  return (isArtifactCard(card) || isEnchantmentCard(card)) && !isCreatureCard(card) && !isLandCard(card);
}

export function isSpellCard(card: Card): boolean {
  return !isFrontlineCard(card) && !isLandCard(card) && !isArtifactCard(card) && !isEnchantmentCard(card);
}
