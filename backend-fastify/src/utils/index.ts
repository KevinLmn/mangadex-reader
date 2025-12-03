import createError from "@fastify/error";

export const ServerError = createError(
  "ServerError",
  "A server error occurred",
  500
);
