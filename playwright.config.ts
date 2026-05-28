import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_FRONTEND_URL ?? "http://localhost:3011",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : [
        {
          command: "pnpm --filter mangadex-reader-backend exec node dist/server.js",
          url: "http://localhost:3022/healthz",
          reuseExistingServer: !process.env.CI,
          stdout: "ignore",
          stderr: "pipe",
          timeout: 120_000,
          env: {
            DATABASE_URL:
              "postgresql://kevin:password@localhost:5435/manga_test",
            REDIS_HOST: "localhost",
            REDIS_PORT: "6379",
            REDIS_PASSWORD: "",
            JWT_SECRET: "e2e-jwt-secret-must-be-long-enough-32chars",
            COOKIE_SECRET: "e2e-cookie-secret-must-be-long-enough-32chars",
            COOKIE_NAME: "session",
            COOKIE_SECURED: "false",
            FRONT_END_URL: "http://localhost:3011",
            MANGADEX_USERNAME: "noop",
            MANGADEX_PASSWORD: "noop",
            MANGADEX_CLIENT_ID: "noop",
            MANGADEX_CLIENT_SECRET: "noop",
            MANGADEX_BASE_URL: "https://api.mangadex.org",
            MANGADEX_REFRESH_TOKEN_URL:
              "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token",
            PORT: "3022",
            LOG_LEVEL: "warn",
          },
        },
        {
          command: "pnpm --filter mangadex-reader-frontend dev",
          url: "http://localhost:3011",
          reuseExistingServer: !process.env.CI,
          stdout: "ignore",
          stderr: "pipe",
          timeout: 180_000,
          env: {
            NEXT_PUBLIC_API_URL: "http://localhost:3022",
            NEXT_PUBLIC_FRONT_END_URL: "http://localhost:3011",
          },
        },
      ],
});
