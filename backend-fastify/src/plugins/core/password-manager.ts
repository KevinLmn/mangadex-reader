import fp from "fastify-plugin";
import bcrypt from "bcrypt";

export interface PasswordManager {}

declare module "fastify" {
  export interface FastifyInstance {
    passwordManager: PasswordManager;
  }
}

export function createPasswordManager(): PasswordManager       {
  return {
    async bcryptHash(value: string): Promise<string> {
      return bcrypt.hash(value, 12);
    },
    async bcryptCompare(value: string, hash: string): Promise<boolean> {
      return bcrypt.compare(value, hash);
    },
  } as const;
}

export default fp(
  async (fastify) => {
    fastify.decorate("passwordManager", createPasswordManager());
  },
  {
    name: "password-manager",
  }
);
