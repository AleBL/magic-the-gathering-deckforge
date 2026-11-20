import { expect, test } from './fixtures';

/**
 * A first visit lands on an empty deck. The empty state offers the three ways in: search
 * for cards, import a list, or start from a sample deck.
 */
test.describe('first run', () => {
  test.beforeEach(async ({ appPage }) => {
    await appPage.goto('/');
    await appPage.getByRole('button', { name: 'My decks' }).click();
    await expect(appPage.getByText('Your deck is empty')).toBeVisible();
  });

  test('search for cards puts the cursor in the search field', async ({ appPage }) => {
    await appPage.getByRole('button', { name: 'Search cards', exact: true }).last().click();
    await expect(appPage.getByRole('textbox', { name: 'Search cards...' })).toBeFocused();
  });

  test('import a deck opens an empty list', async ({ appPage }) => {
    await appPage.getByRole('button', { name: 'Import deck', exact: true }).click();
    const dialog = appPage.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('textbox')).toHaveValue('');
  });

  test('the sample deck opens the import with a real list filled in', async ({ appPage }) => {
    await appPage.getByRole('button', { name: 'Try a sample deck' }).click();
    const dialog = appPage.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('textbox')).toHaveValue(/4 Goblin Guide[\s\S]*20 Mountain/);
  });
});
