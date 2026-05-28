import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp, cleanDatabase } from "./helpers/buildTestApp.js";

describe("auth routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  describe("POST /api/auth/register", () => {
    it("creates a user and returns a JWT", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "alice@test.com", password: "supersecret" },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.user.email).toBe("alice@test.com");
      expect(body.user.id).toBeDefined();
      expect(typeof body.token).toBe("string");
      expect(body.token.split(".")).toHaveLength(3);
    });

    it("rejects duplicate email with 400", async () => {
      await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "dupe@test.com", password: "password123" },
      });
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "dupe@test.com", password: "otherpassword" },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe("Email already registered");
    });

    it("rejects invalid email format", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "not-an-email", password: "password123" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("rejects password shorter than 6 chars", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "short@test.com", password: "12345" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("hashes the password (does not store in plaintext)", async () => {
      await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "hash@test.com", password: "plaintextpwd" },
      });
      const user = await app.prisma.user.findUnique({
        where: { email: "hash@test.com" },
      });
      expect(user).toBeTruthy();
      expect(user!.password).not.toBe("plaintextpwd");
      expect(user!.password.startsWith("$2")).toBe(true);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "login@test.com", password: "correctpassword" },
      });
    });

    it("logs in with valid credentials and returns JWT", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "login@test.com", password: "correctpassword" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.user.email).toBe("login@test.com");
      expect(typeof body.token).toBe("string");
    });

    it("returns 401 with the same generic message on unknown email", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "ghost@test.com", password: "whatever" },
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error).toBe("Invalid email or password");
    });

    it("returns 401 with the same generic message on wrong password", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email: "login@test.com", password: "wrongpassword" },
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error).toBe("Invalid email or password");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 without JWT", async () => {
      const res = await app.inject({ method: "GET", url: "/api/auth/me" });
      expect(res.statusCode).toBe(401);
    });

    it("returns 401 with malformed JWT", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/auth/me",
        headers: { authorization: "Bearer not.a.jwt" },
      });
      expect(res.statusCode).toBe(401);
    });

    it("returns the current user with a valid JWT", async () => {
      const reg = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "me@test.com", password: "password123" },
      });
      const { token, user } = reg.json();

      const res = await app.inject({
        method: "GET",
        url: "/api/auth/me",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ id: user.id, email: user.email });
    });

    it("returns 401 if the JWT user no longer exists", async () => {
      const reg = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email: "ghost@test.com", password: "password123" },
      });
      const { token, user } = reg.json();
      await app.prisma.user.delete({ where: { id: user.id } });

      const res = await app.inject({
        method: "GET",
        url: "/api/auth/me",
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
