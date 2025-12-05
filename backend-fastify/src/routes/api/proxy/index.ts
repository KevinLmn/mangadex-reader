import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import axios from "axios";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/image",
    {
      schema: {
        querystring: Type.Object({
          url: Type.String(),
        }),
        tags: ["Proxy"],
        summary: "Proxy image request",
        description: "Proxies image requests to bypass CORS restrictions",
      },
    },
    async (request, reply) => {
      const { url } = request.query;

      if (!url) {
        fastify.log.error("Missing URL parameter");
        return reply.status(400).send({ error: "URL is required" });
      }

      try {
        fastify.log.info({ url }, "Proxying image request");
        const response = await axios.get(url, {
          responseType: "stream",
          headers: {
            "User-Agent": "Mozilla/5.0",
            Referer: "https://mangadex.org",
          },
        });

        // Set CORS headers
        reply.header("Access-Control-Allow-Origin", "*");
        reply.header("Access-Control-Allow-Methods", "GET, OPTIONS");
        reply.header(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization"
        );
        // Allow cross-origin embedding
        reply.header("Cross-Origin-Resource-Policy", "cross-origin");

        // Set cache headers
        reply.header("Cache-Control", "public, max-age=31536000");
        reply.header("Content-Type", response.headers["content-type"]);

        fastify.log.info(
          { url, contentType: response.headers["content-type"] },
          "Successfully proxied image"
        );
        return response.data;
      } catch (error) {
        fastify.log.error(
          {
            url,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Proxy error"
        );
        return reply.status(500).send({ error: "Failed to proxy image" });
      }
    }
  );
};

export default plugin;
