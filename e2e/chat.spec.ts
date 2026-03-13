import { test, expect } from "@playwright/test";
import { ChatPage } from "./pages/chat.page";
import { loginViaUI } from "./helpers/auth";

const LOCALE = "en";

test.describe("Community Chat", () => {
  test.beforeEach(async ({ page }) => {
    const testEmail = process.env.E2E_TEST_EMAIL;
    const testPassword = process.env.E2E_TEST_PASSWORD;

    test.skip(
      !testEmail || !testPassword,
      "E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars required"
    );

    await loginViaUI(page, testEmail!, testPassword!, LOCALE);
  });

  test("should display chat page", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.goto(LOCALE);

    // Chat page should have the message input
    await expect(chatPage.messageInput).toBeVisible();
    await expect(chatPage.sendButton).toBeVisible();
  });

  test("should not send empty message", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.goto(LOCALE);

    // Send button should be disabled for empty message
    await expect(chatPage.sendButton).toBeDisabled();
  });

  test("should send a message", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.goto(LOCALE);

    const testMessage = `E2E test message ${Date.now()}`;
    await chatPage.sendMessage(testMessage);

    // Message should appear in the list
    await chatPage.expectMessageVisible(testMessage);
  });

  test("should show character counter", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.goto(LOCALE);

    await chatPage.messageInput.fill("Hello World");
    // Check for character counter (11/500)
    await expect(page.getByText("11/500")).toBeVisible();
  });

  test("should display like button on messages", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.goto(LOCALE);

    // First send a message to ensure there's something to like
    const testMessage = `Like test ${Date.now()}`;
    await chatPage.sendMessage(testMessage);

    // The heart/like button should be visible
    const heartIcon = page.locator("svg.size-3\\.5").first();
    await expect(heartIcon).toBeVisible({ timeout: 5000 });
  });

  test("should show reply and edit buttons on own messages", async ({
    page,
  }) => {
    const chatPage = new ChatPage(page);
    await chatPage.goto(LOCALE);

    const testMessage = `Reply/Edit test ${Date.now()}`;
    await chatPage.sendMessage(testMessage);

    // Check for reply button
    const replyButton = page.getByText(/reply/i).first();
    await expect(replyButton).toBeVisible({ timeout: 5000 });

    // Check for edit button (own message)
    const editButton = page.getByText(/edit message|upraviť/i).first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
  });
});
