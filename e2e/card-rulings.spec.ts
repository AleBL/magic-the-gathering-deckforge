import { expect, test } from './fixtures';

test.describe('card rulings', () => {
  test('the card detail loads the rulings on request', async ({ appPage }) => {
    let requests = 0;
    await appPage.route('**/api.scryfall.com/cards/*/rulings*', (route) => {
      requests += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          object: 'list',
          has_more: false,
          data: [{ object: 'ruling', source: 'wotc', published_at: '2021-03-19', comment: 'Bolt can target you.' }]
        })
      });
    });

    await appPage.goto('/');
    await appPage.getByRole('combobox', { name: 'Search cards...' }).fill('bolt');
    await appPage.getByRole('button', { name: 'Search', exact: true }).click();
    await appPage.getByRole('button', { name: 'Lightning Bolt' }).first().click({ force: true });

    const dialog = appPage.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: /Rulings/ })).toBeVisible();
    expect(requests, 'opening the card detail alone should not fetch rulings').toBe(0);

    await dialog.getByRole('button', { name: /Rulings/ }).click();
    await expect(dialog.getByText('Bolt can target you.')).toBeVisible();
  });
});
