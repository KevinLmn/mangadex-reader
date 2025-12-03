import { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: number;
      type?: 'access' | 'refresh';
      profil?: number;
      Id?: number;
    };  // payload before verification
    user: {
      sub: number;
      type?: 'access' | 'refresh';
      Id: number;
      iat: number;
      exp: number;
    }; // payload after verification
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    issueAccessToken(sub: number, extra?: object): string;
    issueRefreshToken(sub: number, extra?: object): string;
    verifyAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async (app) => {
  app.decorate('issueAccessToken', (sub: number, extra: object) =>
    app.jwt.sign({ sub, type: 'access', ...extra }, { expiresIn: '15m', aud: 'access' })
  );

  app.decorate('issueRefreshToken', (sub: number, extra: object) =>
    app.jwt.sign({ sub, type: 'refresh', ...extra }, { expiresIn: '30d', aud: 'refresh' })
  );

  app.decorate('verifyAuth', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify({ allowedAud: 'access' });
    } catch {
      return reply.unauthorized();
    }
  });
});