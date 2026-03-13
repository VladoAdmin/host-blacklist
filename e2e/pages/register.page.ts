import { type Page, type Locator, expect } from "@playwright/test";

export class RegisterPage {
  readonly page: Page;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly createAccountButton: Locator;
  readonly errorAlert: Locator;
  readonly successTitle: Locator;
  readonly signInLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fullNameInput = page.locator('input[id="fullName"]');
    this.emailInput = page.locator('input[id="email"]');
    this.passwordInput = page.locator('input[id="password"]');
    this.confirmPasswordInput = page.locator('input[id="confirmPassword"]');
    this.createAccountButton = page.locator('button[type="submit"]');
    this.errorAlert = page.locator('[role="alert"]');
    this.successTitle = page.locator("text=Account Created");
    this.signInLink = page.getByRole("link", { name: /sign in|prihlás/i });
  }

  async goto(locale = "sk") {
    await this.page.goto(`/${locale}/register`);
    await expect(this.fullNameInput).toBeVisible();
  }

  async register(
    fullName: string,
    email: string,
    password: string,
    confirmPassword?: string
  ) {
    await this.fullNameInput.fill(fullName);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword || password);
    await this.createAccountButton.click();
  }

  async expectSuccess() {
    // After successful registration, we should see confirmation message or redirect
    await expect(
      this.page.getByText(/Account Created|Účet vytvorený|check.*email/i)
    ).toBeVisible({ timeout: 15000 });
  }

  async expectError() {
    await expect(this.errorAlert).toBeVisible({ timeout: 10000 });
  }
}
