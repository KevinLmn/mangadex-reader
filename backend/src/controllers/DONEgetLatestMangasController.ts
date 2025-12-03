import dotenv from "dotenv";
import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { MangaDexChapter } from "../utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

type MangaRequestBody = {
  mangaName: string;
};

type MangaDexManga = Omit<MangaDexChapter, "links">;

// type MangaDexResponse = {
//   result: string;
//   response: string;
//   data: MangaDexManga[];
//   limit: number;
//   offset: number;
//   total: number;
// };

export const getLatestMangas = async (
  request: FastifyRequest<{ Body: MangaRequestBody }>,
  reply: FastifyReply
): Promise<any> => {
  // const token = request.headers.authorization;
  // const contentRating = ["safe"];
  // const includes = ["author", "cover_art"];

  // try {
  //   const resp = await axios.get(`${process.env.MANGADEX_BASE_URL}/manga`, {
  //     params: {
  //       includes,
  //       contentRating,
  //       limit: 20,
  //       "order[updatedAt]": "desc",
  //     },
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });
  //   const manga: MangaDexResponse = resp.data;
  //   return { ...manga };
  // } catch (error) {
  //   console.error(error);
  //   throw new Error("Something went wrong with the search");
  // }

  const data = await fs.readFile(
    path.resolve(__dirname, "../../cache/latest.json"),
    "utf-8"
  );
  return reply.send(JSON.parse(data));
};
