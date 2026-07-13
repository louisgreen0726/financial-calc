import { defineConfig } from "playwright/test";
import { resolveChromiumLaunchOptions, type ChromiumResolverOptions } from "./scripts/resolve-playwright-browser";

export function createBrowserConfig(browserResolverOptions?: ChromiumResolverOptions) {
  const launchOptions = resolveChromiumLaunchOptions(browserResolverOptions);

  return defineConfig({
    testDir: "./e2e",
    testIgnore: "pwa-offline.spec.ts",
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 2,
    reporter: process.env.CI ? "github" : "list",
    use: {
      baseURL: "http://localhost:3000",
      permissions: ["clipboard-read", "clipboard-write"],
      screenshot: "only-on-failure",
      trace: "retain-on-failure",
      ...(launchOptions ? { launchOptions } : {}),
    },
    webServer: {
      command: "node node_modules/next/dist/bin/next dev --webpack",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  });
}

export default createBrowserConfig();
