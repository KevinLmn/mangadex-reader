import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  // Auth hook for all routes
  fastify.addHook("onRequest", async (request) => {
    await request.jwtVerify();
  });

  // Get reading progress for a manga
  fastify.get(
    "/:mangaId",
    {
      schema: {
        params: Type.Object({
          mangaId: Type.String(),
        }),
        response: {
          200: Type.Union([
            Type.Object({
              mangaId: Type.String(),
              chapterId: Type.String(),
              page: Type.Number(),
              totalPages: Type.Union([Type.Number(), Type.Null()]),
              updatedAt: Type.String(),
            }),
            Type.Null(),
          ]),
        },
        tags: ["Progress"],
        summary: "Get reading progress for a manga",
      },
    },
    async (request) => {
      const { userId } = request.user as { userId: string };
      const { mangaId } = request.params;

      const progress = await fastify.prisma.readingProgress.findUnique({
        where: {
          userId_mangaId: { userId, mangaId },
        },
      });

      if (!progress) return null;

      return {
        mangaId: progress.mangaId,
        chapterId: progress.chapterId,
        page: progress.page,
        totalPages: progress.totalPages,
        updatedAt: progress.updatedAt.toISOString(),
      };
    }
  );

  // Save/update reading progress
  fastify.post(
    "/",
    {
      schema: {
        body: Type.Object({
          mangaId: Type.String(),
          chapterId: Type.String(),
          page: Type.Number({ minimum: 1 }),
          totalPages: Type.Optional(Type.Number({ minimum: 1 })),
        }),
        response: {
          200: Type.Object({
            mangaId: Type.String(),
            chapterId: Type.String(),
            page: Type.Number(),
            totalPages: Type.Union([Type.Number(), Type.Null()]),
            updatedAt: Type.String(),
          }),
        },
        tags: ["Progress"],
        summary: "Save reading progress",
      },
    },
    async (request) => {
      const { userId } = request.user as { userId: string };
      const { mangaId, chapterId, page, totalPages } = request.body;

      const progress = await fastify.prisma.readingProgress.upsert({
        where: {
          userId_mangaId: { userId, mangaId },
        },
        update: {
          chapterId,
          page,
          totalPages,
        },
        create: {
          userId,
          mangaId,
          chapterId,
          page,
          totalPages,
        },
      });

      return {
        mangaId: progress.mangaId,
        chapterId: progress.chapterId,
        page: progress.page,
        totalPages: progress.totalPages,
        updatedAt: progress.updatedAt.toISOString(),
      };
    }
  );

  // Get all reading progress (for "continue reading" section)
  fastify.get(
    "/",
    {
      schema: {
        querystring: Type.Object({
          limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 10 })),
        }),
        response: {
          200: Type.Array(
            Type.Object({
              mangaId: Type.String(),
              chapterId: Type.String(),
              page: Type.Number(),
              totalPages: Type.Union([Type.Number(), Type.Null()]),
              updatedAt: Type.String(),
            })
          ),
        },
        tags: ["Progress"],
        summary: "Get all reading progress",
      },
    },
    async (request) => {
      const { userId } = request.user as { userId: string };
      const { limit = 10 } = request.query;

      const progressList = await fastify.prisma.readingProgress.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: limit,
      });

      return progressList.map((p) => ({
        mangaId: p.mangaId,
        chapterId: p.chapterId,
        page: p.page,
        totalPages: p.totalPages,
        updatedAt: p.updatedAt.toISOString(),
      }));
    }
  );

  // Delete reading progress
  fastify.delete(
    "/:mangaId",
    {
      schema: {
        params: Type.Object({
          mangaId: Type.String(),
        }),
        response: {
          200: Type.Object({
            success: Type.Boolean(),
          }),
        },
        tags: ["Progress"],
        summary: "Delete reading progress for a manga",
      },
    },
    async (request, reply) => {
      const { userId } = request.user as { userId: string };
      const { mangaId } = request.params;

      await fastify.prisma.readingProgress.deleteMany({
        where: { userId, mangaId },
      });

      return { success: true };
    }
  );
};

export default plugin;
