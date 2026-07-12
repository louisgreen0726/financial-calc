import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

const checkerUrl = pathToFileURL(path.resolve(process.cwd(), "scripts", "check-bundle-budget.mjs"));
const temporaryDirectories: string[] = [];

async function loadChecker() {
  return import(checkerUrl.href) as Promise<typeof import("../../scripts/check-bundle-budget.mjs")>;
}

async function createExport() {
  const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "financial-calc-bundle-"));
  temporaryDirectories.push(outputDirectory);
  await mkdir(path.join(outputDirectory, "_next", "static", "chunks"), { recursive: true });
  await writeFile(path.join(outputDirectory, "_next", "static", "chunks", "app.js"), "console.log('app');");
  return outputDirectory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("bundle budget checker", () => {
  it("maps root, directory, and flat HTML exports to route names", async () => {
    const { routeFromHtmlPath } = await loadChecker();
    const outputDirectory = path.resolve("out");

    expect(routeFromHtmlPath(path.join(outputDirectory, "index.html"), outputDirectory)).toBe("/");
    expect(routeFromHtmlPath(path.join(outputDirectory, "options", "index.html"), outputDirectory)).toBe("/options");
    expect(routeFromHtmlPath(path.join(outputDirectory, "404.html"), outputDirectory)).toBe("/404");
  });

  it("resolves scripts correctly when exported URLs include a base path", async () => {
    const { measureRoute } = await loadChecker();
    const outputDirectory = await createExport();
    const htmlPath = path.join(outputDirectory, "index.html");
    await writeFile(htmlPath, '<script src="/calc/_next/static/chunks/app.js"></script>');

    await expect(measureRoute(htmlPath, outputDirectory)).resolves.toMatchObject({
      route: "/",
      scripts: 1,
      rawBytes: 19,
    });
  });

  it("checks flat error pages as well as route index files", async () => {
    const { checkBundleBudgets } = await loadChecker();
    const outputDirectory = await createExport();
    const scriptTag = '<script src="/_next/static/chunks/app.js"></script>';
    await writeFile(path.join(outputDirectory, "index.html"), scriptTag);
    await writeFile(path.join(outputDirectory, "404.html"), scriptTag);
    const logger = { log: vi.fn() };

    const measurements = await checkBundleBudgets({ outputDirectory, logger });

    expect(measurements.map(({ route }) => route).sort()).toEqual(["/", "/404"]);
    expect(logger.log).toHaveBeenCalledTimes(2);
  });
});
