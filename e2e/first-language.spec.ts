import { expect, test } from '@playwright/test';
import { mockScryfall } from './fixtures';

/**
 * A first visit has no saved language. The app used to start in Portuguese for everyone;
 * it now follows the browser. The shared fixture pins English, so this spec uses a bare page.
 */
test.describe('first visit language', () => {
  test.use({ locale: 'es-ES', serviceWorkers: 'block' });

  test('a Spanish browser opens the app in Spanish', async ({ page }) => {
    await mockScryfall(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Buscar cartas/i }).first()).toBeVisible();
    // Nothing is saved until the user picks a language, so the app keeps following the browser.
    expect(await page.evaluate(() => localStorage.getItem('deckforge_language'))).toBeNull();
  });
});
