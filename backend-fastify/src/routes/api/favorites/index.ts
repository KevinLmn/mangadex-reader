import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  // Auth hook for all routes in this plugin
  fastify.addHook("onRequest", async (request) => {
    await request.jwtVerify();
  });

  // Get all favorites
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Array(
            Type.Object({
              id: Type.String(),
              mangaId: Type.String(),
              addedAt: Type.String(),
            })
          ),
        },
        tags: ["Favorites"],
        summary: "Get user favorites",
      },
    },
    async (request) => {
      const { userId } = request.user as { userId: string };

      const favorites = await fastify.prisma.favorite.findMany({
        where: { userId },
        orderBy: { addedAt: "desc" },
      });

      return favorites.map((f) => ({
        id: f.id,
        mangaId: f.mangaId,
        addedAt: f.addedAt.toISOString(),
      }));
    }
  );

  // Add favorite
  fastify.post(
    "/",
    {
      schema: {
        body: Type.Object({
          mangaId: Type.String(),
        }),
        response: {
          201: Type.Object({
            id: Type.String(),
            mangaId: Type.String(),
            addedAt: Type.String(),
          }),
          409: Type.Object({
            error: Type.String(),
          }),
        },
        tags: ["Favorites"],
        summary: "Add manga to favorites",
      },
    },
    async (request, reply) => {
      const { userId } = request.user as { userId: string };
      const { mangaId } = request.body;

      const existing = await fastify.prisma.favorite.findUnique({
        where: {
          userId_mangaId: { userId, mangaId },
        },
      });

      if (existing) {
        return reply.status(409).send({ error: "Already in favorites" });
      }

      const favorite = await fastify.prisma.favorite.create({
        data: { userId, mangaId },
      });

      return reply.status(201).send({
        id: favorite.id,
        mangaId: favorite.mangaId,
        addedAt: favorite.addedAt.toISOString(),
      });
    }
  );

  // Remove favorite
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
          404: Type.Object({
            error: Type.String(),
          }),
        },
        tags: ["Favorites"],
        summary: "Remove manga from favorites",
      },
    },
    async (request, reply) => {
      const { userId } = request.user as { userId: string };
      const { mangaId } = request.params;

      const favorite = await fastify.prisma.favorite.findUnique({
        where: {
          userId_mangaId: { userId, mangaId },
        },
      });

      if (!favorite) {
        return reply.status(404).send({ error: "Favorite not found" });
      }

      await fastify.prisma.favorite.delete({
        where: { id: favorite.id },
      });

      return { success: true };
    }
  );

  // Check if manga is favorited
  fastify.get(
    "/:mangaId",
    {
      schema: {
        params: Type.Object({
          mangaId: Type.String(),
        }),
        response: {
          200: Type.Object({
            isFavorite: Type.Boolean(),
          }),
        },
        tags: ["Favorites"],
        summary: "Check if manga is in favorites",
      },
    },
    async (request) => {
      const { userId } = request.user as { userId: string };
      const { mangaId } = request.params;

      const favorite = await fastify.prisma.favorite.findUnique({
        where: {
          userId_mangaId: { userId, mangaId },
        },
      });

      return { isFavorite: !!favorite };
    }
  );
};

export default plugin;
