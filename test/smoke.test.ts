import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("has a migrated D1 binding", async () => {
    const row = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_scaffold'").first<{ name: string }>();
    expect(row?.name).toBe("_scaffold");
  });
});
