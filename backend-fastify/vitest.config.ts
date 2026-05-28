import { defineConfig } from "vitest/config";
import fs from "node:fs";
import path from "node:path";

const stripJsExtPlugin = {
  name: "strip-js-ext",
  enforce: "pre" as const,
  async resolveId(source: string, importer: string | undefined) {
    if (!importer || !source.endsWith(".js")) return null;
    if (!source.startsWith(".") && !source.startsWith("/")) return null;
    const base = source.slice(0, -3);
    const candidate = path.resolve(path.dirname(importer), base + ".ts");
    if (fs.existsSync(candidate)) return candidate;
    return null;
  },
};

export default defineConfig({
  plugins: [stripJsExtPlugin],
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/helpers/setup.ts"],
    pool: "forks",
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 20_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/routes/api/auth/**/*.ts",
        "src/routes/api/favorites/**/*.ts",
        "src/routes/api/progress/**/*.ts",
        "src/routes/api/search/**/*.ts",
        "src/routes/api/refresh-token/**/*.ts",
        "src/routes/api/manga/index.ts",
        "src/plugins/core/password-manager.ts",
        "src/plugins/core/prisma.ts",
        "src/plugins/core/redis.ts",
      ],
      exclude: ["src/scripts/**", "**/*.d.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});
