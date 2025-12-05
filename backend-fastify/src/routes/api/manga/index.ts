import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import axios from "axios";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    "/:id",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
        }),
        body: Type.Object({
          limit: Type.Number({ default: 20 }),
          offset: Type.Number({ default: 0 }),
        }),
        querystring: Type.Object({
          downloaded: Type.Optional(Type.String()),
        }),
        tags: ["Manga"],
        summary: "Get manga details and chapters",
        description:
          "Returns manga information and chapters. Use downloaded=true for downloaded chapters.",
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { limit, offset } = request.body;
      const isDownloaded = request.query.downloaded;

      if (isDownloaded === "true") {
        return getDownloadedScans(fastify, id, limit, offset);
      }
      return getNotDownloadedScans(fastify, request, id, limit, offset);
    }
  );
};

async function getDownloadedScans(
  fastify: any,
  id: string,
  limit: number,
  offset: number
) {
  const cacheKey = `manga:${id}:downloaded:${limit}:${offset}`;
  const cached = await fastify.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const chapters = await fastify.prisma.chapter.findMany({
    where: {
      mangaId: id,
    },
  });

  const result = {
    chaptersLength: chapters.length,
    chapters: chapters
      .sort((a: any, b: any) => b.number - a.number)
      .slice(offset * limit, Math.min(offset * limit + limit, chapters.length)),
  };

  await fastify.redis.set(cacheKey, JSON.stringify(result), "EX", 24 * 60 * 60);
  return result;
}

async function getNotDownloadedScans(
  fastify: any,
  request: any,
  id: string,
  limit: number,
  offset: number
) {
  const token = request.headers.authorization;

  const cacheKey = `manga:${id}:not-downloaded:${limit}:${offset}`;
  const cached = await fastify.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    const resp = await axios.get(
      `https://api.mangadex.org/manga/${id}/feed?includeFuturePublishAt=0`,
      {
        params: {
          limit: limit,
          offset: offset * limit,
          "order[chapter]": "desc",
          "translatedLanguage[]": "en",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const includes = ["author", "cover_art"];
    const responseMangaDetail = await axios.get(
      `https://api.mangadex.org/manga/${id}`,
      {
        params: {
          includes,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = { manga: responseMangaDetail.data, chapters: resp.data };
    await fastify.redis.set(cacheKey, JSON.stringify(result), "EX", 24 * 60 * 60);
    return result;
  } catch (e) {
    fastify.log.error(e);
    throw new Error("Manga not found");
  }
}

export default plugin;
