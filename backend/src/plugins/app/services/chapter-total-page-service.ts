import axios from "axios";
import dotenv from "dotenv";
import { FastifyRequest } from "fastify";
import redis from "../redis.js";
import { createLogger } from "../utils/logger.js";
dotenv.config();

const logger = createLogger("getChapterTotalPage.ts");

export const getChapterTotalPageController = async (
  request: FastifyRequest<{
    Params: {
      chapterId: string;
    };
  }>
): Promise<{ totalPages: number }> => {
  const { chapterId } = request.params;
  const token = request.headers.authorization;
  const metaCacheKey = `chapterMeta:${chapterId}`;

  // Try to get from cache first
  const cachedMeta = await redis.get(metaCacheKey);
  if (cachedMeta) {
    logger.info("Cache hit for chapter total pages", 24, { chapterId });
    return { totalPages: JSON.parse(cachedMeta).totalPages };
  }

  // If not in cache, fetch from MangaDex
  logger.info("Cache miss for chapter total pages", 29, { chapterId });
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
  await redis.set(metaCacheKey, JSON.stringify(metaData), "EX", 24 * 60 * 60);
  logger.info("Cached chapter metadata", 48, { chapterId });

  return { totalPages: metaData.totalPages };
};
