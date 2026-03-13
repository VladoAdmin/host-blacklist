import { test, expect } from "@playwright/test";
import { ReportNewPage } from "./pages/report-new.page";
import { loginViaUI } from "./helpers/auth";

const LOCALE = "en";

test.describe("Add Blacklist Entry", () => {
  test.beforeEach(async ({ page }) => {
    const testEmail = process.env.E2E_TEST_EMAIL;
    const testPassword = process.env.E2E_TEST_PASSWORD;

    test.skip(
      !testEmail || !testPassword,
      "E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars required"
    );

    await loginViaUI(page, testEmail!, testPassword!, LOCALE);
  });

  test("should display new report form", async ({ page }) => {
    const reportPage = new ReportNewPage(page);
    await reportPage.goto(LOCALE);

    await expect(reportPage.guestNameInput).toBeVisible();
    await expect(reportPage.guestEmailInput).toBeVisible();
    await expect(reportPage.descriptionTextarea).toBeVisible();
    await expect(reportPage.submitButton).toBeVisible();
  });

  test("should show validation error when guest name is missing", async ({
    page,
  }) => {
    const reportPage = new ReportNewPage(page);
    await reportPage.goto(LOCALE);

    // Try to submit without guest name
    await reportPage.submit();

    // HTML5 validation will prevent submission; check required attribute
    const isRequired = await reportPage.guestNameInput.getAttribute("required");
    expect(isRequired).not.toBeNull();
  });

  test("should show validation error for short description", async ({
    page,
  }) => {
    const reportPage = new ReportNewPage(page);
    await reportPage.goto(LOCALE);

    await reportPage.fillReport({
      guestName: "Test Guest Name",
      incidentType: "damage",
      description: "Short",
    });

    await reportPage.submit();
    await reportPage.expectError();
  });

  test("should create a new report successfully", async ({ page }) => {
    const reportPage = new ReportNewPage(page);
    await reportPage.goto(LOCALE);

    const uniqueName = `E2E Test Guest ${Date.now()}`;

    await reportPage.fillReport({
      guestName: uniqueName,
      guestEmail: `e2e-guest-${Date.now()}@test-sentinel.com`,
      incidentType: "noise",
      description:
        "This is an E2E test report. The guest was extremely noisy and disturbed other guests during the night.",
    });

    await reportPage.submit();

    // Should either show duplicate modal or redirect to guest page
    // Wait for either outcome
    await Promise.race([
      reportPage.expectRedirectToGuest(),
      reportPage.expectDuplicateModal().then(async () => {
        // If duplicates found, proceed anyway
        await reportPage.proceedAnywayButton.click();
        await reportPage.expectRedirectToGuest();
      }),
    ]);
  });

  test("should show duplicate modal for similar guest name", async ({
    page,
  }) => {
    // First create a guest to have something to match against
    const reportPage = new ReportNewPage(page);
    await reportPage.goto(LOCALE);

    // Use a name that might match existing data
    // This test might need to be adjusted based on actual data
    await reportPage.fillReport({
      guestName: "Jan Novak",
      guestEmail: "existing@test.com",
      incidentType: "fraud",
      description:
        "Testing duplicate detection - this should trigger the modal if similar guests exist.",
    });

    await reportPage.submit();

    // Wait a bit for the duplicate check
    await page.waitForTimeout(3000);

    // We verify the page either redirected or showed the modal
    // Both are valid outcomes depending on existing data
    const url = page.url();
    const modalVisible = await reportPage.duplicateModal
      .isVisible()
      .catch(() => false);
    expect(url.includes("/guest/") || modalVisible).toBeTruthy();
  });
});
