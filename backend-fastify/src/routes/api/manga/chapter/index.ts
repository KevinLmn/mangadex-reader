import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import axios from "axios";
import { FastifyReply, FastifyRequest } from "fastify";

type ChapterMeta = {
  baseUrl: string;
  hash: string;
  data: string[];
  dataSaver: string[];
  totalPages: number;
};

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/:chapterId/:chapterPage",
    {
      schema: {
        params: Type.Object({
          chapterId: Type.String(),
          chapterPage: Type.String(),
        }),
        querystring: Type.Object({
          quality: Type.Optional(
            Type.Union([Type.Literal("high"), Type.Literal("data-saver")])
          ),
        }),
        tags: ["Manga"],
        summary: "Get a specific page from a chapter",
        description: "Returns the image for a specific page of a chapter",
      },
    },
    async (
      request: FastifyRequest<{
        Params: {
          chapterId: string;
          chapterPage: string;
        };
        Querystring: {
          quality?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { chapterId, chapterPage } = request.params;
      const token = request.headers.authorization;
      const quality = request.query.quality || "high";

      const cacheKey = `chapterPage:${chapterId}:${chapterPage}:${quality}`;
      const metaCacheKey = `chapterMeta:${chapterId}`;
      const cachedUrl = await fastify.redis.get(cacheKey);
      const cachedMeta = await fastify.redis.get(metaCacheKey);

      const numberOfPages = cachedMeta
        ? JSON.parse(cachedMeta).totalPages
        : null;
      if (cachedUrl && numberOfPages) {
        fastify.log.info(
          {
            chapterId,
            chapterPage,
            quality,
          },
          "Cache hit for chapter page"
        );
        const imageResponse = await axios.get(cachedUrl, {
          responseType: "arraybuffer",
          headers: {
            Referer: "https://mangadex.org",
            Authorization: `Bearer ${token}`,
          },
        });
        reply.header("Content-Type", imageResponse.headers["content-type"]);
        reply.send(imageResponse.data);
        return;
      }

      fastify.log.info(
        {
          chapterId,
          chapterPage,
          quality,
        },
        "Cache miss for chapter page"
      );

      let chapterMeta: string | null = await fastify.redis.get(metaCacheKey);
      if (!chapterMeta) {
        fastify.log.info({ chapterId }, "Cache miss for chapter metadata");
        const response = await axios.get(
          `${process.env.MANGADEX_BASE_URL}/at-home/server/${chapterId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const chapter = response.data;
        const metaData: ChapterMeta = {
          baseUrl: chapter.baseUrl,
          hash: chapter.chapter.hash,
          data: chapter.chapter.data,
          dataSaver: chapter.chapter.dataSaver,
          totalPages: chapter.chapter.data.length,
        };
        chapterMeta = JSON.stringify(metaData);
        await fastify.redis.set(metaCacheKey, chapterMeta, "EX", 24 * 60 * 60);
        fastify.log.info({ chapterId }, "Cached chapter metadata");
        await fastify.redis.set(
          `${metaCacheKey}:totalPages`,
          metaData.totalPages.toString(),
          "EX",
          24 * 60 * 60
        );
        fastify.log.info({ chapterId }, "Cached chapter total pages");
      } else {
        fastify.log.info({ chapterId }, "Cache hit for chapter metadata");
      }
      const parsedMeta: ChapterMeta = JSON.parse(chapterMeta);

      const fileName =
        quality === "high"
          ? parsedMeta?.data[Number(chapterPage) - 1]
          : parsedMeta?.dataSaver[Number(chapterPage) - 1];

      const imageUrl = `${parsedMeta.baseUrl}/${quality === "high" ? "data" : "data-saver"}/${parsedMeta.hash}/${fileName}`;

      try {
        const imageResponse = await axios.get(imageUrl, {
          responseType: "arraybuffer",
          headers: { Referer: "https://mangadex.org" },
        });

        await fastify.redis.set(cacheKey, imageUrl, "EX", 24 * 60 * 60);
        fastify.log.info(
          {
            chapterId,
            chapterPage,
            quality,
          },
          "Cached chapter page image"
        );

        reply
          .header("Content-Type", imageResponse.headers["content-type"])
          .send(imageResponse.data);
      } catch (error) {
        fastify.log.error({ err: error }, "Error fetching chapter page");
        reply.status(500).send({ error: "Failed to fetch chapter page" });
      }
    }
  );

  fastify.get(
    "/:chapterId/total",
    {
      schema: {
        params: Type.Object({
          chapterId: Type.String(),
        }),
        response: {
          200: Type.Object({
            totalPages: Type.Number(),
          }),
        },
        tags: ["Manga"],
        summary: "Get total pages for a chapter",
        description: "Returns the total number of pages in a chapter",
      },
    },
    async (
      request: FastifyRequest<{
        Params: {
          chapterId: string;
        };
      }>
    ) => {
      const { chapterId } = request.params;
      const token = request.headers.authorization;
      const metaCacheKey = `chapterMeta:${chapterId}`;

      // Try to get from cache first
      const cachedMeta = await fastify.redis.get(metaCacheKey);
      if (cachedMeta) {
        fastify.log.info({ chapterId }, "Cache hit for chapter total pages");
        return { totalPages: JSON.parse(cachedMeta).totalPages };
      }

      // If not in cache, fetch from MangaDex
      fastify.log.info({ chapterId }, "Cache miss for chapter total pages");
      const response = await axios.get(
        `${process.env.MANGADEX_BASE_URL}/at-home/server/${chapterId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const chapter = response.data;
      const metaData = {
        baseUrl: chapter.baseUrl,
        hash: chapter.chapter.hash,
        data: chapter.chapter.data,
        dataSaver: chapter.chapter.dataSaver,
        totalPages: chapter.chapter.data.length,
      };

      // Cache the metadata
      await fastify.redis.set(
        metaCacheKey,
        JSON.stringify(metaData),
        "EX",
        24 * 60 * 60
      );
      fastify.log.info({ chapterId }, "Cached chapter metadata");

      return { totalPages: metaData.totalPages };
    }
  );

  fastify.get(
    "/:chapterId/info",
    {
      schema: {
        params: Type.Object({
          chapterId: Type.String(),
        }),
        response: {
          200: Type.Object({
            chapter: Type.Union([Type.String(), Type.Null()]),
            volume: Type.Union([Type.String(), Type.Null()]),
            title: Type.Union([Type.String(), Type.Null()]),
          }),
        },
        tags: ["Manga"],
        summary: "Get chapter info",
        description: "Returns chapter number, volume, and title",
      },
    },
    async (
      request: FastifyRequest<{
        Params: {
          chapterId: string;
        };
      }>
    ) => {
      const { chapterId } = request.params;
      const infoCacheKey = `chapterInfo:${chapterId}`;

      const cachedInfo = await fastify.redis.get(infoCacheKey);
      if (cachedInfo) {
        fastify.log.info({ chapterId }, "Cache hit for chapter info");
        return JSON.parse(cachedInfo);
      }

      fastify.log.info({ chapterId }, "Cache miss for chapter info");
      const response = await axios.get(
        `${process.env.MANGADEX_BASE_URL}/chapter/${chapterId}`
      );

      const chapterData = response.data.data;
      const info = {
        chapter: chapterData.attributes.chapter,
        volume: chapterData.attributes.volume,
        title: chapterData.attributes.title,
      };

      await fastify.redis.set(infoCacheKey, JSON.stringify(info), "EX", 24 * 60 * 60);
      fastify.log.info({ chapterId }, "Cached chapter info");

      return info;
    }
  );
};

export default plugin;
