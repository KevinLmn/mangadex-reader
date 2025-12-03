import { FastifyInstance, preHandlerHookHandler } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    guards: {
      ///
    };
  }
}

function requireRightProfileFactory(fastify: FastifyInstance): preHandlerHookHandler {
  ///
}

export default fp(async (fastify) => {
  fastify.decorate('guards', {
    ///
  });
}, { name: 'guards' });