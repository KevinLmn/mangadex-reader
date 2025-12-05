// plugins/redis.ts
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { Redis } from "ioredis";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
  interface FastifyRequest {
    redis: Redis;
  }
}

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  // Get Redis config from environment variables
  const host = process.env.REDIS_HOST || "localhost";
  const port = Number(process.env.REDIS_PORT) || 6379;
  const password = process.env.REDIS_PASSWORD;

  // Create a single app-wide Redis client
  const redis = new Redis({
    host,
    port,
    password,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  // Error handling
  redis.on("error", (err: Error) => {
    if (err.message.includes("NOAUTH")) {
      fastify.log.error(
        "Redis authentication failed. Please check your password configuration."
      );
    } else {
      fastify.log.error({ err }, "Redis connection error");
    }
  });

  // Connection success logging
  redis.on("connect", () => {
    fastify.log.info("Successfully connected to Redis");
  });

  // Expose on fastify instance
  fastify.decorate("redis", redis);

  // Make redis available on each request
  fastify.addHook("onRequest", async (req) => {
    req.redis = redis;
  });

  // Graceful shutdown
  fastify.addHook("onClose", async () => {
    await redis.quit();
  });
};

export default fp(redisPlugin, {
  name: "redis",
  fastify: "5.x",
});
