import cookie from "@fastify/cookie";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const cookiesPlugin: FastifyPluginAsync = async (app) => {
  app.register(cookie);
};

export default fp(cookiesPlugin, { name: "cookies" });
