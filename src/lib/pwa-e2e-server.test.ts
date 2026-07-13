import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

const serverUrl = pathToFileURL(path.resolve(process.cwd(), "scripts", "serve-pwa-e2e.mjs"));
const temporaryDirectories: string[] = [];
const servers: Server[] = [];

interface PwaServerModule {
  startPwaE2eServer(options: {
    outputDirectory: string;
    port: number;
    logger: { log(message: string): void };
  }): Promise<Server>;
}

async function closeServer(server: Server) {
  if (!server.listening) return;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(closeServer));
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("PWA E2E server lifecycle", () => {
  it("clears an interrupted offline marker before accepting readiness requests", async () => {
    const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "financial-calc-pwa-server-"));
    temporaryDirectories.push(outputDirectory);
    const offlineMarker = path.join(outputDirectory, ".pwa-e2e-offline");
    await writeFile(offlineMarker, "offline", "utf8");
    const logger = { log: vi.fn() };
    const { startPwaE2eServer } = (await import(serverUrl.href)) as PwaServerModule;

    const server = await startPwaE2eServer({ outputDirectory, port: 0, logger });
    servers.push(server);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP server address.");

    await expect(access(offlineMarker)).rejects.toMatchObject({ code: "ENOENT" });
    const response = await fetch(`http://127.0.0.1:${address.port}/`);
    expect(response.status).toBe(200);
    await response.text();
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining(`127.0.0.1:${address.port}`));
  });
});
