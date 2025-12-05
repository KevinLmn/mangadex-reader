import cors from "@fastify/cors";
import { FastifyInstance } from "fastify";

export const autoConfig = (fastify: FastifyInstance) => {
  const ALLOWED_ORIGINS = new Set([fastify.config.FRONT_END_URL]);

  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow requests without Origin (e.g., curl, healthchecks)
      if (!origin || ALLOWED_ORIGINS.has(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    exposedHeaders: ["Content-Disposition", "Content-Type", "Content-Length", "retry-after"],
    credentials: true,
  };
};

export default cors;
