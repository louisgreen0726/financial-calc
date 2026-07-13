import { describe, expect, it } from "vitest";

import { resolveNextDistDir, resolveNextTypeScriptConfigPath } from "../../next.config";
import { createBrowserConfig, resolvePlaywrightDistDir, resolvePlaywrightE2ePort } from "../../playwright.config";

const browserResolverOptions = {
  bundledExecutablePath: "/missing/chromium",
  cwd: "/workspace",
  environment: { CI: "1" },
  homeDirectory: "/home/tester",
  platform: "linux",
  isExecutableFile: () => false,
} as const;

function getWebServer(config: ReturnType<typeof createBrowserConfig>) {
  const settings = config.metadata?.playwrightE2e;
  if (!settings || typeof settings !== "object") {
    throw new Error("Expected Playwright E2E server metadata.");
  }
  return settings as {
    baseURL: string;
    distDir: string;
    port: number;
    reuseExistingServer: boolean;
  };
}

describe("Playwright browser configuration", () => {
  it("derives an isolated high port from the local runner PID", () => {
    const config = createBrowserConfig(browserResolverOptions, { environment: {}, pid: 12_345 });
    const server = getWebServer(config);

    expect(resolvePlaywrightE2ePort({ environment: {}, pid: 12_345 })).toBe(22_345);
    expect(resolvePlaywrightE2ePort({ environment: {}, pid: 50_001 })).toBe(10_001);
    expect(resolvePlaywrightDistDir(12_345)).toBe(".next/playwright-12345");
    expect(config.globalSetup).toBe("./scripts/playwright-global-setup.mjs");
    expect(config.webServer).toBeUndefined();
    expect(config.workers).toBe(2);
    expect(config.timeout).toBe(90_000);
    expect(server).toMatchObject({
      baseURL: "http://localhost:22345",
      distDir: ".next/playwright-12345",
      port: 22_345,
      reuseExistingServer: false,
    });
    expect(config.use?.baseURL).toBeUndefined();
  });

  it("uses port 3000 for CI by default", () => {
    const config = createBrowserConfig(browserResolverOptions, { environment: { CI: "1" }, pid: 12_345 });
    const server = getWebServer(config);

    expect(server.port).toBe(3000);
    expect(server.baseURL).toBe("http://localhost:3000");
    expect(config.use?.baseURL).toBeUndefined();
    expect(server.reuseExistingServer).toBe(false);
    expect(config.workers).toBe(1);
  });

  it("honors a valid explicit port and only reuses a server by explicit opt-in", () => {
    const environment = {
      CI: "1",
      PLAYWRIGHT_E2E_PORT: "43123",
      PLAYWRIGHT_REUSE_EXISTING_SERVER: "1",
    };
    const config = createBrowserConfig(browserResolverOptions, { environment, pid: 12_345 });
    const server = getWebServer(config);

    expect(resolvePlaywrightE2ePort({ environment, pid: 12_345 })).toBe(43_123);
    expect(server.port).toBe(43_123);
    expect(server.baseURL).toBe("http://localhost:43123");
    expect(config.use?.baseURL).toBeUndefined();
    expect(server.reuseExistingServer).toBe(true);
  });

  it.each(["", "0", "65536", "1.5", " 3000 ", "-1", "NaN"])("rejects invalid explicit port %j", (explicitPort) => {
    expect(() => resolvePlaywrightE2ePort({ environment: { PLAYWRIGHT_E2E_PORT: explicitPort }, pid: 12_345 })).toThrow(
      /integer from 1 to 65535/
    );
  });

  it("does not reuse an existing server for non-opt-in values", () => {
    const server = getWebServer(
      createBrowserConfig(browserResolverOptions, {
        environment: { PLAYWRIGHT_REUSE_EXISTING_SERVER: "true" },
        pid: 12_345,
      })
    );

    expect(server.reuseExistingServer).toBe(false);
  });

  it("only accepts the runner-scoped relative Next build directory", () => {
    expect(resolveNextDistDir()).toBeUndefined();
    expect(resolveNextDistDir(".next/playwright-12345")).toBe(".next/playwright-12345");
    expect(resolveNextTypeScriptConfigPath()).toBeUndefined();
    expect(resolveNextTypeScriptConfigPath(".next/playwright-12345")).toBe("tsconfig.playwright.json");
    for (const invalid of [
      ".next/playwright-0",
      ".next/playwright-current",
      ".next/../outside",
      "../.next/playwright-12345",
      "C:\\tmp\\playwright-12345",
    ]) {
      expect(() => resolveNextDistDir(invalid)).toThrow(/positive runner PID/);
    }
  });
});
