import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { Prisma } from "@prisma/client";
import {
  AuthCredentials,
  AuthErrorResponse,
  AuthSuccessResponse,
  AuthUser,
} from "@manga/shared-types";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  // Register
  fastify.post(
    "/register",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "15 minutes",
          keyGenerator: (req) =>
            (req.body as { email?: string } | undefined)?.email ?? req.ip,
        },
      },
      schema: {
        body: AuthCredentials,
        response: {
          201: AuthSuccessResponse,
          400: AuthErrorResponse,
        },
        tags: ["Auth"],
        summary: "Register a new user",
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const existingUser = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.status(400).send({ error: "Email already registered" });
      }

      const hashedPassword = await fastify.passwordManager.bcryptHash(password);

      try {
        const user = await fastify.prisma.user.create({
          data: {
            email,
            password: hashedPassword,
          },
        });

        const token = fastify.jwt.sign({ userId: user.id, email: user.email });

        return reply.status(201).send({
          user: { id: user.id, email: user.email },
          token,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return reply.status(400).send({ error: "Email already registered" });
        }
        throw error;
      }
    }
  );

  // Login
  fastify.post(
    "/login",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "15 minutes",
          keyGenerator: (req) =>
            (req.body as { email?: string } | undefined)?.email ?? req.ip,
        },
      },
      schema: {
        body: AuthCredentials,
        response: {
          200: AuthSuccessResponse,
          401: AuthErrorResponse,
          423: Type.Object({
            error: Type.String(),
            retryAfter: Type.Integer(),
          }),
        },
        tags: ["Auth"],
        summary: "Login user",
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.status(401).send({ error: "Invalid email or password" });
      }

      if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
        const retryAfter = Math.ceil(
          (user.lockedUntil.getTime() - Date.now()) / 1000
        );
        reply.header("Retry-After", retryAfter);
        return reply.status(423).send({
          error: "Account temporarily locked due to too many failed attempts",
          retryAfter,
        });
      }

      const validPassword = await fastify.passwordManager.bcryptCompare(
        password,
        user.password
      );

      if (!validPassword) {
        const nextAttempts = user.failedLoginAttempts + 1;
        const shouldLock = nextAttempts >= MAX_FAILED_ATTEMPTS;
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: shouldLock ? 0 : nextAttempts,
            lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : null,
          },
        });
        return reply.status(401).send({ error: "Invalid email or password" });
      }

      if (user.failedLoginAttempts > 0 || user.lockedUntil) {
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        });
      }

      const token = fastify.jwt.sign({ userId: user.id, email: user.email });

      return reply.status(200).send({
        user: { id: user.id, email: user.email },
        token,
      });
    }
  );

  // Get current user
  fastify.get(
    "/me",
    {
      schema: {
        response: {
          200: AuthUser,
          401: AuthErrorResponse,
        },
        tags: ["Auth"],
        summary: "Get current user",
      },
      onRequest: [async (request) => await request.jwtVerify()],
    },
    async (request, reply) => {
      const { userId } = request.user as { userId: string };

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.status(401).send({ error: "User not found" });
      }

      return { id: user.id, email: user.email };
    }
  );
};

export default plugin;
