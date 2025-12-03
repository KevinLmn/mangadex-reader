import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { createMangaDexService } from "../../../services/manga-dex-service.js";

export interface MangaDexService {
  getAuthHeaders: () => Promise<{ Authorization: string }>;
  getMangaChapters: (
    mangaId: string,
    limit: number,
    offset: number
  ) => Promise<any[]>;
  getChapterDownloadLinks: (chapterId: string) => Promise<string[]>;
}

declare module "fastify" {
  interface FastifyInstance {
    mangaDexService: MangaDexService;
  }
}

const mangaDexServicePlugin: FastifyPluginAsync = async (fastify) => {
  const mangaDexService = createMangaDexService(
    fastify.prisma,
    fastify.authService
  );
  fastify.decorate("mangaDexService", mangaDexService);
};

export default fp(mangaDexServicePlugin, {
  name: "manga-dex-service",
});
