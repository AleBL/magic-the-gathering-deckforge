import { expect, test } from './fixtures';

/**
 * Playing a card from the hand is the main interaction of the simulator, so the hand has to
 * be on screen without scrolling at a common laptop size. It used to sit below the fold at
 * 1440x900, under a battlefield that took the whole height.
 */
test.describe('playtest layout', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('the hand is visible without scrolling at 1280x720', async ({ appPage }) => {
    await appPage.goto('/');
    await appPage.getByRole('combobox', { name: 'Search cards...' }).fill('bolt');
    await appPage.getByRole('button', { name: 'Search', exact: true }).click();
    await appPage.getByRole('button', { name: 'Add copy' }).click();
    await appPage.getByRole('button', { name: 'My Decks' }).click();
    await appPage
      .getByRole('button', { name: /playtest/i })
      .first()
      .click();

    const simulator = appPage.getByRole('dialog', { name: /playtest/i });
    await expect(simulator).toBeVisible();

    const handLabel = simulator.getByText(/^Hand \(\d+\)$/);
    await expect(handLabel).toBeVisible();
    const handCard = simulator.getByRole('img', { name: 'Lightning Bolt' }).first();
    await expect(handCard).toBeVisible();

    const box = await handCard.boundingBox();
    expect(box, 'the card in hand has no layout box').not.toBeNull();
    expect(box!.y + box!.height, 'the card in hand ends below the window').toBeLessThanOrEqual(720);
  });
});
