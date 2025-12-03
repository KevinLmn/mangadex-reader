import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox';
import { CentreFormationSchema } from '../../../schemas/centre-formations.js';
import { FormateurSchema } from '../../../schemas/formateurs.js';
import { ReferentSchema } from '../../../schemas/referents-repository.js';
import { SessionCandidatSchema } from '../../../schemas/session-candidats.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    '/:id',
    {
      preHandler: [fastify.guards.requireRightProfile()],
      schema: {
        params: Type.Object({
          id: Type.Number()
        }),
        response: {
          200: Type.Object({
            sessionCandidate: SessionCandidatSchema,
            formateur: FormateurSchema,
            centreFormation: CentreFormationSchema,
            allReferentApparitions: Type.Array(ReferentSchema)
          }),
          404: Type.Object({ message: Type.String() })
        },
        tags: ['Referent']
      }
    },
    async (request, reply) => {
      const { id } = request.params;

      const sessionCandidateData = await fastify.sessionCandidatsService.retrieveSessionCandidateData(id);

        return reply.send(sessionCandidateData);
    }
);
};

export default plugin;