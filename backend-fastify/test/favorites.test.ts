import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  authHeader,
  buildTestApp,
  cleanDatabase,
  createUser,
  type TestUser,
} from "./helpers/buildTestApp.js";

describe("favorites routes", () => {
  let app: FastifyInstance;
  let userA: TestUser;
  let userB: TestUser;

  const MANGA_A = "11111111-1111-1111-1111-111111111111";
  const MANGA_B = "22222222-2222-2222-2222-222222222222";

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    userA = await createUser(app, "fav_a@test.com");
    userB = await createUser(app, "fav_b@test.com");
  });

  describe("auth gate", () => {
    it.each([
      ["GET", "/api/favorites"],
      ["POST", "/api/favorites"],
      ["GET", "/api/favorites/some-id"],
      ["DELETE", "/api/favorites/some-id"],
    ])("rejects %s %s without JWT (401)", async (method, url) => {
      const res = await app.inject({
        method: method as any,
        url,
        payload: method === "POST" ? { mangaId: MANGA_A } : undefined,
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /api/favorites", () => {
    it("adds a favorite for the authenticated user", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/favorites",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA_A },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.mangaId).toBe(MANGA_A);
      expect(body.id).toBeDefined();
      expect(body.addedAt).toBeDefined();
    });

    it("returns 409 when the same manga is added twice", async () => {
      await app.inject({
        method: "POST",
        url: "/api/favorites",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA_A },
      });
      const res = await app.inject({
        method: "POST",
        url: "/api/favorites",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA_A },
      });
      expect(res.statusCode).toBe(409);
      expect(res.json().error).toBe("Already in favorites");
    });

    it("allows two different users to favorite the same manga", async () => {
      const r1 = await app.inject({
        method: "POST",
        url: "/api/favorites",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA_A },
      });
      const r2 = await app.inject({
        method: "POST",
        url: "/api/favorites",
        headers: authHeader(userB.token),
        payload: { mangaId: MANGA_A },
      });
      expect(r1.statusCode).toBe(201);
      expect(r2.statusCode).toBe(201);
    });
  });

  describe("GET /api/favorites", () => {
    it("only returns favorites for the requesting user (IDOR isolation)", async () => {
      await app.inject({
        method: "POST",
        url: "/api/favorites",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA_A },
      });
      await app.inject({
        method: "POST",
        url: "/api/favorites",
        headers: authHeader(userB.token),
        payload: { mangaId: MANGA_B },
      });

      const resA = await app.inject({
        method: "GET",
        url: "/api/favorites",
        headers: authHeader(userA.token),
      });
      const resB = await app.inject({
        method: "GET",
        url: "/api/favorites",
        headers: authHeader(userB.token),
      });

      expect(resA.statusCode).toBe(200);
      expect(resB.statusCode).toBe(200);
      const listA = resA.json();
      const listB = resB.json();
      expect(listA).toHaveLength(1);
      expect(listB).toHaveLength(1);
      expect(listA[0].mangaId).toBe(MANGA_A);
      expect(listB[0].mangaId).toBe(MANGA_B);
    });

    it("returns favorites ordered by addedAt desc", async () => {
      await app.inject({
        method: "POST",
        url: "/api/favorites",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA_A },
      });
      await new Promise((r) => setTimeout(r, 10));
      await app.inject({
        method: "POST",
        url: "/api/favorites",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA_B },
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/favorites",
        headers: authHeader(userA.token),
      });
      const list = res.json();
      expect(list[0].mangaId).toBe(MANGA_B);
      expect(list[1].mangaId).toBe(MANGA_A);
    });
  });

  describe("GET /api/favorites/:mangaId", () => {
    it("returns isFavorite true when present", async () => {
      await app.inject({
        method: "POST",
        url: "/api/favorites",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA_A },
      });
      const res = await app.inject({
        method: "GET",
        url: `/api/favorites/${MANGA_A}`,
        headers: authHeader(userA.token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ isFavorite: true });
    });

    it("returns isFavorite false when missing", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/favorites/${MANGA_A}`,
        headers: authHeader(userA.token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ isFavorite: false });
    });

    it("isolates per user (B doesn't see A's favorites)", async () => {
      await app.inject({
        method: "POST",
        url: "/api/favorites",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA_A },
      });
      const res = await app.inject({
        method: "GET",
        url: `/api/favorites/${MANGA_A}`,
        headers: authHeader(userB.token),
      });
      expect(res.json()).toEqual({ isFavorite: false });
    });
  });

  describe("DELETE /api/favorites/:mangaId", () => {
    it("deletes a favorite the user owns", async () => {
      await app.inject({
        method: "POST",
        url: "/api/favorites",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA_A },
      });
      const res = await app.inject({
        method: "DELETE",
        url: `/api/favorites/${MANGA_A}`,
        headers: authHeader(userA.token),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ success: true });

      const list = await app.prisma.favorite.findMany({
        where: { userId: userA.id },
      });
      expect(list).toHaveLength(0);
    });

    it("returns 404 for a manga not in this user's favorites", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: `/api/favorites/${MANGA_A}`,
        headers: authHeader(userA.token),
      });
      expect(res.statusCode).toBe(404);
    });

    it("returns 404 when user B tries to delete user A's favorite (IDOR)", async () => {
      await app.inject({
        method: "POST",
        url: "/api/favorites",
        headers: authHeader(userA.token),
        payload: { mangaId: MANGA_A },
      });
      const res = await app.inject({
        method: "DELETE",
        url: `/api/favorites/${MANGA_A}`,
        headers: authHeader(userB.token),
      });
      expect(res.statusCode).toBe(404);

      // user A's favorite must still exist
      const stillThere = await app.prisma.favorite.findFirst({
        where: { userId: userA.id, mangaId: MANGA_A },
      });
      expect(stillThere).toBeTruthy();
    });
  });
});
