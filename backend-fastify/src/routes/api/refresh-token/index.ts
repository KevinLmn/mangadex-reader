import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { FastifyReply, FastifyRequest } from "fastify";
import { decrypt, encrypt, hmac } from "../../../services/crypto.js";

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

      const databaseToken = await fastify.prisma.token.findUnique({
        where: {
          tokenHash: hmac(currentToken),
        },
      });

      if (!databaseToken) {
        fastify.log.warn("Token not found in database");
        return reply.status(404).send({
          error: "Token not found",
        });
      }

      try {
        const tokens = await fastify.authService.refreshToken(
          decrypt(databaseToken.refreshToken)
        );

        await fastify.prisma.token.update({
          where: {
            id: databaseToken.id,
          },
          data: {
            token: encrypt(tokens.access_token),
            refreshToken: encrypt(tokens.refresh_token),
            tokenHash: hmac(tokens.access_token),
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
