import { ReactNode } from 'react';
import i18n from '../plugins/i18n';
import { dispatchToast } from './toastHelper';
let symbolMap: Record<string, string> = {};
let isFetching = false;

interface ScryfallSymbol {
  symbol?: string;
  svg_uri?: string;
}

export async function fetchSymbols() {
  if (Object.keys(symbolMap).length > 0 || isFetching) return;
  isFetching = true;
  try {
    const res = await fetch('https://api.scryfall.com/symbology');
    const json = await res.json();
    if (json.data && Array.isArray(json.data)) {
      const map: Record<string, string> = {};
      json.data.forEach((sym: ScryfallSymbol) => {
        if (sym.symbol && sym.svg_uri) {
          map[sym.symbol] = sym.svg_uri;
        }
      });
      symbolMap = map;
    }
  } catch {
    dispatchToast(i18n.t('common.errorFetchingSymbology') as string, 'danger');
  } finally {
    isFetching = false;
  }
}

export function getSymbolUrl(symbol: string): string {
  if (symbolMap[symbol]) {
    return symbolMap[symbol];
  }
  const clean = symbol.replace(/[{}]/g, '').replace(/\//g, '');
  return `https://svgs.scryfall.io/card-symbols/${clean}.svg`;
}

export function parseTextWithSymbols(text: string | undefined, isLarge = false): ReactNode[] {
  if (!text) return [];
  const symbolRegex = /(\{[^}]+\})/g;
  const parts = text.split(symbolRegex);
  return parts.map((part, index) => {
    if (symbolRegex.test(part)) {
      const url = getSymbolUrl(part);
      const sizeClass = isLarge ? 'w-5 h-5 mx-[2px]' : 'w-4 h-4 mx-[1px]';
      return (
        <img
          key={index}
          src={url}
          alt={part}
          className={`inline-block ${sizeClass} align-middle select-none`}
          style={{ verticalAlign: '-0.12em' }}
        />
      );
    }
    return <span key={index}>{part}</span>;
  });
}
