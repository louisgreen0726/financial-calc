import { startPlaywrightDevServer } from "./start-playwright-dev-server.mjs";

function readManagedServerSettings(config) {
  const settings = config.metadata?.playwrightE2e;
  if (
    !settings ||
    typeof settings !== "object" ||
    !Number.isSafeInteger(settings.port) ||
    settings.port < 1 ||
    settings.port > 65_535 ||
    typeof settings.baseURL !== "string" ||
    typeof settings.distDir !== "string" ||
    typeof settings.reuseExistingServer !== "boolean"
  ) {
    throw new Error("Playwright E2E server metadata is missing or invalid.");
  }
  return settings;
}

async function isServerAvailable(baseURL, fetchImpl) {
  try {
    const response = await fetchImpl(baseURL, { signal: AbortSignal.timeout(2_000) });
    await response.body?.cancel();
    return response.status < 500;
  } catch {
    return false;
  }
}

export function createPlaywrightGlobalSetup({
  startServer = startPlaywrightDevServer,
  fetchImpl = globalThis.fetch,
} = {}) {
  return async function playwrightGlobalSetup(config) {
    const settings = readManagedServerSettings(config);
    if (settings.reuseExistingServer && (await isServerAvailable(settings.baseURL, fetchImpl))) {
      const previousBaseURL = process.env.PLAYWRIGHT_TEST_BASE_URL;
      process.env.PLAYWRIGHT_TEST_BASE_URL = settings.baseURL;
      return async () => {
        if (previousBaseURL === undefined) delete process.env.PLAYWRIGHT_TEST_BASE_URL;
        else process.env.PLAYWRIGHT_TEST_BASE_URL = previousBaseURL;
      };
    }

    const previousDistDir = process.env.NEXT_DIST_DIR;
    const previousBaseURL = process.env.PLAYWRIGHT_TEST_BASE_URL;
    process.env.NEXT_DIST_DIR = settings.distDir;
    process.env.PLAYWRIGHT_TEST_BASE_URL = settings.baseURL;
    let controller;
    try {
      controller = await startServer({ port: settings.port, distDir: settings.distDir });
    } catch (error) {
      if (previousDistDir === undefined) delete process.env.NEXT_DIST_DIR;
      else process.env.NEXT_DIST_DIR = previousDistDir;
      if (previousBaseURL === undefined) delete process.env.PLAYWRIGHT_TEST_BASE_URL;
      else process.env.PLAYWRIGHT_TEST_BASE_URL = previousBaseURL;
      throw new Error(`Unable to start the Playwright dev server at ${settings.baseURL}.`, { cause: error });
    }

    let teardownPromise;
    return async () => {
      teardownPromise ??= (async () => {
        try {
          await controller.close();
        } finally {
          if (previousDistDir === undefined) delete process.env.NEXT_DIST_DIR;
          else process.env.NEXT_DIST_DIR = previousDistDir;
          if (previousBaseURL === undefined) delete process.env.PLAYWRIGHT_TEST_BASE_URL;
          else process.env.PLAYWRIGHT_TEST_BASE_URL = previousBaseURL;
        }
      })();
      return teardownPromise;
    };
  };
}

export default createPlaywrightGlobalSetup();
