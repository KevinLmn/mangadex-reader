import Fastify from "fastify";
import fp from "fastify-plugin";

import closeWithGrace from "close-with-grace";

import serviceApp from "./app.js";

function getLoggerOptions() {
  if (process.stdout.isTTY) {
    return {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    };
  }

  return { level: process.env.LOG_LEVEL ?? "debug" };
}

const app = Fastify({
  logger: getLoggerOptions(),
  ajv: {
    customOptions: {
      coerceTypes: "array",
      removeAdditional: "all",
    },
  },
});

async function init() {
  app.register(fp(serviceApp));

  closeWithGrace(
    { delay: process.env.FASTIFY_CLOSE_GRACE_DELAY ?? 500 },
    async ({ err }) => {
      if (err != null) {
        app.log.error(err);
      }

      await app.close();
    }
  );

  await app.ready();

  try {
    // Start listening.
    await app.listen({ port: process.env.PORT ?? 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

init();
