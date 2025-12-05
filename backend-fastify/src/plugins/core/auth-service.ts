// plugins/auth-service.ts
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { AuthService } from "../../services/auth-service.js";

declare module "fastify" {
  interface FastifyInstance {
    authService: AuthService;
  }
  interface FastifyRequest {
    authService: AuthService;
  }
}

const authServicePlugin: FastifyPluginAsync = async (fastify) => {
  // Create a single app-wide AuthService instance with logger
  const authService = new AuthService(fastify.log);

  // Expose on fastify instance
  fastify.decorate("authService", authService);

  // Make authService available on each request
  fastify.addHook("onRequest", async (req) => {
    req.authService = authService;
  });
};

export default fp(authServicePlugin, {
  name: "auth-service",
  fastify: "5.x",
});
