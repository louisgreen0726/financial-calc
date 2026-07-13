import { EventEmitter } from "node:events";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const serverUrl = pathToFileURL(path.resolve(process.cwd(), "scripts", "start-playwright-dev-server.mjs"));

interface DevServerModule {
  parsePlaywrightDevServerPort(args: string[]): number;
  resolvePlaywrightDevDistDir(value?: string): string;
  startPlaywrightDevServer(options: Record<string, unknown>): Promise<{ close(): Promise<void> }>;
  terminateProcessTree(options: Record<string, unknown>): Promise<void>;
}

interface GlobalSetupModule {
  createPlaywrightGlobalSetup(
    options: Record<string, unknown>
  ): (config: Record<string, unknown>) => Promise<() => Promise<void>>;
}

class FakeChild extends EventEmitter {
  readonly stderr = new EventEmitter();
  readonly stdout = new EventEmitter();

  constructor(readonly pid: number) {
    super();
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

  it("spawns the official Next CLI and closes its process tree idempotently", async () => {
    const { startPlaywrightDevServer } = (await import(serverUrl.href)) as DevServerModule;
    const child = new FakeChild(4_321);
    const removeDirectory = vi.fn().mockResolvedValue(undefined);
    const spawnProcess = vi.fn(() => {
      queueMicrotask(() => child.stdout.emit("data", Buffer.from("Ready in 1ms\n")));
      return child;
    });
    const terminateTree = vi.fn(async () => {
      child.emit("exit", 0, null);
      child.emit("close", 0, null);
    });
    const portIsAvailable = vi.fn().mockResolvedValue(true);
    const cancel = vi.fn();

    const controller = await startPlaywrightDevServer({
      port: 43_123,
      distDir: ".next/playwright-12345",
      rootDirectory: path.resolve("workspace"),
      nextCliPath: path.resolve("workspace", "node_modules", "next", "dist", "bin", "next"),
      nodeExecutable: path.resolve("node", "node.exe"),
      environment: { TEST_ENV: "present" },
      platform: "win32",
      spawnProcess,
      fetchImpl: vi.fn().mockResolvedValue({ status: 200, body: { cancel } }),
      portIsAvailable,
      removeDirectory,
      logger: { log: vi.fn() },
      stdout: { write: vi.fn() },
      stderr: { write: vi.fn() },
      terminateTree,
    });
    expect(spawnProcess).toHaveBeenCalledWith(
      path.resolve("node", "node.exe"),
      [
        path.resolve("workspace", "node_modules", "next", "dist", "bin", "next"),
        "dev",
        "--webpack",
        "--hostname",
        "localhost",
        "--port",
        "43123",
      ],
      expect.objectContaining({
        cwd: path.resolve("workspace"),
        detached: false,
        env: { TEST_ENV: "present", NEXT_DIST_DIR: ".next/playwright-12345" },
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      })
    );
    expect(cancel).toHaveBeenCalledOnce();
    expect(removeDirectory).toHaveBeenCalledOnce();

    await controller.close();
    await controller.close();
    expect(terminateTree).toHaveBeenCalledOnce();
    expect(portIsAvailable).toHaveBeenCalledTimes(2);
    expect(removeDirectory).toHaveBeenCalledTimes(2);
  });

  it("refuses an occupied port before deleting files or spawning a server", async () => {
    const { startPlaywrightDevServer } = (await import(serverUrl.href)) as DevServerModule;
    const spawnProcess = vi.fn();
    const removeDirectory = vi.fn();

    await expect(
      startPlaywrightDevServer({
        port: 43_123,
        distDir: ".next/playwright-12345",
        rootDirectory: path.resolve("workspace"),
        portIsAvailable: vi.fn().mockResolvedValue(false),
        spawnProcess,
        removeDirectory,
      })
    ).rejects.toThrow(/already in use.*reuse it explicitly/);
    expect(spawnProcess).not.toHaveBeenCalled();
    expect(removeDirectory).not.toHaveBeenCalled();
  });

  it("fails fast when the Next CLI exits before becoming ready and still cleans the build directory", async () => {
    const { startPlaywrightDevServer } = (await import(serverUrl.href)) as DevServerModule;
    const child = new FakeChild(7_654);
    const removeDirectory = vi.fn().mockResolvedValue(undefined);
    const spawnProcess = vi.fn(() => {
      queueMicrotask(() => {
        child.emit("exit", 1, null);
        child.emit("close", 1, null);
      });
      return child;
    });

    await expect(
      startPlaywrightDevServer({
        port: 43_123,
        distDir: ".next/playwright-12345",
        rootDirectory: path.resolve("workspace"),
        spawnProcess,
        fetchImpl: vi.fn().mockResolvedValue({ status: 200, body: { cancel: vi.fn() } }),
        portIsAvailable: vi.fn().mockResolvedValue(true),
        removeDirectory,
        delay: vi.fn(() => Promise.resolve()),
        terminateTree: vi.fn(),
      })
    ).rejects.toThrow(/exited before CLI readiness.*code 1/);
    expect(removeDirectory).toHaveBeenCalledTimes(2);
  });

  it("preserves the build directory when teardown cannot release the owned port", async () => {
    const { startPlaywrightDevServer } = (await import(serverUrl.href)) as DevServerModule;
    const child = new FakeChild(4_321);
    const removeDirectory = vi.fn().mockResolvedValue(undefined);
    const portIsAvailable = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const controller = await startPlaywrightDevServer({
      port: 43_123,
      distDir: ".next/playwright-12345",
      rootDirectory: path.resolve("workspace"),
      spawnProcess: vi.fn(() => {
        queueMicrotask(() => child.stderr.emit("data", Buffer.from("Ready in 1ms\n")));
        return child;
      }),
      fetchImpl: vi.fn().mockResolvedValue({ status: 200, body: { cancel: vi.fn() } }),
      portIsAvailable,
      removeDirectory,
      logger: { log: vi.fn() },
      stdout: { write: vi.fn() },
      stderr: { write: vi.fn() },
      terminateTree: vi.fn(async () => {
        child.emit("exit", 0, null);
        child.emit("close", 0, null);
      }),
    });

    await expect(controller.close()).rejects.toThrow(/still in use after process-tree teardown/);
    expect(removeDirectory).toHaveBeenCalledOnce();
  });

  it("uses bounded Windows taskkill and escalates a POSIX process group", async () => {
    const { terminateProcessTree } = (await import(serverUrl.href)) as DevServerModule;
    const child = new FakeChild(4_321);
    const taskkill = new FakeChild(9_999);
    const spawnProcess = vi.fn(() => {
      queueMicrotask(() => {
        taskkill.emit("exit", 0, null);
        taskkill.emit("close", 0, null);
      });
      return taskkill;
    });
    await terminateProcessTree({
      child,
      lifecycle: { closed: false, closePromise: new Promise(() => undefined) },
      platform: "win32",
      environment: { SystemRoot: "C:\\Windows" },
      spawnProcess,
      shutdownTimeoutMs: 100,
    });
    expect(spawnProcess).toHaveBeenCalledWith(
      "C:\\Windows\\System32\\taskkill.exe",
      ["/PID", "4321", "/T", "/F"],
      expect.objectContaining({ shell: false, stdio: "ignore", windowsHide: true })
    );

    const failedTaskkill = new FakeChild(9_998);
    const failedSpawn = vi.fn(() => {
      queueMicrotask(() => {
        failedTaskkill.emit("exit", 1, null);
        failedTaskkill.emit("close", 1, null);
      });
      return failedTaskkill;
    });
    await expect(
      terminateProcessTree({
        child,
        lifecycle: { closed: false, closePromise: new Promise(() => undefined) },
        platform: "win32",
        environment: { SystemRoot: "C:\\Windows" },
        spawnProcess: failedSpawn,
        shutdownTimeoutMs: 100,
      })
    ).rejects.toThrow(/taskkill failed.*exit code 1/);

    const processKill = vi.fn();
    await terminateProcessTree({
      child,
      lifecycle: { closed: false, closePromise: new Promise(() => undefined) },
      platform: "linux",
      processKill,
      terminateGraceMs: 1,
      delay: vi.fn(() => Promise.resolve()),
    });
    expect(processKill.mock.calls).toEqual([
      [-4_321, "SIGTERM"],
      [-4_321, "SIGKILL"],
    ]);
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
