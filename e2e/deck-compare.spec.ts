import { expect, test } from './fixtures';
import { seedDecks } from './seed';

test.describe('deck comparison', () => {
  test('two saved decks open side by side from the library menu', async ({ appPage }) => {
    await appPage.goto('/');
    await appPage.getByRole('button', { name: 'My decks' }).click();
    await seedDecks(appPage, ['Burn', 'Burn Budget']);
    await appPage.reload();
    await appPage.getByRole('button', { name: 'My decks' }).click();

    await appPage.getByRole('button', { name: /^More actions Burn$/ }).click();
    await appPage.getByRole('menuitem', { name: 'Compare with…' }).click();

    const dialog = appPage.getByRole('dialog', { name: 'Compare decks' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('combobox')).toHaveValue('seed-deck-1');
    // Both seeded decks hold the same single card, so it is the one card in common.
    await expect(dialog.getByText('1 card in common at the same count')).toBeVisible();

    await appPage.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
