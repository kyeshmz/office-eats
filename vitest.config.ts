import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrations = await readD1Migrations(path.join(import.meta.dirname, "migrations"));
      return {
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            // Test-only binding so ./test/setup.ts can apply migrations to the isolated D1.
            TEST_MIGRATIONS: migrations,
            // The real password is a Worker secret and a gitignored .dev.vars entry,
            // so tests supply their own. Tests read it back off env rather than
            // hardcoding it, and so stay correct if this value changes.
            POST_PASSWORD: "test-only-password",
          },
        },
      };
    }),
  ],
  test: {
    include: ["test/**/*.test.ts", "src/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
  },
});
