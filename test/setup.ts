import type { D1Migration } from "@cloudflare/vitest-pool-workers";
import { applyD1Migrations, env } from "cloudflare:test";

// TEST_MIGRATIONS is a test-only binding injected by vitest.config.ts; it is not part of the Worker's Env.
const migrations = (env as unknown as { TEST_MIGRATIONS: D1Migration[] }).TEST_MIGRATIONS;

// Applies every migration in ./migrations to the isolated per-test D1 instance.
await applyD1Migrations(env.DB, migrations);
