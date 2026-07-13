import { describe, expect, it } from "vitest";

import { createBrowserConfig } from "../../playwright.config";

function getWebServer(config: ReturnType<typeof createBrowserConfig>) {
  if (!config.webServer || Array.isArray(config.webServer)) {
    throw new Error("Expected one browser web server configuration.");
  }
  return config.webServer;
}

describe("Playwright browser configuration", () => {
  it("starts Next directly through Node so Windows teardown owns the dev-server process", () => {
    const webServer = getWebServer(createBrowserConfig());

    expect(webServer.command).toBe("node node_modules/next/dist/bin/next dev --webpack");
    expect(webServer.command).not.toMatch(/\bnpm(?:\.cmd)?\b/i);
    expect(webServer).toMatchObject({
      url: "http://localhost:3000",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    });
  });
});
