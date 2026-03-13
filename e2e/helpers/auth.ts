import { type Page } from "@playwright/test";

// Test user credentials - must exist in the Supabase project
// These are for E2E testing against the real (or staging) database
export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || "e2e-test@sentinel-hostguard.com",
  password: process.env.E2E_TEST_PASSWORD || "TestPassword123!",
  fullName: "E2E Test User",
};

/**
 * Login via UI flow. Use when testing the login page itself
 * or when auth state needs to be set from scratch.
 */
export async function loginViaUI(
  page: Page,
  email = TEST_USER.email,
  password = TEST_USER.password,
  locale = "sk"
) {
  await page.goto(`/${locale}/login`);
  await page.locator('input[id="email"]').fill(email);
  await page.locator('input[id="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  // Wait for redirect to dashboard
  await page.waitForURL(/\/(sk|en)\/(dashboard|search)/, { timeout: 15000 });
}

/**
 * Check if already logged in by checking for auth cookies
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );
}
