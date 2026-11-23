import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, type Page } from '@playwright/test';
import { mockScryfall } from './fixtures';

/**
 * Visual baseline: walks the main screens in light/dark at desktop and phone sizes and
 * saves one screenshot per screen under `visual-results/<mode>/`.
 *
 * It asserts nothing about pixels on purpose. Fonts and antialiasing differ between
 * machines, so a pixel diff would be noise; the captures are reviewed by eye before and
 * after each redesign package. Run with `yarn test:e2e:visual`.
 *
 * Needs `seed-profile.json` at the repo root (`yarn seed:profile`). The Scryfall API is
 * stubbed; card images load from the CDN so the art reads as it ships. Set
 * VISUAL_OFFLINE=1 to stub the images too.
 */

const ROOT = join(__dirname, '..');
const SEED = join(ROOT, 'seed-profile.json');
// Outside test-results/: every Playwright run wipes that folder, captures included.
const OUT = join(ROOT, 'visual-results');

const MODES = [
  { name: 'desktop-light', viewport: { width: 1440, height: 900 }, colorScheme: 'light' },
  { name: 'desktop-dark', viewport: { width: 1440, height: 900 }, colorScheme: 'dark' },
  { name: 'mobile-light', viewport: { width: 390, height: 844 }, colorScheme: 'light' },
  { name: 'mobile-dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark' }
] as const;

interface SeedProfile {
  decks: { name: string; cards: Record<string, unknown>[] }[];
}

function seedCards() {
  const profile = JSON.parse(readFileSync(SEED, 'utf8')) as SeedProfile;
  const seen = new Set<string>();
  const cards: Record<string, unknown>[] = [];
  for (const deck of profile.decks) {
    for (const card of deck.cards) {
      const name = String(card.name);
      if (seen.has(name)) continue;
      seen.add(name);
      cards.push(card);
    }
  }
  return cards.slice(0, 24);
}

/** A missing control on one screen should not cost the captures of the others. */
async function step(page: Page, label: string, action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    const reason = `${label}: ${String(error).split('\n').slice(0, 12).join(' / ')}`;
    test.info().annotations.push({ type: 'skipped-screen', description: reason });
    // The list reporter does not print annotations; this is the only trace of a skipped screen.
    // eslint-disable-next-line no-console
    console.warn(`[visual] skipped ${reason}`);
    await page.keyboard.press('Escape').catch(() => undefined);
  }
}

async function capture(page: Page, mode: string, name: string) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(OUT, mode, `${name}.png`) });
}

async function restoreSeed(page: Page) {
  await page.getByRole('button', { name: 'Profile & Settings' }).click();
  await page.getByRole('menuitem', { name: 'Backup' }).click();
  await page.getByRole('menu').locator('input[type="file"]').setInputFiles(SEED);
  await page.getByRole('button', { name: 'Replace everything' }).click();
  await page.getByRole('button', { name: 'Yes, delete and replace' }).click();
  await page.getByText(/Restored \d+ decks/).waitFor();
  await page.keyboard.press('Escape');
  await page.reload();
}

/** On a phone the tabs live behind the page menu, on desktop in the header. */
async function openTab(page: Page, name: RegExp) {
  const tab = page.getByRole('button', { name }).first();
  if (await tab.isVisible()) {
    await tab.click();
    return;
  }
  await page
    .getByRole('button', { name: /page actions|menu/i })
    .first()
    .click();
  await page.getByRole('menuitem', { name }).first().click();
}

