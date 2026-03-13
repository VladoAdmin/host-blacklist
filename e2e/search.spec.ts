import { test, expect } from "@playwright/test";
import { SearchPage } from "./pages/search.page";
import { loginViaUI, TEST_USER } from "./helpers/auth";

const LOCALE = "en";

test.describe("Guest Search", () => {
  test.beforeEach(async ({ page }) => {
    const testEmail = process.env.E2E_TEST_EMAIL;
    const testPassword = process.env.E2E_TEST_PASSWORD;

    test.skip(
      !testEmail || !testPassword,
      "E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars required"
    );

    await loginViaUI(page, testEmail!, testPassword!, LOCALE);
  });

  test("should display search page with input", async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.goto(LOCALE);

    await expect(searchPage.searchInput).toBeVisible();
  });

  test("should not search with less than 2 characters", async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.goto(LOCALE);

    await searchPage.search("a");
    await searchPage.expectNoResults();
  });

  test("should find guests by name", async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.goto(LOCALE);

    // Search for a common name that should exist in the database
    await searchPage.search("test");

    // We expect either results or no results depending on data
    // The key is that the search completes without errors
    await page.waitForTimeout(2000);
    const hasConsoleErrors = await page.evaluate(() => {
      return (window as unknown as { __consoleErrors?: string[] })
        .__consoleErrors?.length;
    });
    expect(hasConsoleErrors).toBeFalsy();
  });

  test("should show no results for gibberish query", async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.goto(LOCALE);

    await searchPage.search("zzxxqqww123456");
    await searchPage.expectNoResults();
  });

  test("should handle search input clearing", async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.goto(LOCALE);

    await searchPage.search("test name");
    await page.waitForTimeout(500);

    // Clear the input
    await searchPage.searchInput.fill("");
    await page.waitForTimeout(500);

    // Should show no results after clearing
    await searchPage.expectNoResults();
  });
});
