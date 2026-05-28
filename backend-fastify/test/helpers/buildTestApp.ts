import Fastify, { FastifyInstance } from "fastify";
import sensible from "@fastify/sensible";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";

import prismaPlugin from "../../src/plugins/core/prisma.ts";
import redisPlugin from "../../src/plugins/core/redis.ts";
import passwordManagerPlugin from "../../src/plugins/core/password-manager.ts";
import authServicePlugin from "../../src/plugins/core/auth-service.ts";

import authRoutes from "../../src/routes/api/auth/index.ts";
import favoritesRoutes from "../../src/routes/api/favorites/index.ts";
import progressRoutes from "../../src/routes/api/progress/index.ts";
import searchRoutes from "../../src/routes/api/search/index.ts";
import refreshTokenRoutes from "../../src/routes/api/refresh-token/index.ts";
import mangaRoutes from "../../src/routes/api/manga/index.ts";
import loginRoutes from "../../src/routes/api/login/index.ts";

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    ajv: {
      customOptions: {
        coerceTypes: "array",
        removeAdditional: "all",
      },
    },
  });

  // Mock the @fastify/env decorator with a static config (env plugin imports
  // dotenv which we don't want in tests).
  app.decorate("config", {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: 0,
    MANGADEX_USERNAME: process.env.MANGADEX_USERNAME!,
    MANGADEX_PASSWORD: process.env.MANGADEX_PASSWORD!,
    MANGADEX_CLIENT_ID: process.env.MANGADEX_CLIENT_ID!,
    MANGADEX_CLIENT_SECRET: process.env.MANGADEX_CLIENT_SECRET!,
    MANGADEX_BASE_URL: process.env.MANGADEX_BASE_URL!,
    MANGADEX_REFRESH_TOKEN_URL: process.env.MANGADEX_REFRESH_TOKEN_URL!,
    FRONT_END_URL: process.env.FRONT_END_URL!,
    REDIS_HOST: process.env.REDIS_HOST!,
    REDIS_PORT: Number(process.env.REDIS_PORT),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD ?? "",
    COOKIE_SECRET: process.env.COOKIE_SECRET!,
    COOKIE_NAME: process.env.COOKIE_NAME!,
    COOKIE_SECURED: false,
    RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX),
    JWT_SECRET: process.env.JWT_SECRET!,
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY!,
  } as any);

  await app.register(sensible);
  await app.register(cookie);
  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: { expiresIn: "1h" },
  });

  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(rateLimit, {
    max: 100000,
    timeWindow: "1 minute",
    redis: app.redis,
    keyGenerator: (req) => req.ip,
  });
  await app.register(passwordManagerPlugin);
  await app.register(authServicePlugin);

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(favoritesRoutes, { prefix: "/api/favorites" });
  await app.register(progressRoutes, { prefix: "/api/progress" });
  await app.register(searchRoutes, { prefix: "/api/search" });
  await app.register(refreshTokenRoutes, { prefix: "/api/refresh-token" });
  await app.register(mangaRoutes, { prefix: "/api/manga" });
  await app.register(loginRoutes, { prefix: "/api/login" });

  app.setErrorHandler((err, _req, reply) => {
    reply.code(err.statusCode ?? 500);
    if (err.statusCode && err.statusCode < 500) {
      return { message: err.message, code: err.code || "ERROR" };
    }
    return { message: "Internal Server Error", code: "INTERNAL_SERVER_ERROR" };
  });

  await app.ready();
  return app;
}

export async function cleanDatabase(app: FastifyInstance): Promise<void> {
  await app.prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "ReadingProgress", "Favorite", "User", "Chapter", "Manga", "Token" RESTART IDENTITY CASCADE`
  );
}

export async function flushRedis(app: FastifyInstance): Promise<void> {
  await app.redis.flushall();
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
}

export async function createUser(
  app: FastifyInstance,
  email = `user_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,
  password = "password123"
): Promise<TestUser> {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email, password },
  });
  if (res.statusCode !== 201) {
    throw new Error(`createUser failed: ${res.statusCode} ${res.body}`);
  }
  const body = res.json() as { user: { id: string; email: string }; token: string };
  return {
    id: body.user.id,
    email: body.user.email,
    password,
    token: body.token,
  };
}

export function authHeader(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}
