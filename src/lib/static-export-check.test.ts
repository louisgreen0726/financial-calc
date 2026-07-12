import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

interface StaticExportChecker {
  checkStaticExport(options: {
    rootDirectory: string;
    basePath?: string;
    logger?: { log: (message: string) => void };
  }): Promise<{
    assets: number;
    routes: number;
    htmlFiles: number;
    references: number;
  }>;
  normalizeBasePath(value?: string): string;
  parseCommandLine(args: string[], environment?: Record<string, string>): { build: boolean; basePath: string };
  parseHeaders(source: string): Map<string, Map<string, string>>;
  parsePrecacheManifest(source: string): { buildId: string; assets: string[]; routes: string[] };
}

interface StaticCspGenerator {
  injectStaticScriptPolicy(html: string, filename?: string): string;
}

const checkerUrl = pathToFileURL(path.resolve(process.cwd(), "scripts", "check-static-export.mjs"));
const checker = (await import(/* @vite-ignore */ checkerUrl.href)) as StaticExportChecker;
const cspGeneratorUrl = pathToFileURL(path.resolve(process.cwd(), "scripts", "generate-static-csp.mjs"));
const cspGenerator = (await import(/* @vite-ignore */ cspGeneratorUrl.href)) as StaticCspGenerator;
const temporaryDirectories: string[] = [];

const headers = `/*
  Cache-Control: public, max-age=0, must-revalidate
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Permissions-Policy: camera=()

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/sw.js
  Cache-Control: no-cache, no-store, must-revalidate

/precache-manifest.js
  Cache-Control: no-cache, no-store, must-revalidate

/manifest.json
  Cache-Control: no-cache, must-revalidate
`;

async function createStaticExport({ basePath = "" } = {}) {
  const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "financial-calc-static-"));
  temporaryDirectories.push(rootDirectory);
  await mkdir(path.join(rootDirectory, ".next"), { recursive: true });
  await mkdir(path.join(rootDirectory, "out", "tvm"), { recursive: true });
  await mkdir(path.join(rootDirectory, "out", "_next", "static"), { recursive: true });
  await writeFile(path.join(rootDirectory, ".next", "BUILD_ID"), "build-123\n");
  await writeFile(path.join(rootDirectory, "out", "_next", "static", "app.js"), "console.log('app')");
  await writeFile(path.join(rootDirectory, "out", "sw.js"), "self.addEventListener('fetch', () => {})");
  await writeFile(path.join(rootDirectory, "out", "_headers"), headers);
  await writeFile(
    path.join(rootDirectory, "out", "manifest.json"),
    JSON.stringify({ id: "./", start_url: ".", scope: "." })
  );
  const html = cspGenerator.injectStaticScriptPolicy(
    `<html><head><link href="${basePath}/_next/static/app.js"></head><body><a href="${basePath}/tvm/">TVM</a></body></html>`
  );
  await writeFile(path.join(rootDirectory, "out", "index.html"), html);
  await writeFile(path.join(rootDirectory, "out", "tvm", "index.html"), html);
  await writeFile(
    path.join(rootDirectory, "out", "precache-manifest.js"),
    `self.__FINANCIAL_CALC_PRECACHE_MANIFEST__ = ${JSON.stringify({
      buildId: "build-123",
      assets: ["/_next/static/app.js", "/index.html", "/tvm/index.html"],
      routes: ["/", "/tvm/"],
    })};`
  );
  return rootDirectory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("static export checker", () => {
  it("normalizes CLI options and rejects ambiguous base paths", () => {
    expect(checker.parseCommandLine(["--build", "--base-path=/calc"], {})).toEqual({
      build: true,
      basePath: "/calc",
    });
    expect(checker.parseCommandLine([], { NEXT_PUBLIC_BASE_PATH: "/hosted" })).toEqual({
      build: false,
      basePath: "/hosted",
    });
    expect(checker.normalizeBasePath()).toBe("");
    expect(() => checker.normalizeBasePath("calc")).toThrow(/must start/);
    expect(() => checker.normalizeBasePath("/calc/")).toThrow(/must not/);
    expect(() => checker.normalizeBasePath("/../calc")).toThrow(/segment/);
  });

  it("loads generated JavaScript without evaluating it in the host context", () => {
    expect(
      checker.parsePrecacheManifest(
        'self.__FINANCIAL_CALC_PRECACHE_MANIFEST__ = { buildId: "id", assets: ["/index.html"], routes: ["/"] };'
      )
    ).toEqual({ buildId: "id", assets: ["/index.html"], routes: ["/"] });
    expect(() => checker.parsePrecacheManifest("while (true) {}")).toThrow();
  });

  it("parses host header blocks case-insensitively", () => {
    const parsed = checker.parseHeaders(headers);
    expect(parsed.get("/*")?.get("x-content-type-options")).toBe("nosniff");
    expect(parsed.get("/_next/static/*")?.get("cache-control")).toContain("immutable");
  });

  it("validates root and base-path exports end to end", async () => {
    for (const basePath of ["", "/calc"]) {
      const rootDirectory = await createStaticExport({ basePath });
      await expect(
        checker.checkStaticExport({ rootDirectory, basePath, logger: { log: vi.fn() } })
      ).resolves.toMatchObject({ assets: 3, routes: 2, htmlFiles: 2, references: 4 });
    }
  });

  it("reports stale manifests and references that escape the configured base path", async () => {
    const rootDirectory = await createStaticExport({ basePath: "/calc" });
    await writeFile(path.join(rootDirectory, ".next", "BUILD_ID"), "new-build");
    await expect(
      checker.checkStaticExport({ rootDirectory, basePath: "/calc", logger: { log: vi.fn() } })
    ).rejects.toThrow(/buildId/);

    await writeFile(path.join(rootDirectory, ".next", "BUILD_ID"), "build-123");
    await writeFile(
      path.join(rootDirectory, "out", "index.html"),
      cspGenerator.injectStaticScriptPolicy(
        '<html><head><script src="/_next/static/app.js"></script></head><body></body></html>'
      )
    );
    await expect(
      checker.checkStaticExport({ rootDirectory, basePath: "/calc", logger: { log: vi.fn() } })
    ).rejects.toThrow(/outside base path/);
  });
});
