import { type Page, type Locator, expect } from "@playwright/test";

export class ReportNewPage {
  readonly page: Page;
  readonly guestNameInput: Locator;
  readonly guestEmailInput: Locator;
  readonly guestPhoneInput: Locator;
  readonly incidentTypeSelect: Locator;
  readonly descriptionTextarea: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly duplicateModal: Locator;
  readonly proceedAnywayButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.guestNameInput = page.locator('input[id="guest_name"]');
    this.guestEmailInput = page.locator('input[id="guest_email"]');
    this.guestPhoneInput = page.locator('input[id="guest_phone"]');
    this.incidentTypeSelect = page.locator('button[id="incident_type"]');
    this.descriptionTextarea = page.locator('textarea[id="description"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator(".text-red-400");
    this.duplicateModal = page.locator('[data-slot="dialog-content"]');
    this.proceedAnywayButton = page.getByRole("button", {
      name: /submit anyway|odoslať napriek/i,
    });
  }

  async goto(locale = "sk") {
    await this.page.goto(`/${locale}/report/new`);
    // Wait for page to load - might redirect to login if not authenticated
    await this.page.waitForTimeout(2000);
  }

  async fillReport(data: {
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
    incidentType: string;
    description: string;
  }) {
    await this.guestNameInput.fill(data.guestName);
    if (data.guestEmail) {
      await this.guestEmailInput.fill(data.guestEmail);
    }
    if (data.guestPhone) {
      await this.guestPhoneInput.fill(data.guestPhone);
    }

    // Select incident type
    await this.incidentTypeSelect.click();
    await this.page
      .getByRole("option", { name: new RegExp(data.incidentType, "i") })
      .click();

    await this.descriptionTextarea.fill(data.description);
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectDuplicateModal() {
    await expect(this.duplicateModal).toBeVisible({ timeout: 10000 });
  }

  async expectError() {
    await expect(this.errorMessage).toBeVisible({ timeout: 10000 });
  }

  async expectRedirectToGuest() {
    await this.page.waitForURL(/\/(sk|en)\/guest\//, { timeout: 15000 });
  }
}
