import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { connect } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultNextCliPath = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const defaultStartupTimeoutMs = 90_000;
const defaultShutdownTimeoutMs = 10_000;
const defaultTerminateGraceMs = 2_000;

export function parsePlaywrightDevServerPort(args = process.argv.slice(2)) {
  const portIndex = args.indexOf("--port");
  const rawPort = portIndex >= 0 ? args[portIndex + 1] : undefined;
  if (!rawPort || !/^\d+$/.test(rawPort)) {
    throw new Error("The Playwright dev server requires --port with an integer from 1 to 65535.");
  }
  const port = Number(rawPort);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error("The Playwright dev server port must be an integer from 1 to 65535.");
  }
  return port;
}

export function resolvePlaywrightDevDistDir(value = process.env.NEXT_DIST_DIR) {
  if (!value || !/^\.next\/playwright-[1-9]\d*$/.test(value)) {
    throw new Error("NEXT_DIST_DIR must match .next/playwright-<positive runner PID>.");
  }
  return value;
}

function waitForDelay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function isPlaywrightDevServerPortAvailable({
  port,
  hostname = "localhost",
  connectSocket = connect,
  timeoutMs = 2_000,
}) {
  return new Promise((resolve, reject) => {
    const socket = connectSocket({ host: hostname, port });
    let settled = false;
    const finish = (available, error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve(available);
    };

    socket.setTimeout(timeoutMs, () => finish(false));
    socket.once("connect", () => finish(false));
    socket.once("error", (error) => {
      if (error?.code === "ECONNREFUSED") finish(true);
      else finish(undefined, new Error(`Unable to inspect ${hostname}:${port}.`, { cause: error }));
    });
  });
}

async function waitWithTimeout(promise, milliseconds, message) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(typeof message === "function" ? message() : message)), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function observeChild(child) {
  let exited = false;
  let closed = false;
  const exitPromise = new Promise((resolve) => {
    child.once("error", (error) => {
      exited = true;
      resolve({ error });
    });
    child.once("exit", (code, signal) => {
      exited = true;
      resolve({ code, signal });
    });
  });
  const closePromise = new Promise((resolve) => {
    child.once("error", (error) => {
      closed = true;
      resolve({ error });
    });
    child.once("close", (code, signal) => {
      closed = true;
      resolve({ code, signal });
    });
  });
  return {
    exitPromise,
    closePromise,
    get exited() {
      return exited;
    },
    get closed() {
      return closed;
    },
  };
}

function observeNextCliReady(child, stdout, stderr) {
  let outputTail = "";
  let ready = false;
  let resolveReady;
  const readyPromise = new Promise((resolve) => {
    resolveReady = resolve;
  });
  const handleOutput = (destination) => (chunk) => {
    destination?.write?.(chunk);
    outputTail = `${outputTail}${chunk.toString()}`.slice(-65_536);
    if (!ready && /\bReady in \d/.test(outputTail)) {
      ready = true;
      resolveReady();
    }
  };

  child.stdout?.on("data", handleOutput(stdout));
  child.stderr?.on("data", handleOutput(stderr));
  return {
    readyPromise,
    get outputTail() {
      return outputTail.trim();
    },
  };
}

