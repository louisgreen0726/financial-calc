import { rm } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import next from "next";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

export async function startPlaywrightDevServer({
  port,
  distDir,
  rootDirectory = projectRoot,
  nextFactory = next,
  createHttpServer = http.createServer,
  removeDirectory = rm,
  logger = console,
} = {}) {
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error("The Playwright dev server port must be an integer from 1 to 65535.");
  }
  resolvePlaywrightDevDistDir(distDir);
  const absoluteDistDir = path.resolve(rootDirectory, distDir);
  await removeDirectory(absoluteDistDir, { recursive: true, force: true, maxRetries: 5 });

  let app;
  let server;
  try {
    app = nextFactory({ dev: true, dir: rootDirectory, hostname: "localhost", port, webpack: true });
    await app.prepare();
    server = createHttpServer(app.getRequestHandler());
    server.on("upgrade", app.getUpgradeHandler());

    await new Promise((resolve, reject) => {
      const onError = (error) => reject(error);
      server.once("error", onError);
      server.listen(port, "localhost", () => {
        server.off("error", onError);
        logger.log(`Playwright Next dev server listening on http://localhost:${port}`);
        resolve();
      });
    });
  } catch (error) {
    await app?.close().catch(() => undefined);
    await removeDirectory(absoluteDistDir, { recursive: true, force: true, maxRetries: 5 });
    throw error;
  }

  let closePromise;
  return {
    close() {
      closePromise ??= (async () => {
        server.closeAllConnections?.();
        if (server.listening) {
          await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
          });
        }
        await app.close();
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
