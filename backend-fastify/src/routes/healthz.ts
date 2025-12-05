import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/healthz",
    {
      logLevel: "silent",
      schema: {
        tags: ["system"],
        summary: "Health check endpoint",
        description:
          "Returns ok if the API and database connection are healthy.",
        response: {
          200: Type.Object({
            status: Type.Literal("ok"),
          }),
        },
      },
    },
    async () => {
      await fastify.prisma.$queryRaw`SELECT 1`;
      return { status: "ok" as const };
    }
  );
};

export default plugin;