test.describe('visual baseline', () => {
  test.skip(!existsSync(SEED), 'seed-profile.json missing: run `yarn seed:profile` first');
  test.describe.configure({ mode: 'parallel' });
  test.setTimeout(180_000);

  for (const mode of MODES) {
    test(mode.name, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: mode.viewport,
        colorScheme: mode.colorScheme,
        serviceWorkers: 'block',
        hasTouch: mode.name.startsWith('mobile')
      });
      await context.addInitScript(() => window.localStorage.setItem('deckforge_language', 'en'));
      const page = await context.newPage();
      // Without a cap, one control that never becomes clickable eats the whole test budget.
      page.setDefaultTimeout(8000);
      await mockScryfall(page, seedCards());
      if (!process.env.VISUAL_OFFLINE) {
        await page.route('**/cards.scryfall.io/**', (route) => route.continue());
      }

      // The backup panel sits behind the page menu on a phone; restoring at desktop width
      // keeps one code path, and the data is the same once the viewport shrinks back.
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      await restoreSeed(page);
      await page.setViewportSize(mode.viewport);
      await page.reload();
      await capture(page, mode.name, '01-search-empty');

      await step(page, 'search results', async () => {
        const input = page.getByPlaceholder(/search cards/i).first();
        await input.fill('bolt');
        await input.press('Enter');
        await page.locator('.card-image-button').nth(3).waitFor({ timeout: 10_000 });
        await page.waitForTimeout(1500);
        await capture(page, mode.name, '02-search-results');
      });

      await step(page, 'card detail', async () => {
        // The tilt effect keeps the card transform moving, so it never reads as "stable".
        await page.locator('.card-image-button').nth(2).click({ force: true });
        await page.getByRole('dialog').first().waitFor();
        await capture(page, mode.name, '04-card-detail');
        await page.keyboard.press('Escape');
      });

      await step(page, 'advanced filters', async () => {
        await page.getByRole('button', { name: 'Advanced Filters' }).first().click();
        await capture(page, mode.name, '03-search-filters');
      });
      // The phone filter sheet does not close on Escape; a reload resets every overlay.
      await page.reload();

      await step(page, 'profile menu', async () => {
        await page.getByRole('button', { name: 'Profile & Settings' }).click();
        await capture(page, mode.name, '05-profile-menu');
        await page.keyboard.press('Escape');
      });

      await step(page, 'deck library', async () => {
        await openTab(page, /my decks/i);
        const savedDecksToggle = page.locator('[aria-controls="saved-decks-panel"]');
        // The phone layout folds the saved decks behind a toggle.
        if (mode.name.startsWith('mobile')) await savedDecksToggle.click();
        await page.locator('text=/Burn/ >> visible=true').first().waitFor();
        await capture(page, mode.name, '06-deck-library');
      });

      await step(page, 'deck open', async () => {
        await page.locator('text=/Burn/ >> visible=true').first().click();
        await page.waitForTimeout(1200);
        await capture(page, mode.name, '07-deck-open');
      });

      await step(page, 'deck stats', async () => {
        await page
          .getByRole('button', { name: /^analysis$/i })
          .first()
          .click();
        await page.waitForTimeout(1200);
        await capture(page, mode.name, '08-deck-stats');
      });

      await step(page, 'playtest', async () => {
        if (mode.name.startsWith('mobile')) {
          await page.getByRole('button', { name: 'Page actions' }).click();
          await page
            .getByRole('dialog')
            .getByRole('button', { name: /playtest/i })
            .first()
            .click();
        } else {
          await page
            .getByRole('button', { name: /playtest/i })
            .first()
            .click();
        }
        await page.waitForTimeout(1500);
        await capture(page, mode.name, '09-playtest');
        await page.getByRole('button', { name: 'Close' }).last().click();
        await page.waitForTimeout(400);
      });

      await step(page, 'collection', async () => {
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        await openTab(page, /my collection/i);
        await page.waitForTimeout(1500);
        await capture(page, mode.name, '10-collection');
      });

      await step(page, 'command palette', async () => {
        await page.keyboard.press('Control+k');
        await page.waitForTimeout(300);
        await capture(page, mode.name, '11-command-palette');
        await page.keyboard.press('Escape');
      });

      await step(page, 'shortcuts', async () => {
        await page.keyboard.press('Shift+Slash');
        await page.waitForTimeout(300);
        await capture(page, mode.name, '12-shortcuts');
        await page.keyboard.press('Escape');
      });

      await context.close();
    });
  }
});
