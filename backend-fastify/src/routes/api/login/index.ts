import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import axios from "axios";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    "/",
    {
      schema: {
        body: Type.Object({
          username: Type.Optional(Type.String()),
          password: Type.Optional(Type.String()),
        }),
        response: {
          200: Type.Object({
            success: Type.Boolean(),
            access_token: Type.Optional(Type.String()),
            error: Type.Optional(Type.String()),
          }),
        },
        tags: ["Auth"],
        summary: "Login to MangaDex",
        description: "Authenticates with MangaDex and returns an access token",
      },
    },
    async (request, reply) => {
      try {
        fastify.log.info("Starting login process...");

        if (
          !process.env.MANGADEX_USERNAME ||
          !process.env.MANGADEX_PASSWORD ||
          !process.env.MANGADEX_CLIENT_ID ||
          !process.env.MANGADEX_CLIENT_SECRET
        ) {
          throw new Error(
            "MangaDex credentials not found in environment variables"
          );
        }

        fastify.log.info("Getting tokens from auth service...");
        const tokens = await fastify.authService.getTokens();

        fastify.log.info("Saving token to database...");
        await fastify.prisma.token.create({
          data: {
            token: tokens.access_token,
            refreshToken: tokens.refresh_token,
          },
        });

        return { success: true, access_token: tokens.access_token };
      } catch (error) {
        fastify.log.error(
          {
            status: axios.isAxiosError(error) ? error.response?.status : undefined,
            data: axios.isAxiosError(error) ? error.response?.data : undefined,
            message: error instanceof Error ? error.message : "Unknown error",
          },
          "Login error"
        );
        return {
          success: false,
          error: axios.isAxiosError(error)
            ? error.response?.data?.error_description
            : error instanceof Error
              ? error.message
              : "Unknown error",
        };
      }
    }
  );
};

export default plugin;
