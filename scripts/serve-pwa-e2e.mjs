import { constants } from "node:fs";
import { access, rm } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import serveHandler from "serve-handler";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutputDirectory = path.join(projectRoot, "out");

async function isOffline(offlineMarker) {
  try {
    await access(offlineMarker, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function startPwaE2eServer({
  outputDirectory = defaultOutputDirectory,
  port = Number(process.env.PORT ?? 3100),
  basePath = process.env.PWA_BASE_PATH ?? "",
  logger = console,
} = {}) {
  const normalizedBasePath = basePath.replace(/\/$/, "");
  if (normalizedBasePath && (!normalizedBasePath.startsWith("/") || normalizedBasePath === "/")) {
    throw new Error(`Invalid PWA E2E base path: ${normalizedBasePath}`);
  }
  const offlineMarker = path.join(outputDirectory, ".pwa-e2e-offline");

  // A previous interrupted offline test cannot be allowed to block Playwright's next readiness probe.
  await rm(offlineMarker, { force: true });

  const server = http.createServer(async (request, response) => {
    if (await isOffline(offlineMarker)) {
      request.socket.destroy();
      return;
    }

    if (normalizedBasePath) {
      const requestUrl = new URL(request.url ?? "/", "http://pwa-e2e.invalid");
      if (requestUrl.pathname !== normalizedBasePath && !requestUrl.pathname.startsWith(`${normalizedBasePath}/`)) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not Found");
        return;
      }
      requestUrl.pathname = requestUrl.pathname.slice(normalizedBasePath.length) || "/";
      request.url = `${requestUrl.pathname}${requestUrl.search}`;
    }

    const mappedPathname = new URL(request.url ?? "/", "http://pwa-e2e.invalid").pathname;
    await serveHandler(request, response, {
      public: outputDirectory,
      cleanUrls: !mappedPathname.endsWith(".html"),
    });
  });

  await new Promise((resolve, reject) => {
    const onError = (error) => reject(error);
    server.once("error", onError);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", onError);
      const address = server.address();
      const listeningPort = typeof address === "object" && address ? address.port : port;
      logger.log(`PWA E2E server listening on http://127.0.0.1:${listeningPort}${normalizedBasePath}`);
      resolve();
    });
  });

  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await startPwaE2eServer();
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}
