import { EventEmitter } from "node:events";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const serverUrl = pathToFileURL(path.resolve(process.cwd(), "scripts", "start-playwright-dev-server.mjs"));

interface DevServerModule {
  parsePlaywrightDevServerPort(args: string[]): number;
  resolvePlaywrightDevDistDir(value?: string): string;
  startPlaywrightDevServer(options: Record<string, unknown>): Promise<{ close(): Promise<void> }>;
}

interface GlobalSetupModule {
  createPlaywrightGlobalSetup(
    options: Record<string, unknown>
  ): (config: Record<string, unknown>) => Promise<() => Promise<void>>;
}

class FakeHttpServer extends EventEmitter {
  listening = false;
  closeAllConnections = vi.fn();

  listen(_port: number, _hostname: string, callback: () => void) {
    this.listening = true;
    callback();
  }

  close(callback: (error?: Error) => void) {
    this.listening = false;
    callback();
  }
}

describe("managed Playwright Next dev server", () => {
  it("validates the port and runner-owned build directory", async () => {
    const serverModule = (await import(serverUrl.href)) as DevServerModule;

    expect(serverModule.parsePlaywrightDevServerPort(["--port", "43123"])).toBe(43_123);
    expect(serverModule.resolvePlaywrightDevDistDir(".next/playwright-12345")).toBe(".next/playwright-12345");
    for (const args of [[], ["--port", "0"], ["--port", "65536"], ["--port", "1.5"]]) {
      expect(() => serverModule.parsePlaywrightDevServerPort(args)).toThrow(/integer from 1 to 65535/);
    }
    expect(() => serverModule.resolvePlaywrightDevDistDir("../outside")).toThrow(/positive runner PID/);
  });

  it("closes the HTTP server and Next app before removing its isolated build directory", async () => {
    const { startPlaywrightDevServer } = (await import(serverUrl.href)) as DevServerModule;
    const httpServer = new FakeHttpServer();
    const app = {
      prepare: vi.fn().mockResolvedValue(undefined),
      getRequestHandler: vi.fn(() => vi.fn()),
      getUpgradeHandler: vi.fn(() => vi.fn()),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const removeDirectory = vi.fn().mockResolvedValue(undefined);
    const nextFactory = vi.fn(() => app);

    const controller = await startPlaywrightDevServer({
      port: 43_123,
      distDir: ".next/playwright-12345",
      rootDirectory: path.resolve("workspace"),
      nextFactory,
      createHttpServer: vi.fn(() => httpServer),
      removeDirectory,
      logger: { log: vi.fn() },
    });
    expect(app.prepare).toHaveBeenCalledOnce();
    expect(httpServer.listening).toBe(true);
    expect(removeDirectory).toHaveBeenCalledOnce();

    await controller.close();
    await controller.close();
    expect(httpServer.closeAllConnections).toHaveBeenCalledOnce();
    expect(app.close).toHaveBeenCalledOnce();
    expect(removeDirectory).toHaveBeenCalledTimes(2);
  });

  it("returns an idempotent teardown and skips startup only for an available opted-in server", async () => {
    const setupUrl = pathToFileURL(path.resolve(process.cwd(), "scripts", "playwright-global-setup.mjs"));
    const { createPlaywrightGlobalSetup } = (await import(setupUrl.href)) as GlobalSetupModule;
    const close = vi.fn().mockResolvedValue(undefined);
    const startServer = vi.fn().mockResolvedValue({ close });
    const metadata = {
      playwrightE2e: {
        baseURL: "http://localhost:43123",
        distDir: ".next/playwright-12345",
        port: 43_123,
        reuseExistingServer: false,
      },
    };
    const setup = createPlaywrightGlobalSetup({ startServer, fetchImpl: vi.fn() });

    const teardown = await setup({ metadata });
    expect(process.env.PLAYWRIGHT_TEST_BASE_URL).toBe("http://localhost:43123");
    await teardown();
    await teardown();
    expect(process.env.PLAYWRIGHT_TEST_BASE_URL).toBeUndefined();
    expect(startServer).toHaveBeenCalledWith({ port: 43_123, distDir: ".next/playwright-12345" });
    expect(close).toHaveBeenCalledOnce();

    const fetchImpl = vi.fn().mockResolvedValue({ status: 200, body: { cancel: vi.fn() } });
    const reuseSetup = createPlaywrightGlobalSetup({ startServer, fetchImpl });
    const reuseTeardown = await reuseSetup({
      metadata: {
        playwrightE2e: { ...metadata.playwrightE2e, reuseExistingServer: true },
      },
    });
    expect(process.env.PLAYWRIGHT_TEST_BASE_URL).toBe("http://localhost:43123");
    await reuseTeardown();
    expect(process.env.PLAYWRIGHT_TEST_BASE_URL).toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(startServer).toHaveBeenCalledTimes(1);
  });
});
