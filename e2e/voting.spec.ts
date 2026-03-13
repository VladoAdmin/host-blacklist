import { test, expect } from "@playwright/test";
import { loginViaUI } from "./helpers/auth";

const LOCALE = "en";

test.describe("Voting on Reports", () => {
  test.beforeEach(async ({ page }) => {
    const testEmail = process.env.E2E_TEST_EMAIL;
    const testPassword = process.env.E2E_TEST_PASSWORD;

    test.skip(
      !testEmail || !testPassword,
      "E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars required"
    );

    await loginViaUI(page, testEmail!, testPassword!, LOCALE);
  });

  test("should show flag button on other users reports", async ({ page }) => {
    // Navigate to search and find a guest with reports
    await page.goto(`/${LOCALE}/search`);
    await page.waitForTimeout(2000);

    // Search for any guest
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill("test");
    await page.waitForTimeout(1500);

    // Try to click on first result if available
    const firstCard = page.locator('[data-slot="card"]').first();
    const cardVisible = await firstCard.isVisible().catch(() => false);

    if (!cardVisible) {
      test.skip(true, "No search results available for voting test");
      return;
    }

    await firstCard.click();
    await page.waitForURL(/\/(sk|en)\/guest\//, { timeout: 10000 });

    // Check for flag/report button on reports that aren't ours
    const flagButton = page.getByText(/report as false|nahlásiť/i);
    const editButton = page.getByText(/edit/i);
    const hasFlag = await flagButton.isVisible().catch(() => false);
    const hasEdit = await editButton.isVisible().catch(() => false);

    // Either flag (other's report) or edit (own report) should be visible
    expect(hasFlag || hasEdit).toBeTruthy();
  });

  test("should open flag dialog when clicking report as false", async ({
    page,
  }) => {
    await page.goto(`/${LOCALE}/search`);
    await page.waitForTimeout(2000);

    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill("test");
    await page.waitForTimeout(1500);

    const firstCard = page.locator('[data-slot="card"]').first();
    const cardVisible = await firstCard.isVisible().catch(() => false);

    if (!cardVisible) {
      test.skip(true, "No search results available for flag test");
      return;
    }

    await firstCard.click();
    await page.waitForURL(/\/(sk|en)\/guest\//, { timeout: 10000 });

    // Find and click the flag button
    const flagButton = page
      .getByRole("button")
      .filter({ hasText: /report as false|nahlásiť ako nepravdivé/i })
      .first();
    const hasFlag = await flagButton.isVisible().catch(() => false);

    if (!hasFlag) {
      test.skip(true, "No flaggable reports found (may be own reports)");
      return;
    }

    await flagButton.click();

    // Check that the flag dialog opens
    const dialog = page.locator('[data-slot="dialog-content"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Check the textarea is present
    const textarea = dialog.locator("textarea");
    await expect(textarea).toBeVisible();

    // Check submit button is disabled initially (min 10 chars)
    const submitBtn = dialog
      .getByRole("button")
      .filter({ hasText: /submit|odoslať/i });
    await expect(submitBtn).toBeDisabled();

    // Type a reason and check button becomes enabled
    await textarea.fill("This is a false report and should be reviewed by moderators");
    await expect(submitBtn).toBeEnabled();
  });
});
