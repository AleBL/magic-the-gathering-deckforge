import { expect, stubCard, test } from './fixtures';

test.describe('collection quick add', () => {
  test('adds printings by set and number and names the ones it cannot find', async ({ appPage }) => {
    await appPage.route('**/api.scryfall.com/cards/collection*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          object: 'list',
          not_found: [{ set: 'mh3', collector_number: '999' }],
          data: [{ ...stubCard({ name: 'Lightning Bolt', id: 'mh3-bolt' }), set: 'mh3', collector_number: '123' }]
        })
      })
    );

    await appPage.goto('/');
    await appPage.getByRole('button', { name: 'My collection' }).click();

    const field = appPage.getByLabel('Add by set and number');
    await field.fill('4 mh3 123');
    await field.press('Shift+Enter');
    await field.pressSequentially('mh3 999');
    await appPage.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(appPage.getByRole('status').filter({ hasText: 'Added 4 cards' })).toContainText('MH3 999');
    await expect(appPage.getByRole('button', { name: 'Lightning Bolt' }).first()).toBeVisible();
  });
});
