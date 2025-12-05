import rateLimit from "@fastify/rate-limit";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    redis: fastify.redis,
    keyGenerator: (request) => {
      return request.ip;
    },
    errorResponseBuilder: (request, context) => {
      return {
        code: 429,
        error: "Too Many Requests",
        message: `Rate limit exceeded. Please try again in ${Math.round(context.ttl / 1000)} seconds.`,
        retryAfter: context.ttl,
      };
    },
  });
};

export default fp(rateLimitPlugin, {
  name: "rate-limit",
  dependencies: ["redis"],
});
