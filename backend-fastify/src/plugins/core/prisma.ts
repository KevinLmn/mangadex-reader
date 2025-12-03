// plugins/prisma.ts
import { PrismaClient } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
  interface FastifyRequest {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify) => {
  // Create a single app-wide PrismaClient
  const prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],
  });

  // Connect once on startup
  await prisma.$connect();

  // Expose on fastify instance
  fastify.decorate("prisma", prisma);

  // Make prisma available on each request
  fastify.addHook("onRequest", async (req) => {
    req.prisma = prisma;
  });

  // Graceful shutdown
  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
};

export default fp(prismaPlugin, {
  name: "prisma",
  fastify: "5.x",
});
