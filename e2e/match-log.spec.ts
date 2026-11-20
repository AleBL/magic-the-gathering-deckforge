import { expect, test } from './fixtures';
import { seedDecks } from './seed';

test.describe('match log', () => {
  test('logged games turn into a win rate by matchup', async ({ appPage }) => {
    await appPage.goto('/');
    await appPage.getByRole('button', { name: 'My decks' }).click();
    await seedDecks(appPage, ['Burn']);
    await appPage.reload();
    await appPage.getByRole('button', { name: 'My decks' }).click();
    await appPage.getByText('Burn', { exact: true }).first().click();
    await appPage.getByRole('button', { name: /^Analysis$/ }).click();

    await expect(appPage.getByText(/No games logged yet/)).toBeVisible();
    await appPage.getByLabel('Opponent').fill('Mono-red');
    await appPage.getByRole('button', { name: 'Log game' }).click();
    await appPage.getByRole('button', { name: 'Loss', exact: true }).click();
    await appPage.getByLabel('Opponent').fill('mono-red');
    await appPage.getByRole('button', { name: 'Log game' }).click();

    const table = appPage.getByRole('table', { name: 'By matchup' });
    const row = table.locator('tbody tr').first();
    await expect(row).toContainText('Mono-red');
    await expect(row).toContainText('2');
    await expect(row).toContainText('50%');

    // Stored with the deck: still there after a reload.
    await appPage.reload();
    await appPage.getByRole('button', { name: 'My decks' }).click();
    await appPage.getByText('Burn', { exact: true }).first().click();
    await appPage.getByRole('button', { name: /^Analysis$/ }).click();
    await expect(appPage.getByRole('table', { name: 'By matchup' })).toBeVisible();
  });
});
