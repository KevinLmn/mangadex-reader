import axios from "axios";
import dotenv from "dotenv";
import { FastifyReply, FastifyRequest } from "fastify";
import redis from "../redis.js";
import { createLogger } from "../utils/logger.js";
dotenv.config();

type GetChapterPageReturnType = {
  buffer: Buffer;
  contentType: string;
  numberOfPages: number;
};

type ChapterMeta = {
  baseUrl: string;
  hash: string;
  data: string[];
  dataSaver: string[];
  totalPages: number;
};

const logger = createLogger("getChapterPageController.ts");

export const getChapterPageController = async (
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
): Promise<void> => {
  const { chapterId } = request.params;
  const { chapterPage } = request.params;
  const token = request.headers.authorization;
  const quality = request.query.quality || "high";

  const cacheKey = `chapterPage:${chapterId}:${chapterPage}:${quality}`;
  const metaCacheKey = `chapterMeta:${chapterId}`;
  const cachedUrl = await redis.get(cacheKey);
  const cachedMeta = await redis.get(metaCacheKey);

  const numberOfPages = cachedMeta ? JSON.parse(cachedMeta).totalPages : null;
  if (cachedUrl && numberOfPages) {
    logger.info("Cache hit for chapter page", 14, {
      chapterId,
      chapterPage,
      quality,
    });
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
    // return {
    //   buffer: imageResponse.data,
    //   contentType: imageResponse.headers["content-type"],
    //   numberOfPages: Number(numberOfPages),
    // };
  }

  logger.info("Cache miss for chapter page", 19, {
    chapterId,
    chapterPage,
    quality,
  });

  let chapterMeta: string | null = await redis.get(metaCacheKey);
  if (!chapterMeta) {
    logger.info("Cache miss for chapter metadata", 25, { chapterId });
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
    await redis.set(metaCacheKey, chapterMeta, "EX", 24 * 60 * 60);
    logger.info("Cached chapter metadata", 35, { chapterId });
    await redis.set(
      `${metaCacheKey}:totalPages`,
      metaData.totalPages.toString(),
      "EX",
      24 * 60 * 60
    );
    logger.info("Cached chapter total pages", 40, { chapterId });
  } else {
    logger.info("Cache hit for chapter metadata", 42, { chapterId });
  }
  const parsedMeta: ChapterMeta = JSON.parse(chapterMeta);

  const fileName =
    quality === "high"
      ? parsedMeta?.data[Number(chapterPage) - 1]
      : parsedMeta?.dataSaver[Number(chapterPage) - 1];

  const imageUrl = `${parsedMeta.baseUrl}/${quality === "high" ? "data" : "data-saver"}/${parsedMeta.hash}/${fileName}`;

  let imageResponse;
  try {
    imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: { Referer: "https://mangadex.org" },
    });

    await redis.set(cacheKey, imageUrl, "EX", 24 * 60 * 60);
    logger.info("Cached chapter page image", 60, {
      chapterId,
      chapterPage,
      quality,
    });

    reply
      .header("Content-Type", imageResponse.headers["content-type"])
      .send(imageResponse.data);

    // return {
    //   buffer: imageResponse.data,
    //   contentType: imageResponse.headers["content-type"],
    // };
  } catch (error) {
    logger.error("Error fetching chapter page", 60);
  }
};
