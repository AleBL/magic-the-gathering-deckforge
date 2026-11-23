import { expect, test } from './fixtures';
import { seedDecks } from './seed';

test.describe('deck tags', () => {
  test('a tagged deck can be found through the tag filter', async ({ appPage }) => {
    await appPage.goto('/');
    await appPage.getByRole('button', { name: 'My decks' }).click();
    await seedDecks(appPage, ['Burn', 'Control', 'Ramp']);
    await appPage.reload();
    await appPage.getByRole('button', { name: 'My decks' }).click();

    await appPage.getByRole('button', { name: /^More actions Burn$/ }).click();
    await appPage.getByRole('menuitem', { name: 'Edit tags' }).click();
    const dialog = appPage.getByRole('dialog', { name: 'Tags for Burn' });
    await dialog.getByLabel('Separate tags with commas').fill('Budget,  aggro, budget');
    await dialog.getByRole('button', { name: 'Save tags' }).click();
    await expect(dialog).toBeHidden();

    const filter = appPage.getByRole('group', { name: 'Filter by tag' });
    await filter.getByRole('button', { name: 'Budget' }).click();
    const list = appPage.locator('.deck-list-section');
    await expect(list.getByText('Burn', { exact: true })).toBeVisible();
    await expect(list.getByText('Control', { exact: true })).toBeHidden();

    // The tags survive a reload: they are stored with the deck.
    await appPage.reload();
    await appPage.getByRole('button', { name: 'My decks' }).click();
    await expect(appPage.getByText('Budget, aggro')).toBeVisible();
  });
});
