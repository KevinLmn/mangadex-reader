import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { FastifyReply, FastifyRequest } from "fastify";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    "/",
    {
      schema: {
        body: Type.Object({
          token: Type.String(),
        }),
        response: {
          200: Type.Object({
            token: Type.String(),
          }),
          404: Type.Object({
            error: Type.String(),
          }),
          500: Type.Object({
            error: Type.String(),
          }),
        },
        tags: ["Auth"],
        summary: "Refresh access token",
        description:
          "Refreshes an access token using the refresh token stored in the database",
      },
    },
    async (
      request: FastifyRequest<{
        Body: {
          token: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const currentToken = request.body.token;

      const databaseToken = await fastify.prisma.token.findFirst({
        where: {
          token: currentToken,
        },
      });

      if (!databaseToken) {
        fastify.log.warn(
          { token: currentToken },
          "Token not found in database"
        );
        return reply.status(404).send({
          error: "Token not found",
        });
      }

      try {
        const tokens = await fastify.authService.refreshToken(
          databaseToken.refreshToken
        );

        await fastify.prisma.token.update({
          where: {
            token: databaseToken.token,
          },
          data: {
            token: tokens.access_token,
            refreshToken: tokens.refresh_token,
          },
        });

        fastify.log.info(
          { tokenId: databaseToken.id },
          "Token refreshed successfully"
        );

        return { token: tokens.access_token };
      } catch (error) {
        fastify.log.error(
          { err: error, tokenId: databaseToken.id },
          "Failed to refresh token"
        );
        return reply.status(500).send({
          error: "Failed to refresh token",
        });
      }
    }
  );
};

export default plugin;
