import { test, expect } from "@playwright/test";

test.describe("search", () => {
  test("submitting a non-empty query navigates to /search?q=…", async ({
    page,
  }) => {
    await page.goto("/");
    const input = page.getByPlaceholder(/search manga/i);
    if ((await input.count()) === 0) {
      test.skip(true, "SearchBar not on home page");
    }
    await input.fill("naruto");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=naruto/);
  });

  test("submitting an empty/whitespace query does not navigate", async ({
    page,
  }) => {
    await page.goto("/");
    const input = page.getByPlaceholder(/search manga/i);
    if ((await input.count()) === 0) {
      test.skip(true, "SearchBar not on home page");
    }
    await input.fill("   ");
    await input.press("Enter");
    await expect(page).toHaveURL("/");
  });
});
