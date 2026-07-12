import { constants } from "node:fs";
import { access } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import serveHandler from "serve-handler";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, "out");
const offlineMarker = path.join(outputDirectory, ".pwa-e2e-offline");
const port = Number(process.env.PORT ?? 3100);
const basePath = (process.env.PWA_BASE_PATH ?? "").replace(/\/$/, "");

if (basePath && (!basePath.startsWith("/") || basePath === "/")) {
  throw new Error(`Invalid PWA E2E base path: ${basePath}`);
}

async function isOffline() {
  try {
    await access(offlineMarker, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (request, response) => {
  if (await isOffline()) {
    request.socket.destroy();
    return;
  }

  if (basePath) {
    const requestUrl = new URL(request.url ?? "/", "http://pwa-e2e.invalid");
    if (requestUrl.pathname !== basePath && !requestUrl.pathname.startsWith(`${basePath}/`)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not Found");
      return;
    }
    requestUrl.pathname = requestUrl.pathname.slice(basePath.length) || "/";
    request.url = `${requestUrl.pathname}${requestUrl.search}`;
  }

  const mappedPathname = new URL(request.url ?? "/", "http://pwa-e2e.invalid").pathname;
  await serveHandler(request, response, {
    public: outputDirectory,
    cleanUrls: !mappedPathname.endsWith(".html"),
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`PWA E2E server listening on http://127.0.0.1:${port}${basePath || ""}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
