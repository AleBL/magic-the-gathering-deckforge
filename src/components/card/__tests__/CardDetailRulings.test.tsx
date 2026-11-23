import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '../../../plugins/i18n';
import i18n from '../../../plugins/i18n';
import { CardDetailRulings } from '../CardDetailRulings';
import { clearRulingsCache } from '../../../hooks/useCardRulings';

const byId = vi.fn();
vi.mock('scryfall-sdk', () => ({ Rulings: { byId: (id: string) => byId(id) } }));

describe('CardDetailRulings', () => {
  beforeEach(async () => {
    byId.mockReset();
    clearRulingsCache();
    await i18n.changeLanguage('en');
  });

  it('asks Scryfall for nothing until the panel is opened', () => {
    render(<CardDetailRulings cardId="bolt" oracleId="oracle-bolt" />);
    expect(byId).not.toHaveBeenCalled();
  });

  it('lists the rulings newest first once opened', async () => {
    byId.mockResolvedValue([
      { source: 'wotc', published_at: '2004-10-04', comment: 'Old ruling' },
      { source: 'wotc', published_at: '2021-03-19', comment: 'New ruling' }
    ]);
    render(<CardDetailRulings cardId="bolt" oracleId="oracle-bolt" />);
    fireEvent.click(screen.getByRole('button', { name: /rulings/i }));

    await waitFor(() => expect(screen.getByText('New ruling')).toBeTruthy());
    const items = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(items[0]).toContain('New ruling');
    expect(items[1]).toContain('Old ruling');
  });

  it('says so when a card has no rulings', async () => {
    byId.mockResolvedValue([]);
    render(<CardDetailRulings cardId="vanilla" oracleId="oracle-vanilla" />);
    fireEvent.click(screen.getByRole('button', { name: /rulings/i }));
    await waitFor(() => expect(screen.getByText('No rulings for this card')).toBeTruthy());
  });

  it('offers a retry after a failed request', async () => {
    byId
      .mockRejectedValueOnce(new Error('503'))
      .mockResolvedValueOnce([{ source: 'wotc', published_at: '2020-01-01', comment: 'Back again' }]);
    render(<CardDetailRulings cardId="bolt" oracleId="oracle-bolt" />);
    fireEvent.click(screen.getByRole('button', { name: /rulings/i }));

    await waitFor(() => expect(screen.getByText('Could not load the rulings')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByText('Back again')).toBeTruthy());
  });
});
