import { test, expect } from "@playwright/test";
import { getProgress, registerUser } from "./helpers/api";

test.describe("reader → progression", () => {
  test("progression POST persists and is readable per user", async ({
    page,
  }) => {
    const { token } = await registerUser();
    const MANGA_ID = "11111111-1111-1111-1111-1111111111aa";
    const CHAPTER_ID = "ch-progress-1";

    // Save progress via API
    const save = await page.request.post(
      "http://localhost:3022/api/progress",
      {
        headers: { authorization: `Bearer ${token}` },
        data: {
          mangaId: MANGA_ID,
          chapterId: CHAPTER_ID,
          page: 7,
          totalPages: 24,
        },
      }
    );
    expect(save.ok()).toBeTruthy();

    const stored = await getProgress(token, MANGA_ID);
    expect(stored.page).toBe(7);
    expect(stored.chapterId).toBe(CHAPTER_ID);
    expect(stored.totalPages).toBe(24);
  });

  test("each user has its own progression (isolation)", async ({ page }) => {
    const userA = await registerUser();
    const userB = await registerUser();
    const MANGA_ID = "22222222-2222-2222-2222-2222222222bb";

    await page.request.post("http://localhost:3022/api/progress", {
      headers: { authorization: `Bearer ${userA.token}` },
      data: { mangaId: MANGA_ID, chapterId: "c-A", page: 3 },
    });

    const aSee = await getProgress(userA.token, MANGA_ID);
    const bSee = await getProgress(userB.token, MANGA_ID);
    expect(aSee.page).toBe(3);
    expect(bSee).toBeNull();
  });
});
