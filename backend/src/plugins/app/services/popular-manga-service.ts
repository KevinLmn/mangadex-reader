import dotenv from "dotenv";
import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

// type MangaRequestBody = {
//   mangaName: string;
// };

// type MangaDexManga = Omit<MangaDexChapter, "links">;

// type MangaDexResponse = {
//   result: string;
//   response: string;
//   data: MangaDexManga[];
//   limit: number;
//   offset: number;
//   total: number;
// };

export const getPopularMangas = async (
  request: FastifyRequest<{ Body: any }>,
  reply: FastifyReply
): Promise<any> => {
  // const token = request.headers.authorization;
  // const contentRating = ["safe"];
  // const includes = ["author", "cover_art"];
  // const order = {
  //   rating: "desc",
  //   followedCount: "desc",
  // };

  // const finalOrderQuery: Record<string, string> = {};

  // for (const [key, value] of Object.entries(order)) {
  //   finalOrderQuery[`order[${key}]`] = value;
  // }
  // try {
  //   const resp = await axios.get(`${process.env.MANGADEX_BASE_URL}/manga`, {
  //     params: {
  //       includes,
  //       contentRating,
  //       limit: 20,
  //       ...finalOrderQuery,
  //     },
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });

  //   const manga: MangaDexResponse = resp.data;
  //   return { ...manga };
  const data = await fs.readFile(
    path.resolve(__dirname, "../../cache/popular.json"),
    "utf-8"
  );
  return reply.send(JSON.parse(data));
};
