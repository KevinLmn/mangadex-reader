import env from "@fastify/env";

declare module "fastify" {
  export interface FastifyInstance {
    config: {
      DATABASE_URL: string;
      PORT: number;
      MANGADEX_USERNAME: string;
      MANGADEX_PASSWORD: string;
      MANGADEX_CLIENT_ID: string;
      MANGADEX_CLIENT_SECRET: string;
      MANGADEX_BASE_URL: string;
      MANGADEX_REFRESH_TOKEN_URL: string;
      FRONT_END_URL: string;
      REDIS_HOST: string;
      REDIS_PORT: number;
      REDIS_PASSWORD: string;
      COOKIE_SECRET: string;
      COOKIE_NAME: string;
      COOKIE_SECURED: boolean;
      RATE_LIMIT_MAX: number;
      JWT_SECRET: string;
    };
  }
}

// Schema for environment variable validation
export const schema = {
  type: "object",
  required: [
    "DATABASE_URL",
    "MANGADEX_USERNAME",
    "MANGADEX_PASSWORD",
    "MANGADEX_CLIENT_ID",
    "MANGADEX_CLIENT_SECRET",
    "MANGADEX_BASE_URL",
    "MANGADEX_REFRESH_TOKEN_URL",
    "FRONT_END_URL",
    "REDIS_HOST",
    "REDIS_PORT",
    "COOKIE_SECRET",
    "JWT_SECRET",
  ],
  properties: {
    DATABASE_URL: {
      type: "string",
    },
    PORT: {
      type: "number",
      default: 3012,
    },
    MANGADEX_USERNAME: {
      type: "string",
    },
    MANGADEX_PASSWORD: {
      type: "string",
    },
    MANGADEX_CLIENT_ID: {
      type: "string",
    },
    MANGADEX_CLIENT_SECRET: {
      type: "string",
    },
    MANGADEX_BASE_URL: {
      type: "string",
    },
    MANGADEX_REFRESH_TOKEN_URL: {
      type: "string",
    },
    FRONT_END_URL: {
      type: "string",
    },
    REDIS_HOST: {
      type: "string",
    },
    REDIS_PORT: {
      type: "number",
      default: 6379,
    },
    REDIS_PASSWORD: {
      type: "string",
      default: "",
    },
    COOKIE_SECRET: {
      type: "string",
    },
    COOKIE_NAME: {
      type: "string",
      default: "session",
    },
    COOKIE_SECURED: {
      type: "boolean",
      default: false,
    },
    JWT_SECRET: {
      type: "string",
    },
    RATE_LIMIT_MAX: {
      type: "number",
      default: 100,
    },
  },
};

export const autoConfig = {
  confKey: "config",
  schema,
  dotenv: true,
  data: process.env,
};

export default env;
