import { test, expect, type Page } from "@playwright/test";
import { stations } from "../src/data/stations";

/**
 * E2E coverage for the search sheet's "Clear filters" affordance (#14).
 *
 * The search sheet is pure 2D UI, so the boot helper only needs to block
 * external traffic (fonts, analytics, …) and let the local preview server
 * through — no stream stubbing like player.spec.ts requires.
 */

/** All station count, used to assert the sheet shows the full list after a reset. */
const ALL = `${stations.length} stations`;

async function bootApp(page: Page) {
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.startsWith("http://localhost")) return route.continue();
    return route.abort();
  });
  await page.goto("/");
  await page.locator('[data-testid="player-empty"]').waitFor();
}

async function openSearch(page: Page) {
  await page.locator('[data-testid="search-trigger"]').click();
  await page.locator('[data-testid="search-sheet"]').waitFor();
}

const clearButton = (page: Page) =>
  page.locator('[data-testid="search-clear-filters"]');

test.describe("search: Clear filters (#14)", () => {
  test("resets a text-only query", async ({ page }) => {
    await bootApp(page);
    await openSearch(page);

    await page.locator('[data-testid="search-input"]').fill("KEXP");
    await expect(page.locator('[data-testid="search-results-count"]')).toHaveText(
      "1 station",
    );
    await expect(clearButton(page)).toBeVisible();

    await clearButton(page).click();

    // The query must be wiped and the full list restored.
    await expect(page.locator('[data-testid="search-input"]')).toHaveValue("");
    await expect(page.locator('[data-testid="search-results-count"]')).toHaveText(
      ALL,
    );
    // Nothing left to clear → the button disappears.
    await expect(clearButton(page)).toHaveCount(0);
  });

  test("resets a query and the chip filters together", async ({ page }) => {
    await bootApp(page);
    await openSearch(page);

    await page.locator('[data-testid="search-input"]').fill("pop");
    // Toggle a genre chip (the first available option).
    await page
      .locator('[data-testid="search-sheet"] button[aria-pressed]')
      .first()
      .click();
    const narrowed = await page
      .locator('[data-testid="search-results-count"]')
      .textContent();
    expect(narrowed).not.toBe(ALL);

    await clearButton(page).click();

    await expect(page.locator('[data-testid="search-input"]')).toHaveValue("");
    await expect(page.locator('[data-testid="search-results-count"]')).toHaveText(
      ALL,
    );
    await expect(clearButton(page)).toHaveCount(0);
  });
});
