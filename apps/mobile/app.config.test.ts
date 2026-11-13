import { DEFAULT_HOSTED_APP_URL } from "@t3tools/shared/connectAuth";
import { afterEach, expect, it, vi } from "vite-plus/test";

// Keep config parsing independent of local env files and build credentials.
vi.mock("../../scripts/lib/public-config.ts", () => ({
  loadRepoEnv: () => ({ APP_VARIANT: process.env.APP_VARIANT }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

async function loadConfig(variant: string | undefined) {
  vi.resetModules();
  vi.stubEnv("APP_VARIANT", variant);
  return (await import("./app.config.ts")).default;
}

it.each(["prod", ""])("rejects APP_VARIANT=%j before selecting production IDs", async (value) => {
  await expect(loadConfig(value)).rejects.toThrow(
    "APP_VARIANT must be development, preview, or production.",
  );
});

// AlgoAI for SysOps: its own identifiers, and no links from T3's hosted app (app.t3.codes).
it.each([
  [undefined, "it.algorime.algoai.sysops"],
  ["development", "it.algorime.algoai.sysops.dev"],
  ["preview", "it.algorime.algoai.sysops.preview"],
  ["production", "it.algorime.algoai.sysops"],
])("uses the AlgoAI for SysOps identifiers for APP_VARIANT=%j", async (value, identifier) => {
  const config = await loadConfig(value);
  expect(config.ios?.bundleIdentifier).toBe(identifier);
  expect(config.android?.package).toBe(identifier);
  const host = new URL(DEFAULT_HOSTED_APP_URL).host;
  expect(config.ios?.associatedDomains).not.toContain(`applinks:${host}`);
  expect(config.android?.intentFilters).toBeUndefined();
  expect(config.updates?.enabled).toBe(false);
});
