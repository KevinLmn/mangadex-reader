import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  authHeader,
  buildTestApp,
  cleanDatabase,
  createUser,
  type TestUser,
} from "./helpers/buildTestApp.js";

describe("progress routes", () => {
  let app: FastifyInstance;
  let userA: TestUser;
  let userB: TestUser;

  const MANGA = "aaaa-bbbb-cccc-dddd";
  const CHAPTER = "ch-1";

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    userA = await createUser(app, "prog_a@test.com");
    userB = await createUser(app, "prog_b@test.com");
  });

  describe("auth gate", () => {
    it.each([
      ["GET", "/api/progress"],
      ["POST", "/api/progress"],
      ["GET", "/api/progress/some-id"],
      ["DELETE", "/api/progress/some-id"],
    ])("rejects %s %s without JWT (401)", async (method, url) => {
      const res = await app.inject({
        method: method as any,
        url,
        payload:
          method === "POST"
            ? { mangaId: MANGA, chapterId: CHAPTER, page: 1 }
            : undefined,
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /api/progress (upsert)", () => {
    it("creates a progress entry on first save", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/progress",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA, chapterId: CHAPTER, page: 5, totalPages: 20 },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.mangaId).toBe(MANGA);
      expect(body.chapterId).toBe(CHAPTER);
      expect(body.page).toBe(5);
      expect(body.totalPages).toBe(20);
    });

    it("updates the existing entry on second save (no duplicate row)", async () => {
      await app.inject({
        method: "POST",
        url: "/api/progress",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA, chapterId: CHAPTER, page: 1 },
      });
      await app.inject({
        method: "POST",
        url: "/api/progress",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA, chapterId: CHAPTER, page: 7 },
      });

      const rows = await app.prisma.readingProgress.findMany({
        where: { userId: userA.id, mangaId: MANGA },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].page).toBe(7);
    });

    it("rejects page < 1 (validation)", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/progress",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA, chapterId: CHAPTER, page: 0 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/progress/:mangaId", () => {
    it("returns null when no progress exists (not 404)", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/progress/${MANGA}`,
        headers: authHeader(userA.token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toBeNull();
    });

    it("returns saved progress", async () => {
      await app.inject({
        method: "POST",
        url: "/api/progress",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA, chapterId: CHAPTER, page: 3, totalPages: 10 },
      });
      const res = await app.inject({
        method: "GET",
        url: `/api/progress/${MANGA}`,
        headers: authHeader(userA.token),
      });
      const body = res.json();
      expect(body.page).toBe(3);
      expect(body.totalPages).toBe(10);
    });

    it("isolates per user (B sees null for A's manga)", async () => {
      await app.inject({
        method: "POST",
        url: "/api/progress",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA, chapterId: CHAPTER, page: 3 },
      });
      const res = await app.inject({
        method: "GET",
        url: `/api/progress/${MANGA}`,
        headers: authHeader(userB.token),
      });
      expect(res.json()).toBeNull();
    });
  });

  describe("GET /api/progress (list)", () => {
    it("returns entries ordered by updatedAt desc", async () => {
      await app.inject({
        method: "POST",
        url: "/api/progress",
        headers: authHeader(userA.token),
        payload: { mangaId: "manga-old", chapterId: "ch-1", page: 1 },
      });
      await new Promise((r) => setTimeout(r, 15));
      await app.inject({
        method: "POST",
        url: "/api/progress",
        headers: authHeader(userA.token),
        payload: { mangaId: "manga-new", chapterId: "ch-1", page: 1 },
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/progress",
        headers: authHeader(userA.token),
      });
      const list = res.json();
      expect(list[0].mangaId).toBe("manga-new");
      expect(list[1].mangaId).toBe("manga-old");
    });

    it("respects the limit query param", async () => {
      for (let i = 0; i < 5; i++) {
        await app.inject({
          method: "POST",
          url: "/api/progress",
          headers: authHeader(userA.token),
          payload: { mangaId: `m-${i}`, chapterId: "ch", page: 1 },
        });
      }
      const res = await app.inject({
        method: "GET",
        url: "/api/progress?limit=3",
        headers: authHeader(userA.token),
      });
      expect(res.json()).toHaveLength(3);
    });

    it("only returns the calling user's progress", async () => {
      await app.inject({
        method: "POST",
        url: "/api/progress",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA, chapterId: CHAPTER, page: 1 },
      });
      const res = await app.inject({
        method: "GET",
        url: "/api/progress",
        headers: authHeader(userB.token),
      });
      expect(res.json()).toEqual([]);
    });
  });

  describe("DELETE /api/progress/:mangaId", () => {
    it("deletes the user's progress for a manga", async () => {
      await app.inject({
        method: "POST",
        url: "/api/progress",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA, chapterId: CHAPTER, page: 3 },
      });
      const res = await app.inject({
        method: "DELETE",
        url: `/api/progress/${MANGA}`,
        headers: authHeader(userA.token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ success: true });
    });

    it("is idempotent on missing progress (still 200)", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/progress/${MANGA}`,
        headers: authHeader(userA.token),
      });
      expect(res.statusCode).toBe(200);
    });

    it("does not delete another user's progress (IDOR)", async () => {
      await app.inject({
        method: "POST",
        url: "/api/progress",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA, chapterId: CHAPTER, page: 3 },
      });
      await app.inject({
        method: "DELETE",
        url: `/api/progress/${MANGA}`,
        headers: authHeader(userB.token),
      });
      const stillThere = await app.prisma.readingProgress.findFirst({
        where: { userId: userA.id, mangaId: MANGA },
      });
      expect(stillThere).toBeTruthy();
    });
  });
});
