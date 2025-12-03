// plugins/prisma.ts
import { PrismaClient } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

export type PrismaPluginOptions = {
  /**
   * If true, each request runs in its own interactive transaction:
   * - request.prisma is a transactional client tied to the request
   * - committed/rolled back automatically
   */
  transactionPerRequest?: boolean;

  /**
   * Optional function to customize PrismaClient creation
   * (e.g., logging, datasources, middlewares).
   */
  clientFactory?: () => PrismaClient;
};

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
  interface FastifyRequest {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync<PrismaPluginOptions> = async (
  fastify,
  opts
) => {
  // Create a single app-wide PrismaClient
  const prisma = opts.clientFactory
    ? opts.clientFactory()
    : new PrismaClient({
        // Example logging; tune for prod
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "info", "warn", "error"]
            : ["warn", "error"],
      });

  // Connect once on startup (optional; Prisma lazy-connects otherwise)
  await prisma.$connect();

  // Expose on fastify instance
  fastify.decorate("prisma", prisma);

  // Option A: simple (non-transactional) per-request reference
  if (!opts.transactionPerRequest) {
    fastify.addHook("onRequest", async (req) => {
      req.prisma = prisma;
    });
  }

  // Option B: transparent transaction-per-request
  if (opts.transactionPerRequest) {
    fastify.addHook("onRequest", async (req) => {
      // create a placeholder; will be replaced inside the transaction
      req.prisma = prisma;
    });

    fastify.addHook("preHandler", async (req, reply) => {
      // Start the interactive transaction and replace req.prisma
      // We store the promise on the request to await in onSend/onError.
      // Simpler: wrap the handler, but this hook keeps your routes unchanged.
      let resolveTx: ((v?: unknown) => void) | null = null;
      let rejectTx: ((e?: unknown) => void) | null = null;
      const txDone = new Promise((res, rej) => {
        resolveTx = res;
        rejectTx = rej;
      });
      // @ts-ignore attach symbolically
      (req as any)._txDone = txDone;
      (req as any)._resolveTx = resolveTx;
      (req as any)._rejectTx = rejectTx;

      // Start interactive transaction
      // Note: $transaction(cb) resolves when cb resolves. We keep its promise to settle later.
      (req as any)._txPromise = prisma.$transaction(async (tx: any) => {
        req.prisma = tx;
        // Wait until we explicitly resolve/reject after route handler runs
        await txDone;
      });
    });

    // If route handler succeeds, commit
    fastify.addHook("onSend", async (req, reply) => {
      const resolveTx = (req as any)._resolveTx as
        | ((v?: unknown) => void)
        | undefined;
      const txPromise = (req as any)._txPromise as Promise<unknown> | undefined;
      if (resolveTx && txPromise) {
        resolveTx(); // commit
        await txPromise; // ensure commit finished before sending response
      }
    });

    // If route handler throws or reply fails, roll back
    fastify.addHook("onError", async (req, reply, err) => {
      const rejectTx = (req as any)._rejectTx as
        | ((e?: unknown) => void)
        | undefined;
      const txPromise = (req as any)._txPromise as Promise<unknown> | undefined;
      if (rejectTx && txPromise) {
        rejectTx(err); // rollback
        try {
          await txPromise;
        } catch {
          /* ignore */
        }
      }
    });
  }

  // Graceful shutdown
  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
};

export default fp(prismaPlugin, {
  name: "prisma",
  fastify: "4.x",
});
