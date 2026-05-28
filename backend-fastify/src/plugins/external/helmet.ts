import helmet from "@fastify/helmet";
import { FastifyInstance } from "fastify";

/**
 * Helmet with an explicit security posture:
 *  - CSP allow-lists the external origins we actually use.
 *  - HSTS forces HTTPS for 1 year (includeSubDomains + preload).
 *  - CORP "cross-origin" because the frontend (different port in dev) loads
 *    images served by /api/proxy/image.
 */
export const autoConfig = (fastify: FastifyInstance) => ({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://uploads.mangadex.org",
        fastify.config.FRONT_END_URL,
      ],
      connectSrc: [
        "'self'",
        "https://api.mangadex.org",
        "https://uploads.mangadex.org",
      ],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  strictTransportSecurity: {
    maxAge: 60 * 60 * 24 * 365,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

/**
 * @see {@link https://github.com/fastify/fastify-helmet}
 */
export default helmet;
