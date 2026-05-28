import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp, cleanDatabase } from "./helpers/buildTestApp.js";
import { decrypt, encrypt, hmac } from "../src/services/crypto.js";

describe("refresh-token route", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    vi.restoreAllMocks();
  });

  it("returns 404 if the token is not in the database", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/refresh-token",
      payload: { token: "unknown-token-123" },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe("Token not found");
  });

  it("returns the new token and persists it on success", async () => {
    await app.prisma.token.create({
      data: {
        token: encrypt("old-access-token"),
        refreshToken: encrypt("old-refresh-token"),
        tokenHash: hmac("old-access-token"),
      },
    });

    const refreshSpy = vi
      .spyOn(app.authService, "refreshToken")
      .mockResolvedValueOnce({
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
      });

    const res = await app.inject({
      method: "POST",
      url: "/api/refresh-token",
      payload: { token: "old-access-token" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ token: "new-access-token" });
    expect(refreshSpy).toHaveBeenCalledWith("old-refresh-token");

    const stored = await app.prisma.token.findFirst();
    expect(stored).toBeTruthy();
    expect(decrypt(stored!.token)).toBe("new-access-token");
    expect(decrypt(stored!.refreshToken)).toBe("new-refresh-token");
    expect(stored!.tokenHash).toBe(hmac("new-access-token"));
  });

  it("returns 500 when the auth service throws", async () => {
    await app.prisma.token.create({
      data: {
        token: encrypt("tok"),
        refreshToken: encrypt("rtok"),
        tokenHash: hmac("tok"),
      },
    });
    vi.spyOn(app.authService, "refreshToken").mockRejectedValueOnce(
      new Error("auth down")
    );

    const res = await app.inject({
      method: "POST",
      url: "/api/refresh-token",
      payload: { token: "tok" },
    });
    expect(res.statusCode).toBe(500);
    expect(res.json().error).toBe("Failed to refresh token");
  });
});
