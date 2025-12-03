import { DownloadChapterPageService } from "../plugins/app/services/download-chapter-page-service.js";
import { ImageService } from "../services/imageService.js";
import { MangaDexService } from "../services/mangaDexService.js";

export function createDownloadChapterPageService(): DownloadChapterPageService {
  return {
    async downloadChapterController(
      id: string,
      chapterId: string
    ): Promise<any> {
      try {
        const { id, chapterId } = request.params;

        console.log("Downloading chapter...");

        // Use backend's stored credentials instead of requiring user token
        const mangaDexService = new MangaDexService();
        const imageService = new ImageService();

        console.log("Fetching chapter download links...");
        const links = await mangaDexService.getChapterDownloadLinks(chapterId);
        console.log(`Got ${links.length} download links`);

        if (!reply.raw.headersSent) {
          reply.raw.writeHead(200, {
            "Access-Control-Allow-Origin": `${process.env.NEXT_PUBLIC_FRONT_END_URL}`,
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
        await imageService.assembleImagesAndStream(links, reply.raw);

        return reply;
      } catch (error) {
        console.error("Error in downloadChapterController:", error);
        if (!reply.raw.headersSent) {
          const statusCode =
            error instanceof Error && "status" in error
              ? (error as any).status
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
    },
  };
}
