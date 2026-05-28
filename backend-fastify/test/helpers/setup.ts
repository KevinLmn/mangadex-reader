import { vi } from "vitest";

// Test env defaults — overridden by real env if set (e.g. DATABASE_URL in CI)
process.env.NODE_ENV = "test";
process.env.DATABASE_URL ||=
  "postgresql://kevin:password@localhost:5435/manga_test";
process.env.PORT ||= "0";
process.env.MANGADEX_USERNAME ||= "test_user";
process.env.MANGADEX_PASSWORD ||= "test_pwd";
process.env.MANGADEX_CLIENT_ID ||= "test_client";
process.env.MANGADEX_CLIENT_SECRET ||= "test_secret";
process.env.MANGADEX_BASE_URL ||= "https://api.mangadex.org";
process.env.MANGADEX_REFRESH_TOKEN_URL ||=
  "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token";
process.env.FRONT_END_URL ||= "http://localhost:3011";
process.env.REDIS_HOST ||= "localhost";
process.env.REDIS_PORT ||= "6379";
process.env.REDIS_PASSWORD ||= "";
process.env.COOKIE_SECRET ||=
  "test-cookie-secret-must-be-long-enough-32chars";
process.env.COOKIE_NAME ||= "session";
process.env.JWT_SECRET ||= "test-jwt-secret-must-be-long-enough-32chars";
process.env.RATE_LIMIT_MAX ||= "10000";
process.env.LOG_LEVEL ||= "silent";
process.env.TOKEN_ENCRYPTION_KEY ||=
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

// Replace ioredis with the in-memory mock for every test run.
vi.mock("ioredis", async () => {
  const mod = await import("ioredis-mock");
  const Redis = (mod as any).default ?? mod;
  return { default: Redis, Redis };
});
