/**
 * If you would like to turn your application into a standalone executable, look at server.js file
 */

import fastifyAutoload from "@fastify/autoload";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import path from "node:path";
import env, { autoConfig } from "./plugins/core/env.js";

export const options = {
  ajv: {
    customOptions: {
      coerceTypes: "array",
      removeAdditional: "all",
    },
  },
};

export default async function serviceApp(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  delete opts.skipOverride; // This option only serves testing purpose

  await fastify.register(env, autoConfig);

  // This loads all external plugins and core technical services simultaneously
  // Those should be registered first as your application plugins might depend on them
  await Promise.all([
    fastify.register(fastifyAutoload, {
      dir: path.join(import.meta.dirname, "plugins/core"),
      ignorePattern: /env\.(js|ts)$/,
      options: { ...opts },
    }),
    fastify.register(fastifyAutoload, {
      dir: path.join(import.meta.dirname, "plugins/external"),
      options: { ...opts },
    }),
  ]);

  // This loads all your application plugins defined in plugins/app
  // those should be support plugins that are reused
  // through your application
  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "plugins/app"),
    options: { ...opts },
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "routes"),
    autoHooks: true, // apply hooks to routes in this level (see : autohooks.js)
    cascadeHooks: true, // continue applying hooks to children, starting at this level,
    routeParams: true,
    dirNameRoutePrefix: true,
    options: { ...opts },
  });

  fastify.setErrorHandler((err, request, reply) => {
    fastify.log.error("err:-------------");
    fastify.log.error(err);
    fastify.log.error(
      {
        err,
        request: {
          method: request.method,
          url: request.url,
          query: request.query,
          params: request.params,
        },
      },
      "Unhandled error occurred"
    );

    reply.code(err.statusCode ?? 500);

    let message = "Internal Server Error";
    let code = "INTERNAL_SERVER_ERROR";

    if (err.statusCode && err.statusCode < 500) {
      message = err.message;
      code = err.code || "ERROR";
    }

    return { message, code };
  });

  fastify.setNotFoundHandler(
    {
      // 404 error handling is rate limited because an attacker could search for valid URLs
      preHandler: fastify.rateLimit({
        max: 3,
        timeWindow: 500,
      }),
    },
    (request, reply) => {
      request.log.warn(
        {
          request: {
            method: request.method,
            url: request.url,
            query: request.query,
            params: request.params,
          },
        },
        "Resource not found"
      );

      reply.code(404);

      return { message: "Not Found" };
    }
  );
}
