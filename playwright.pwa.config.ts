import { defineConfig } from "playwright/test";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

function normalizeBasePath(value: string): string {
  if (!value) return "";
  if (!value.startsWith("/") || value === "/" || value.endsWith("/")) {
    throw new Error(`Invalid PWA test base path: ${value}`);
  }
  return value;
}

export function createPwaConfig(configuredBasePath = "") {
  const basePath = normalizeBasePath(configuredBasePath);
  const skipBuild = process.env.PWA_SKIP_BUILD === "1";
  process.env.PWA_BASE_PATH = basePath;

  return defineConfig({
    testDir: "./e2e",
    testMatch: "pwa-offline.spec.ts",
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: process.env.CI ? "github" : "list",
    timeout: 60_000,
    use: {
      baseURL: `http://localhost:3100${basePath}`,
      screenshot: "only-on-failure",
      trace: "retain-on-failure",
      serviceWorkers: "allow",
      ...(executablePath ? { launchOptions: { executablePath } } : {}),
    },
    webServer: {
      command: `${skipBuild ? "" : "npm run build && "}node scripts/serve-pwa-e2e.mjs`,
      env: {
        NEXT_PUBLIC_BASE_PATH: basePath,
        PWA_BASE_PATH: basePath,
        PORT: "3100",
      },
      url: `http://localhost:3100${basePath}/`,
      reuseExistingServer: false,
      timeout: 180_000,
    },
  });
}

export default createPwaConfig(process.env.PWA_BASE_PATH);
