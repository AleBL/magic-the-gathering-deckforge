import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getSymbolUrl, parseTextWithSymbols } from './symbolHelper';

describe('getSymbolUrl', () => {
  it('builds a Scryfall svg url for an unknown symbol, stripping braces', () => {
    expect(getSymbolUrl('{G}')).toBe('https://svgs.scryfall.io/card-symbols/G.svg');
  });

  it('strips slashes from hybrid symbols', () => {
    expect(getSymbolUrl('{G/W}')).toBe('https://svgs.scryfall.io/card-symbols/GW.svg');
  });
});

describe('parseTextWithSymbols', () => {
  it('renders mana symbols as images and keeps surrounding text', () => {
    render(<div>{parseTextWithSymbols('{T}: Add {G}.')}</div>);

    expect(screen.getByAltText('{T}')).toBeInTheDocument();
    expect(screen.getByAltText('{G}')).toBeInTheDocument();
    expect(screen.getByText(/Add/)).toBeInTheDocument();
  });

  it('returns nothing for empty or undefined text', () => {
    expect(parseTextWithSymbols(undefined)).toEqual([]);
    expect(parseTextWithSymbols('')).toEqual([]);
  });
});
