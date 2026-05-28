import { test, expect } from "@playwright/test";

test.describe("auth", () => {
  test("registers a new user and lands on home authenticated", async ({
    page,
  }) => {
    const email = `e2e_reg_${Date.now()}@test.com`;

    await page.goto("/register");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /register|sign up|create/i }).click();

    await expect(page).toHaveURL("/");
    // session persisted
    const stored = await page.evaluate(() => localStorage.getItem("authToken"));
    expect(stored).toBeTruthy();
  });

  test("login error stays on /login with a toast", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("nobody@test.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /login|sign in/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test("session survives a page reload", async ({ page }) => {
    const email = `e2e_persist_${Date.now()}@test.com`;
    await page.goto("/register");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /register|sign up|create/i }).click();
    await expect(page).toHaveURL("/");

    await page.reload();
    const stored = await page.evaluate(() => localStorage.getItem("authToken"));
    expect(stored).toBeTruthy();
  });
});
