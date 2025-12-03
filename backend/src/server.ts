import Fastify from 'fastify';
import fp from 'fastify-plugin';

// Import library to exit fastify process, gracefully (if possible)
import closeWithGrace from 'close-with-grace';

// Import your application as a normal plugin.
import serviceApp from './app.js';

/**
 * Do not use NODE_ENV to determine what logger (or any env related feature) to use
 * @see {@link https://www.youtube.com/watch?v=HMM7GJC5E2o}
 */
function getLoggerOptions () {
  // Only if the program is running in an interactive terminal
  if (process.stdout.isTTY) {
    return {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    };
  }

  return { level: process.env.LOG_LEVEL ?? 'debug' };
}

const app = Fastify({
  logger: getLoggerOptions()
});

async function init () {
  // Register your application as a normal plugin.
  // fp must be used to override default error handler
  app.register(fp(serviceApp));

  // Delay is the number of milliseconds for the graceful close to finish
  closeWithGrace(
    { delay: Number(process.env.FASTIFY_CLOSE_GRACE_DELAY) ?? 500 },
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
    await app.listen({ port: Number(process.env.PORT) ?? 3004 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

init();