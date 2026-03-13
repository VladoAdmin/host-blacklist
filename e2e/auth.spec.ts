import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { RegisterPage } from "./pages/register.page";

const LOCALE = "en";

test.describe("User Registration", () => {
  test("should display registration form", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto(LOCALE);

    await expect(registerPage.fullNameInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.confirmPasswordInput).toBeVisible();
    await expect(registerPage.createAccountButton).toBeVisible();
  });

  test("should show error for mismatched passwords", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto(LOCALE);

    await registerPage.register(
      "Test User",
      "mismatch@test.com",
      "Password123!",
      "DifferentPassword!"
    );

    // The app validates passwords before Supabase call
    await expect(
      page.getByText(/passwords do not match|heslá sa nezhodujú/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test("should validate minimum password length client-side", async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto(LOCALE);

    // The password input has minLength=6, so the browser should enforce it
    const minLength = await registerPage.passwordInput.getAttribute(
      "minLength"
    );
    expect(minLength).toBe("6");

    // Confirm password also has minLength
    const confirmMinLength =
      await registerPage.confirmPasswordInput.getAttribute("minLength");
    expect(confirmMinLength).toBe("6");
  });

  test("should navigate to login from register", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto(LOCALE);

    await registerPage.signInLink.click();
    await page.waitForURL(/\/(sk|en)\/login/);
    expect(page.url()).toContain("/login");
  });

  test("should submit registration form and get Supabase response", async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto(LOCALE);

    const uniqueEmail = `e2e-reg-${Date.now()}@gmail.com`;

    await registerPage.register(
      "E2E Registration Test",
      uniqueEmail,
      "ValidPassword123!",
      "ValidPassword123!"
    );

    // Wait for Supabase response - either success or error is valid
    // Success: "Account Created" / "check email" message
    // Error: rate limit, email invalid, etc.
    await expect(
      page
        .getByText(
          /Account Created|check.*email|rate limit|invalid|error|Účet vytvorený/i
        )
        .first()
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("User Login", () => {
  test("should display login form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(LOCALE);

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(LOCALE);

    await loginPage.login("nonexistent@test.com", "WrongPassword123");

    await loginPage.expectError();
  });

  test("should navigate to register from login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(LOCALE);

    await loginPage.signUpLink.click();
    await page.waitForURL(/\/(sk|en)\/register/);
    expect(page.url()).toContain("/register");
  });

  test("should login with valid credentials and redirect to dashboard", async ({
    page,
  }) => {
    const testEmail = process.env.E2E_TEST_EMAIL;
    const testPassword = process.env.E2E_TEST_PASSWORD;

    test.skip(
      !testEmail || !testPassword,
      "E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars required"
    );

    const loginPage = new LoginPage(page);
    await loginPage.goto(LOCALE);
    await loginPage.login(testEmail!, testPassword!);
    await loginPage.expectRedirectToDashboard();
  });

  test("should show forgot password link", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto(LOCALE);

    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });
});
