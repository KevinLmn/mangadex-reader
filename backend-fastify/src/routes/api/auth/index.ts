import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  // Register
  fastify.post(
    "/register",
    {
      schema: {
        body: Type.Object({
          email: Type.String({ format: "email" }),
          password: Type.String({ minLength: 6 }),
        }),
        response: {
          201: Type.Object({
            user: Type.Object({
              id: Type.String(),
              email: Type.String(),
            }),
            token: Type.String(),
          }),
          400: Type.Object({
            error: Type.String(),
          }),
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
    }
  );

  // Login
  fastify.post(
    "/login",
    {
      schema: {
        body: Type.Object({
          email: Type.String({ format: "email" }),
          password: Type.String(),
        }),
        response: {
          200: Type.Object({
            user: Type.Object({
              id: Type.String(),
              email: Type.String(),
            }),
            token: Type.String(),
          }),
          401: Type.Object({
            error: Type.String(),
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

      const validPassword = await fastify.passwordManager.bcryptCompare(
        password,
        user.password
      );

      if (!validPassword) {
        return reply.status(401).send({ error: "Invalid email or password" });
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
          200: Type.Object({
            id: Type.String(),
            email: Type.String(),
          }),
          401: Type.Object({
            error: Type.String(),
          }),
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
