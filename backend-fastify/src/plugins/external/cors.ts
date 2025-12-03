import cors from "@fastify/cors";
import { FastifyInstance } from "fastify";

export const autoConfig = (fastify: FastifyInstance) => {
  // ALLOWED_ORIGINS et OPTIONS necessaires uniquement si le système de refresh token est implémenté
  const ALLOWED_ORIGINS = new Set([fastify.config.FRONTEND_URL_QCM_ADMIN]);

  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Autorise aussi les requêtes sans Origin (ex: curl, healthchecks)
      if (!origin || ALLOWED_ORIGINS.has(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["retry-after"],
    credentials: true,
  };
};

export default cors;
