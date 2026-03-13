import { type Page, type Locator, expect } from "@playwright/test";

export class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly guestCards: Locator;
  readonly noResults: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('input[type="text"]').first();
    this.guestCards = page.locator('[data-slot="card"]');
    this.noResults = page.getByText(/no results|žiadne výsledky|no guests/i);
    this.loadingSpinner = page.locator(".animate-spin");
  }

  async goto(locale = "sk") {
    await this.page.goto(`/${locale}/search`);
    await expect(this.searchInput).toBeVisible();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    // Wait for debounce (300ms) + API call
    await this.page.waitForTimeout(500);
    // Wait for loading to finish
    await expect(this.loadingSpinner).toBeHidden({ timeout: 10000 });
  }

  async expectResults(minCount = 1) {
    await expect(this.guestCards.first()).toBeVisible({ timeout: 10000 });
    const count = await this.guestCards.count();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  async expectNoResults() {
    await this.page.waitForTimeout(1000);
    // Either shows "no results" message or no guest cards
    const cardsCount = await this.guestCards.count();
    expect(cardsCount).toBe(0);
  }

  async clickFirstResult() {
    await this.guestCards.first().click();
    await this.page.waitForURL(/\/(sk|en)\/guest\//, { timeout: 10000 });
  }
}
