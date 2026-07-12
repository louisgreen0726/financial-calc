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

  await serveHandler(request, response, { public: outputDirectory });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`PWA E2E server listening on http://127.0.0.1:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