async function probeServer(baseURL, fetchImpl, timeoutMs) {
  try {
    const response = await fetchImpl(baseURL, { signal: AbortSignal.timeout(timeoutMs) });
    await response.body?.cancel();
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForServerReady({
  baseURL,
  lifecycle,
  cliReadyPromise,
  getCliOutput,
  fetchImpl,
  startupTimeoutMs,
  probeTimeoutMs,
  delay,
}) {
  const deadline = Date.now() + startupTimeoutMs;
  const earlyExit = lifecycle.exitPromise.then((result) => ({ type: "exit", result }));
  const cliDiagnostic = () => {
    const output = getCliOutput();
    return output ? `\nLast output:\n${output}` : "";
  };
  const cliResult = await waitWithTimeout(
    Promise.race([cliReadyPromise.then(() => ({ type: "ready" })), earlyExit]),
    startupTimeoutMs,
    () => `Next dev server did not report CLI readiness within ${startupTimeoutMs}ms.${cliDiagnostic()}`
  );
  if (cliResult.type === "exit") {
    const { code, signal, error } = cliResult.result;
    throw new Error(
      `Next dev server exited before CLI readiness${
        error ? `: ${error.message}` : ` (code ${code}, signal ${signal})`
      }.${cliDiagnostic()}`
    );
  }

  while (Date.now() < deadline) {
    const probeResult = await Promise.race([
      probeServer(baseURL, fetchImpl, probeTimeoutMs).then((ready) => ({ type: "probe", ready })),
      earlyExit,
    ]);
    if (probeResult.type === "exit") {
      const { code, signal, error } = probeResult.result;
      throw new Error(
        `Next dev server exited before readiness${error ? `: ${error.message}` : ` (code ${code}, signal ${signal})`}.`
      );
    }
    if (probeResult.ready) return;

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    const delayResult = await Promise.race([
      delay(Math.min(250, remaining)).then(() => ({ type: "delay" })),
      earlyExit,
    ]);
    if (delayResult.type === "exit") {
      const { code, signal, error } = delayResult.result;
      throw new Error(
        `Next dev server exited before readiness${error ? `: ${error.message}` : ` (code ${code}, signal ${signal})`}.`
      );
    }
  }
  throw new Error(`Next dev server did not become ready at ${baseURL} within ${startupTimeoutMs}ms.`);
}

export async function terminateProcessTree({
  child,
  lifecycle,
  platform = process.platform,
  environment = process.env,
  spawnProcess = spawn,
  processKill = process.kill,
  terminateGraceMs = defaultTerminateGraceMs,
  shutdownTimeoutMs = defaultShutdownTimeoutMs,
  delay = waitForDelay,
}) {
  if (lifecycle.closed || !child.pid) return;

  if (platform === "win32") {
    const systemRoot = environment.SystemRoot ?? environment.WINDIR ?? "C:\\Windows";
    const taskkillPath = path.win32.join(systemRoot, "System32", "taskkill.exe");
    const taskkill = spawnProcess(taskkillPath, ["/PID", String(child.pid), "/T", "/F"], {
      shell: false,
      stdio: "ignore",
      windowsHide: true,
    });
    const taskkillLifecycle = observeChild(taskkill);
    const result = await waitWithTimeout(
      taskkillLifecycle.closePromise,
      shutdownTimeoutMs,
      `taskkill did not finish within ${shutdownTimeoutMs}ms.`
    );
    if (result.error) throw result.error;
    if (result.code !== 0) {
      throw new Error(`taskkill failed for Playwright dev server PID ${child.pid} with exit code ${result.code}.`);
    }
    return;
  }

  try {
    processKill(-child.pid, "SIGTERM");
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
    return;
  }
  const closedDuringGrace = await Promise.race([
    lifecycle.closePromise.then(() => true),
    delay(terminateGraceMs).then(() => false),
  ]);
  if (!closedDuringGrace) {
    try {
      processKill(-child.pid, "SIGKILL");
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
  }
}

export async function startPlaywrightDevServer({
  port,
  distDir,
  rootDirectory = projectRoot,
  nextCliPath = defaultNextCliPath,
  nodeExecutable = process.execPath,
  environment = process.env,
  platform = process.platform,
  spawnProcess = spawn,
  processKill = process.kill,
  fetchImpl = globalThis.fetch,
  portIsAvailable = isPlaywrightDevServerPortAvailable,
  removeDirectory = rm,
  logger = console,
  stdout = process.stdout,
  stderr = process.stderr,
  startupTimeoutMs = defaultStartupTimeoutMs,
  shutdownTimeoutMs = defaultShutdownTimeoutMs,
  terminateGraceMs = defaultTerminateGraceMs,
  probeTimeoutMs = 2_000,
  delay = waitForDelay,
  terminateTree = terminateProcessTree,
} = {}) {
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error("The Playwright dev server port must be an integer from 1 to 65535.");
  }
  resolvePlaywrightDevDistDir(distDir);
  const absoluteDistDir = path.resolve(rootDirectory, distDir);
  const hostname = "localhost";
  const portCheckOptions = { port, hostname, timeoutMs: probeTimeoutMs };
  if (!(await portIsAvailable(portCheckOptions))) {
    throw new Error(
      `Playwright dev server port ${port} is already in use. Set PLAYWRIGHT_REUSE_EXISTING_SERVER=1 to reuse it explicitly.`
    );
  }
  await removeDirectory(absoluteDistDir, { recursive: true, force: true, maxRetries: 5 });

  const child = spawnProcess(
    nodeExecutable,
    [nextCliPath, "dev", "--webpack", "--hostname", hostname, "--port", String(port)],
    {
      cwd: rootDirectory,
      detached: platform !== "win32",
      env: { ...environment, NEXT_DIST_DIR: distDir },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    }
  );
  const lifecycle = observeChild(child);
  const cliOutput = observeNextCliReady(child, stdout, stderr);
  const baseURL = `http://${hostname}:${port}`;

  const stopChild = async () => {
    let terminationError;
    if (!lifecycle.closed) {
      try {
        await terminateTree({
          child,
          lifecycle,
          platform,
          environment,
          spawnProcess,
          processKill,
          terminateGraceMs,
          shutdownTimeoutMs,
          delay,
        });
      } catch (error) {
        terminationError = error;
      }
    }
    let result;
    try {
      result = await waitWithTimeout(
        lifecycle.closePromise,
        shutdownTimeoutMs,
        `Next dev server did not close within ${shutdownTimeoutMs}ms.`
      );
    } catch (error) {
      if (terminationError) {
        throw new AggregateError(
          [terminationError, error],
          "Unable to terminate the Playwright dev server process tree."
        );
      }
      throw error;
    }
    if (result.error) throw result.error;
    if (!(await portIsAvailable(portCheckOptions))) {
      const portError = new Error(`Playwright dev server port ${port} is still in use after process-tree teardown.`);
      if (terminationError) {
        throw new AggregateError(
          [terminationError, portError],
          "Unable to terminate the Playwright dev server process tree."
        );
      }
      throw portError;
    }
  };

  try {
    await waitForServerReady({
      baseURL,
      lifecycle,
      cliReadyPromise: cliOutput.readyPromise,
      getCliOutput: () => cliOutput.outputTail,
      fetchImpl,
      startupTimeoutMs,
      probeTimeoutMs,
      delay,
    });
    logger.log(`Playwright Next CLI ready at ${baseURL}`);
  } catch (error) {
    try {
      await stopChild();
      await removeDirectory(absoluteDistDir, { recursive: true, force: true, maxRetries: 5 });
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "The Playwright dev server failed to start and its process tree could not be cleaned up safely."
      );
    }
    throw error;
  }

  let closePromise;
  return {
    close() {
      closePromise ??= (async () => {
        await stopChild();
        await removeDirectory(absoluteDistDir, { recursive: true, force: true, maxRetries: 5 });
      })();
      return closePromise;
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const controller = await startPlaywrightDevServer({
    port: parsePlaywrightDevServerPort(),
    distDir: resolvePlaywrightDevDistDir(),
  });
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      await controller.close();
      process.exitCode = 0;
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    }
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
