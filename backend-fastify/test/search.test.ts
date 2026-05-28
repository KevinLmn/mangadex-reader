import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import axios from "axios";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "./helpers/buildTestApp.js";

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

describe("search route", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    mockedGet.mockReset();
  });

  it("returns 400 when q is missing", async () => {
    const res = await app.inject({ method: "GET", url: "/api/search" });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when q is empty (minLength)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/search?q=" });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when limit > 100", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/search?q=naruto&limit=150",
    });
    expect(res.statusCode).toBe(400);
  });

  it("forwards safe filters and includes to MangaDex", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { result: "ok", data: [], limit: 20, offset: 0, total: 0 },
    });

    await app.inject({ method: "GET", url: "/api/search?q=naruto" });

    expect(mockedGet).toHaveBeenCalledOnce();
    const [url, opts] = mockedGet.mock.calls[0];
    expect(url).toContain("/manga");
    expect(opts.params.title).toBe("naruto");
    expect(opts.params.contentRating).toEqual(["safe"]);
    expect(opts.params.includes).toEqual(["author", "cover_art"]);
    expect(opts.params["order[relevance]"]).toBe("desc");
  });

  it("returns 200 with mocked MangaDex payload", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        result: "ok",
        data: [{ id: "abc", type: "manga" }],
        limit: 20,
        offset: 0,
        total: 1,
      },
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/search?q=onepiece",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.result).toBe("ok");
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("returns 500 when MangaDex fails", async () => {
    mockedGet.mockRejectedValueOnce(new Error("upstream down"));
    const res = await app.inject({
      method: "GET",
      url: "/api/search?q=bleach",
    });
    expect(res.statusCode).toBe(500);
    expect(res.json().error).toBe("Failed to search manga");
  });
});
