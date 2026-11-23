import { expect, test } from './fixtures';

test.describe('life counter', () => {
  test('tracks life and commander damage and keeps the game after closing', async ({ appPage }) => {
    await appPage.goto('/');
    await appPage.getByRole('button', { name: 'Profile & settings' }).click();
    await appPage.getByRole('menuitem', { name: 'Life counter' }).click();

    const counter = appPage.getByRole('dialog', { name: 'Life counter' });
    await expect(counter).toBeVisible();
    const first = counter.getByRole('region', { name: 'Player 1' });
    await expect(first.getByText('20', { exact: true })).toBeVisible();

    await counter.getByRole('button', { name: 'Player 1 gains 1 life' }).click();
    await expect(first.getByText('21', { exact: true })).toBeVisible();

    await counter.getByRole('combobox').first().selectOption('4');
    await counter.getByRole('combobox').nth(1).selectOption('40');
    await expect(counter.getByRole('region')).toHaveCount(4);
    await counter.getByRole('button', { name: 'Player 2 takes 1 commander damage from Player 1' }).click();
    await expect(counter.getByRole('region', { name: 'Player 2' }).getByText('39', { exact: true })).toBeVisible();

    await appPage.keyboard.press('Escape');
    await expect(counter).toBeHidden();

    await appPage.getByRole('button', { name: 'Profile & settings' }).click();
    await appPage.getByRole('menuitem', { name: 'Life counter' }).click();
    await expect(appPage.getByRole('dialog', { name: 'Life counter' }).getByRole('region')).toHaveCount(4);
  });
});
