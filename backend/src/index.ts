import cors from "@fastify/cors";
import fastify from "fastify";
import { downloadChapterController } from "./controllers/DONEdownloadChapterController.js";
import { getChapterPageController } from "./controllers/DONEgetChapterPageController.js";
import { getChapterTotalPageController } from "./controllers/DONEgetChapterTotalPage.js";
import { getLatestMangas } from "./controllers/DONEgetLatestMangasController.js";
import { getMangaController } from "./controllers/DONEgetMangaController.js";
import { getPopularMangas } from "./controllers/DONEgetPopularMangasController.js";
import { loginController } from "./controllers/?loginController.js";
import { refreshTokenController } from "./controllers/?refreshTokenController.js";
import { loginMiddleware } from "./middlewares.js";
import { proxyRoutes } from "./routes/proxy.js";

const server = fastify({
  logger: true,
  ignoreTrailingSlash: true,
});

server.register(cors, {
  origin: process.env.FRONT_END_URL || "http://localhost:3011",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Accept",
    "Authorization",
    "X-Requested-With",
  ],
  exposedHeaders: ["Content-Disposition", "Content-Type", "Content-Length"],
});

server.addHook("preHandler", loginMiddleware);

server.post("/refreshToken", refreshTokenController);

server.post("/login", loginController);

server.post("/manga/:id", getMangaController);

server.get("/manga/chapter/:chapterId/:chapterPage", getChapterPageController);

server.get("/manga/:id/download/:chapterId", downloadChapterController);

server.get("/popular", getPopularMangas);

server.get("/latest", getLatestMangas);

server.get("/manga/chapter/:chapterId/total", getChapterTotalPageController);

// Register proxy route
server.register(proxyRoutes, { prefix: "/" });

server.get("/health", async () => {
  return { status: "ok" };
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3012;
server.listen({ port, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server is running on port ${port}`);
});

export default server;
