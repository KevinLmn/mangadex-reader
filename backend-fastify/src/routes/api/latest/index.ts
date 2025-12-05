import { FastifyPluginAsync } from 'fastify'
import fs from 'fs/promises'
import path from 'path'

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    try {
      // Try cache first
      const cacheKey = 'latest:mangas'
      const cached = await fastify.redis.get(cacheKey)
      if (cached) {
        return reply.send(JSON.parse(cached))
      }

      // Read from cache file
      const data = await fs.readFile(
        path.resolve(import.meta.dirname, '../../../../cache/latest.json'),
        'utf-8'
      )
      const parsed = JSON.parse(data)

      // Cache for 1 hour
      await fastify.redis.set(cacheKey, data, 'EX', 60 * 60)

      return reply.send(parsed)
    } catch (error) {
      fastify.log.error({ err: error }, 'Error fetching latest mangas')
      return reply.status(500).send({ error: 'Failed to fetch latest mangas' })
    }
  })
}

export default plugin
