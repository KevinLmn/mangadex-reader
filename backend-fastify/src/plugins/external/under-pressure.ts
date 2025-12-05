/**
 * The function `autoConfig` returns an object with configuration settings for handling server pressure
 * and includes a health check function for a Fastify plugin.
 * @param {FastifyInstance} fastify - The `fastify` parameter in the `autoConfig` function is an
 * instance of Fastify that is passed to the function. It is used to access Fastify's functionalities
 * and properties within the configuration object that is returned by the function. This allows you to
 * set up specific configurations based on the Fast
 * @returns The `autoConfig` function is being exported, which returns an object containing various
 * configuration options for handling server pressure using the Fastify plugin `fastifyUnderPressure`.
 * The object includes settings such as `maxEventLoopDelay`, `maxHeapUsedBytes`, `maxRssBytes`,
 * `maxEventLoopUtilization`, `message`, `retryAfter`, `healthCheck`, and `healthCheckInterval
 */
import fastifyUnderPressure from '@fastify/under-pressure'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

export const autoConfig = (fastify: FastifyInstance) => {
  return {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 100_000_000,
    maxRssBytes: 1_000_000_000,
    maxEventLoopUtilization: 0.98,
    message: 'The server is under pressure, retry later!',
    retryAfter: 50,
    healthCheck: async () => {
      try {
        await fastify.prisma.$queryRaw`SELECT 1`
        return true
        /* c8 ignore start */
      } catch (err) {
        fastify.log.error(err, 'healthCheck has failed')
        throw new Error('Database connection is not available')
      }
      /* c8 ignore stop */
    },
    healthCheckInterval: 5000,
  }
}

/**
 * A Fastify plugin for mesuring process load and automatically
 * handle of "Service Unavailable"
 *
 * @see {@link https://github.com/fastify/under-pressure}
 *
 * Video on the topic: Do not thrash the event loop
 * @see {@link https://www.youtube.com/watch?v=VI29mUA8n9w}
 */
export default fp(fastifyUnderPressure, {
  dependencies: ['prisma'],
})
