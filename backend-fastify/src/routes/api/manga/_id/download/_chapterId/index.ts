import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
          chapterId: Type.String(),
        }),
        tags: ["Manga"],
        summary: "Download chapter as single image",
        description:
          "Downloads all pages of a chapter and streams them as a single assembled PNG image",
      },
    },
    async (request, reply) => {
      const { chapterId } = request.params;

      try {
        fastify.log.info({ chapterId }, "Starting chapter download...");

        // Get download links from MangaDex
        fastify.log.info("Fetching chapter download links...");
        const links = await fastify.mangaDexService.getChapterDownloadLinks(chapterId);
        fastify.log.info({ count: links.length }, "Got download links");

        if (!reply.raw.headersSent) {
          reply.raw.writeHead(200, {
            "Access-Control-Allow-Origin": process.env.FRONT_END_URL || "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Accept, X-Requested-With, Authorization",
            "Access-Control-Expose-Headers":
              "Content-Disposition, Content-Type, Content-Length",
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="chapter-${chapterId}.png"`,
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff",
            "Transfer-Encoding": "chunked",
          });
        }

        // Stream the assembled image directly to the client
        await fastify.imageService.assembleImagesAndStream(links, reply.raw);

        return reply;
      } catch (error) {
        fastify.log.error({ err: error }, "Error in download chapter");
        if (!reply.raw.headersSent) {
          const statusCode =
            error instanceof Error && "statusCode" in error
              ? (error as any).statusCode
              : 500;
          const message =
            error instanceof Error ? error.message : "Internal server error";

          return reply.status(statusCode).send({
            error: statusCode === 500 ? "Internal server error" : message,
            message: statusCode === 500 ? message : undefined,
          });
        } else {
          // If headers are already sent, just end the response
          reply.raw.end();
        }
      }
    }
  );
};

export default plugin;
