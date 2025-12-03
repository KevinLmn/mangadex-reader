import env from '@fastify/env';

declare module 'fastify' {
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
      FRONTEND_URL: string;
      REDIS_HOST: string;
      REDIS_PORT: number;
      REDIS_PASSWORD: string;
      POSTGRES_HOST: string;
      POSTGRES_PORT: number;
      POSTGRES_USER: string;
      POSTGRES_PASSWORD: string;
      POSTGRES_DATABASE: string;
      COOKIE_SECRET: string;
      COOKIE_NAME: string;
      COOKIE_SECURED: boolean;
      RATE_LIMIT_MAX: number;
      JWT_SECRET: string;
    }
  }
}

// Schema for environment variable validation
export const schema = {
  type: 'object',
  required: [
    'DATABASE_URL',
    'PORT',
    'MANGADEX_USERNAME',
    'MANGADEX_PASSWORD',
    'MANGADEX_CLIENT_ID',
    'MANGADEX_CLIENT_SECRET',
    'MANGADEX_BASE_URL',
    'MANGADEX_REFRESH_TOKEN_URL',
    'FRONTEND_URL',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
    'POSTGRES_HOST',
    'POSTGRES_PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DATABASE',
    'COOKIE_SECRET',
    'COOKIE_NAME',
    'COOKIE_SECURED',
    'JWT_SECRET',
  ],
  properties: {
    // Database
    DATABASE_URL: {
      type: 'string',
      default: 'localhost'
    },
    PORT: {
      type: 'number',
      default: 3306
    },
    MANGADEX_USERNAME: {
      type: 'string'
    },
    MANGADEX_PASSWORD: {
      type: 'string'
    },
    MANGADEX_CLIENT_ID: {
      type: 'string'
    },
    MANGADEX_CLIENT_SECRET: {
      type: 'string'
    },
    MANGADEX_BASE_URL: {
      type: 'string'
    },
    MANGADEX_REFRESH_TOKEN_URL: {
      type: 'string'
    },
    FRONTEND_URL: {
      type: 'string'
    },
    REDIS_HOST: {
      type: 'string'
    },
    REDIS_PORT: {
      type: 'number'
    },
    REDIS_PASSWORD: {
      type: 'string'
    },
    POSTGRES_HOST: {
      type: 'string'
    },
    POSTGRES_PORT: {
      type: 'number'
    },
    POSTGRES_USER: {
      type: 'string'
    },
    POSTGRES_PASSWORD: {
      type: 'string'
    },
    POSTGRES_DATABASE: {
      type: 'string'
    },
    COOKIE_SECRET: {
      type: 'string',
    },
    COOKIE_NAME: {
      type: 'string'
    },
    COOKIE_SECURED: {
      type: 'boolean'
    },
    JWT_SECRET: {
      type: 'string'
    },
    RATE_LIMIT_MAX: {
      type: 'number',
      default: 100
    },
  }
};
export const autoConfig = {
    confKey: 'config',
    schema,
    dotenv: true,
    data: process.env
};

export default env; 