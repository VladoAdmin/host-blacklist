import { type Page, type Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorAlert: Locator;
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[id="email"]');
    this.passwordInput = page.locator('input[id="password"]');
    this.signInButton = page.locator('button[type="submit"]');
    this.errorAlert = page.locator('[role="alert"]');
    this.signUpLink = page.getByRole("link", { name: /sign up|zaregistrova/i });
    this.forgotPasswordLink = page.getByRole("link", {
      name: /forgot|zabudnut/i,
    });
  }

  async goto(locale = "sk") {
    await this.page.goto(`/${locale}/login`);
    await expect(this.emailInput).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async expectError() {
    await expect(this.errorAlert).toBeVisible({ timeout: 10000 });
  }

  async expectRedirectToDashboard() {
    await this.page.waitForURL(/\/(sk|en)\/dashboard/, { timeout: 15000 });
  }
}
