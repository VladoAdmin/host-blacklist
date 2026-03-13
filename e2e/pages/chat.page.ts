import { type Page, type Locator, expect } from "@playwright/test";

export class ChatPage {
  readonly page: Page;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messageCards: Locator;
  readonly likeButtons: Locator;
  readonly noMessages: Locator;

  constructor(page: Page) {
    this.page = page;
    this.messageInput = page.locator("textarea").first();
    this.sendButton = page.locator('button[type="submit"]');
    this.messageCards = page.locator('[data-slot="card"]');
    this.likeButtons = page.locator('button:has(svg.size-3\\.5)').filter({
      has: page.locator("svg"),
    });
    this.noMessages = page.getByText(
      /no messages|žiadne správy|be the first/i
    );
  }

  async goto(locale = "sk") {
    await this.page.goto(`/${locale}/chat`);
    await this.page.waitForTimeout(2000);
  }

  async sendMessage(text: string) {
    await this.messageInput.fill(text);
    await this.sendButton.click();
    // Wait for message to appear
    await this.page.waitForTimeout(1000);
  }

  async expectMessageVisible(text: string) {
    await expect(this.page.getByText(text)).toBeVisible({ timeout: 10000 });
  }

  async likeFirstMessage() {
    // Find the first heart/like button
    const heartButton = this.page
      .locator("button")
      .filter({ has: this.page.locator("svg.size-3\\.5") })
      .first();
    await heartButton.click();
    await this.page.waitForTimeout(500);
  }

  async getMessageCount(): Promise<number> {
    return this.messageCards.count();
  }
}
