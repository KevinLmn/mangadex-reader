import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import axios from "axios";

const MANGADEX_BASE_URL = process.env.MANGADEX_BASE_URL || "https://api.mangadex.org";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        querystring: Type.Object({
          q: Type.String({ minLength: 1 }),
          limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
          offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
        }),
        tags: ["Search"],
        summary: "Search manga",
        description: "Search for manga by title",
      },
    },
    async (request, reply) => {
      const { q, limit = 20, offset = 0 } = request.query;

      try {
        const response = await axios.get(`${MANGADEX_BASE_URL}/manga`, {
          params: {
            title: q,
            includes: ["author", "cover_art"],
            contentRating: ["safe"],
            limit,
            offset,
            "order[relevance]": "desc",
          },
        });

        return reply.send(response.data);
      } catch (error) {
        fastify.log.error({ err: error }, "Error searching manga");
        return reply.status(500).send({ error: "Failed to search manga" });
      }
    }
  );
};

export default plugin;
