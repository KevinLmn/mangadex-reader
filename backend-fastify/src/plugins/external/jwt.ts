import jwt from "@fastify/jwt";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(jwt, {
    secret: fastify.config.JWT_SECRET,
    sign: {
      expiresIn: "1h",
    },
  });
};

export default fp(jwtPlugin, {
  name: "jwt",
});
