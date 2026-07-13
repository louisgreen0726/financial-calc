import { rmSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "playwright/test";
import { resolveChromiumLaunchOptions, type ChromiumResolverOptions } from "./scripts/resolve-playwright-browser";

interface BrowserConfigRuntimeOptions {
  environment?: Record<string, string | undefined>;
  pid?: number;
}

const distDirsToCleanup = new Set<string>();
let cleanupRegistered = false;

function scheduleDistDirCleanup(distDir: string) {
  distDirsToCleanup.add(path.resolve(distDir));
  if (cleanupRegistered) return;
  cleanupRegistered = true;
  process.once("exit", () => {
    for (const directory of distDirsToCleanup) {
      try {
        rmSync(directory, { recursive: true, force: true, maxRetries: 5 });
      } catch {
        // Normal teardown reports cleanup failures; this crash fallback must preserve the original exit status.
      }
    }
  });
}

export function resolvePlaywrightDistDir(pid = process.pid) {
  if (!Number.isSafeInteger(pid) || pid < 1) {
    throw new Error("The Playwright runner PID must be a positive integer.");
  }
  return `.next/playwright-${pid}`;
}

export function resolvePlaywrightE2ePort({
  environment = process.env,
  pid = process.pid,
}: BrowserConfigRuntimeOptions = {}) {
  const explicitPort = environment.PLAYWRIGHT_E2E_PORT;
  if (explicitPort !== undefined) {
    if (!/^\d+$/.test(explicitPort)) {
      throw new Error("PLAYWRIGHT_E2E_PORT must be an integer from 1 to 65535.");
    }
    const port = Number(explicitPort);
    if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
      throw new Error("PLAYWRIGHT_E2E_PORT must be an integer from 1 to 65535.");
    }
    return port;
  }

  if (environment.CI) return 3000;
  resolvePlaywrightDistDir(pid);
  return 10_000 + (pid % 50_000);
}

export function createBrowserConfig(
  browserResolverOptions?: ChromiumResolverOptions,
  runtimeOptions: BrowserConfigRuntimeOptions = {}
) {
  const environment = runtimeOptions.environment ?? process.env;
  const pid = runtimeOptions.pid ?? process.pid;
  const isCI = Boolean(environment.CI);
  const port = resolvePlaywrightE2ePort({ environment, pid });
  const distDir = resolvePlaywrightDistDir(pid);
  const baseURL = `http://localhost:${port}`;
  const reuseExistingServer = environment.PLAYWRIGHT_REUSE_EXISTING_SERVER === "1";
  const launchOptions = resolveChromiumLaunchOptions(browserResolverOptions);
  scheduleDistDirCleanup(distDir);

  return defineConfig({
    globalSetup: "./scripts/playwright-global-setup.mjs",
    metadata: {
      playwrightE2e: { baseURL, distDir, port, reuseExistingServer },
    },
    testDir: "./e2e",
    testIgnore: "pwa-offline.spec.ts",
    timeout: 90_000,
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 1 : 2,
    reporter: isCI ? "github" : "list",
    use: {
      permissions: ["clipboard-read", "clipboard-write"],
      screenshot: "only-on-failure",
      trace: "retain-on-failure",
      ...(launchOptions ? { launchOptions } : {}),
    },
  });
}

export default createBrowserConfig();
