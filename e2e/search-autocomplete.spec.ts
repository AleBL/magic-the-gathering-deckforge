import { expect, test } from './fixtures';

test.describe('search autocomplete', () => {
  test.beforeEach(async ({ appPage }) => {
    await appPage.route('**/api.scryfall.com/cards/autocomplete*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ object: 'catalog', total_values: 2, data: ['Lightning Bolt', 'Lightning Helix'] })
      })
    );
    await appPage.goto('/');
  });

  test('suggests card names and picks one from the keyboard', async ({ appPage }) => {
    const field = appPage.getByRole('combobox', { name: 'Search cards...' });
    await field.fill('light');

    const list = appPage.getByRole('listbox', { name: 'Card name suggestions' });
    await expect(list.getByRole('option')).toHaveCount(2);

    await field.press('ArrowDown');
    await field.press('ArrowDown');
    await field.press('Enter');
    await expect(field).toHaveValue('Lightning Helix');
    await expect(list).toBeHidden();
  });

  test('offers recent searches when the field is empty', async ({ appPage }) => {
    const field = appPage.getByRole('combobox', { name: 'Search cards...' });
    await field.fill('bolt');
    await field.press('Enter');
    await field.fill('');
    await field.blur();
    await field.focus();

    const list = appPage.getByRole('listbox', { name: 'Card name suggestions' });
    await expect(list.getByRole('option', { name: 'bolt' })).toBeVisible();
    await appPage.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(list).toBeHidden();
  });
});
