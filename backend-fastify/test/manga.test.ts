import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import axios from "axios";
import type { FastifyInstance } from "fastify";
import {
  buildTestApp,
  cleanDatabase,
  flushRedis,
} from "./helpers/buildTestApp.js";

vi.mock("axios", async (orig) => {
  const actual = (await orig()) as typeof import("axios");
  return {
    default: {
      ...actual.default,
      get: vi.fn(),
      post: vi.fn(),
      isAxiosError: actual.default.isAxiosError,
    },
  };
});

const mockedGet = axios.get as unknown as ReturnType<typeof vi.fn>;

describe("POST /api/manga/:id", () => {
  let app: FastifyInstance;
  const MANGA_ID = "manga-xyz";

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    await flushRedis(app);
  });

  afterEach(() => {
    mockedGet.mockReset();
  });

  describe("downloaded=true", () => {
    it("returns DB chapters sorted by number desc, paginated", async () => {
      await app.prisma.manga.create({ data: { mangaDexId: MANGA_ID } });
      for (const n of [1, 5, 3, 2, 4]) {
        await app.prisma.chapter.create({
          data: {
            number: n,
            url: `u${n}`,
            mangaId: MANGA_ID,
          },
        });
      }

      const res = await app.inject({
        method: "POST",
        url: `/api/manga/${MANGA_ID}?downloaded=true`,
        payload: { limit: 3, offset: 0 },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.chaptersLength).toBe(5);
      expect(body.chapters.map((c: any) => c.number)).toEqual([5, 4, 3]);
    });

    it("hits the cache on second call (no extra DB hit)", async () => {
      await app.prisma.manga.create({ data: { mangaDexId: MANGA_ID } });
      await app.prisma.chapter.create({
        data: { number: 1, url: "u", mangaId: MANGA_ID },
      });

      const r1 = await app.inject({
        method: "POST",
        url: `/api/manga/${MANGA_ID}?downloaded=true`,
        payload: { limit: 10, offset: 0 },
      });
      expect(r1.statusCode).toBe(200);

      // delete underlying row — cache should still serve
      await app.prisma.chapter.deleteMany();

      const r2 = await app.inject({
        method: "POST",
        url: `/api/manga/${MANGA_ID}?downloaded=true`,
        payload: { limit: 10, offset: 0 },
      });
      expect(r2.statusCode).toBe(200);
      expect(r2.json().chaptersLength).toBe(1);
    });
  });

  describe("downloaded=false (default)", () => {
    it("calls MangaDex feed + manga details and caches the result", async () => {
      mockedGet
        .mockResolvedValueOnce({ data: { data: [{ id: "ch1" }] } })
        .mockResolvedValueOnce({ data: { data: { id: MANGA_ID } } });

      const res = await app.inject({
        method: "POST",
        url: `/api/manga/${MANGA_ID}`,
        payload: { limit: 10, offset: 0 },
        headers: { authorization: "Bearer fake-token" },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.manga.data.id).toBe(MANGA_ID);
      expect(body.chapters.data[0].id).toBe("ch1");
      expect(mockedGet).toHaveBeenCalledTimes(2);

      // 2nd call hits cache, no further axios calls
      mockedGet.mockClear();
      const r2 = await app.inject({
        method: "POST",
        url: `/api/manga/${MANGA_ID}`,
        payload: { limit: 10, offset: 0 },
        headers: { authorization: "Bearer fake-token" },
      });
      expect(r2.statusCode).toBe(200);
      expect(mockedGet).not.toHaveBeenCalled();
    });

    it("returns 500 when MangaDex feed errors out", async () => {
      mockedGet.mockRejectedValueOnce(new Error("upstream"));
      const res = await app.inject({
        method: "POST",
        url: `/api/manga/${MANGA_ID}`,
        payload: { limit: 10, offset: 0 },
        headers: { authorization: "Bearer fake-token" },
      });
      expect(res.statusCode).toBe(500);
    });
  });
});
