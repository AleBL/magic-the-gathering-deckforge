import { expect, test } from './fixtures';

test.describe('sample hand', () => {
  test('deals seven, mulligans to six and draws the next card', async ({ appPage }) => {
    await appPage.goto('/');
    await appPage.getByRole('textbox', { name: 'Search cards...' }).fill('bolt');
    await appPage.getByRole('button', { name: 'Search', exact: true }).click();
    const addCopy = appPage.getByRole('button', { name: 'Add copy' }).first();
    for (let copy = 0; copy < 10; copy += 1) await addCopy.click();

    await appPage.getByRole('button', { name: 'My decks' }).click();
    await appPage.getByRole('button', { name: /^Analysis$/ }).click();

    const hand = appPage.getByRole('list', { name: 'Sample hand' });
    await expect(hand.getByRole('listitem')).toHaveCount(7);

    await appPage.getByRole('button', { name: 'Mulligan to 6' }).click();
    await expect(hand.getByRole('listitem')).toHaveCount(6);

    await appPage.getByRole('button', { name: 'Draw a card' }).click();
    await expect(hand.getByRole('listitem')).toHaveCount(7);
    await expect(appPage.getByText(/6 cards, 0 lands \+1 drawn/)).toBeVisible();
  });
});
