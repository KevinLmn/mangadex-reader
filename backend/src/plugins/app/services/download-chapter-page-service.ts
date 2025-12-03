import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { createDownloadChapterPageService } from "../../../services/download-chapter-page-service.js";

export interface DownloadChapterPageService {
  downloadChapterController(id: string, chapterId: string): Promise<any>;
}

declare module "fastify" {
  interface FastifyInstance {
    downloadChapterPageService: DownloadChapterPageService;
  }
}

const downloadChapterPageServicePlugin: FastifyPluginAsync = async (
  fastify
) => {
  const service = createDownloadChapterPageService();
  fastify.decorate("downloadChapterPageService", service);
};

export default fp(downloadChapterPageServicePlugin, {
  name: "download-chapter-page-service",
});
