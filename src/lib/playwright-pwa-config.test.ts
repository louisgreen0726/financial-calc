import { describe, expect, it } from "vitest";

import { createPwaConfig } from "../../playwright.pwa.config";

function getWebServer(config: ReturnType<typeof createPwaConfig>) {
  if (!config.webServer || Array.isArray(config.webServer)) {
    throw new Error("Expected one PWA web server configuration.");
  }
  return config.webServer;
}

function restoreEnvironmentVariable(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

describe("PWA Playwright configuration", () => {
  it("builds the static export by default", () => {
    const previousSkipBuild = process.env.PWA_SKIP_BUILD;
    const previousBasePath = process.env.PWA_BASE_PATH;
    delete process.env.PWA_SKIP_BUILD;

    try {
      expect(getWebServer(createPwaConfig()).command).toBe("npm run build && node scripts/serve-pwa-e2e.mjs");
    } finally {
      restoreEnvironmentVariable("PWA_SKIP_BUILD", previousSkipBuild);
      restoreEnvironmentVariable("PWA_BASE_PATH", previousBasePath);
    }
  });

  it("serves a prebuilt artifact only when CI opts in", () => {
    const previousSkipBuild = process.env.PWA_SKIP_BUILD;
    const previousBasePath = process.env.PWA_BASE_PATH;
    process.env.PWA_SKIP_BUILD = "1";

    try {
      const webServer = getWebServer(createPwaConfig("/calc"));
      expect(webServer.command).toBe("node scripts/serve-pwa-e2e.mjs");
      expect(webServer.env).toMatchObject({
        NEXT_PUBLIC_BASE_PATH: "/calc",
        PWA_BASE_PATH: "/calc",
      });
    } finally {
      restoreEnvironmentVariable("PWA_SKIP_BUILD", previousSkipBuild);
      restoreEnvironmentVariable("PWA_BASE_PATH", previousBasePath);
    }
  });
});
