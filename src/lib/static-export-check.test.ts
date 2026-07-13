import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
  validateWebManifest(
    manifest: unknown,
    options: { outputDirectory: string; basePath?: string }
  ): Promise<{ icons: number; shortcuts: number }>;
}

interface StaticCspGenerator {
  injectStaticContentPolicy(html: string, filename?: string): string;
}

interface StaticHeadersGenerator {
  generateStaticHeaders(options: { rootDirectory: string; basePath?: string }): Promise<string>;
  scopeStaticHeaders(source: string, basePath?: string): string;
}

const checkerUrl = pathToFileURL(path.resolve(process.cwd(), "scripts", "check-static-export.mjs"));
const checker = (await import(/* @vite-ignore */ checkerUrl.href)) as StaticExportChecker;
const cspGeneratorUrl = pathToFileURL(path.resolve(process.cwd(), "scripts", "generate-static-csp.mjs"));
const cspGenerator = (await import(/* @vite-ignore */ cspGeneratorUrl.href)) as StaticCspGenerator;
const headersGeneratorUrl = pathToFileURL(path.resolve(process.cwd(), "scripts", "generate-static-headers.mjs"));
const headersGenerator = (await import(/* @vite-ignore */ headersGeneratorUrl.href)) as StaticHeadersGenerator;
const temporaryDirectories: string[] = [];

const validWebManifest = {
  name: "Financial Calculator",
  short_name: "FinCalc",
  id: "./",
  start_url: ".",
  scope: ".",
  display: "standalone",
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  ],
  shortcuts: [{ name: "TVM Calculator", url: "tvm/" }],
};

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
  await writeFile(path.join(rootDirectory, "out", "icon-192.png"), "192 icon");
  await writeFile(path.join(rootDirectory, "out", "icon-512.png"), "512 icon");
  await writeFile(path.join(rootDirectory, "out", "_headers"), headersGenerator.scopeStaticHeaders(headers, basePath));
  await writeFile(path.join(rootDirectory, "out", "manifest.json"), JSON.stringify(validWebManifest));
  const html = cspGenerator.injectStaticContentPolicy(
    `<html><head><link href="${basePath}/_next/static/app.js"></head><body><a href="${basePath}/tvm/">TVM</a></body></html>`
  );
  await writeFile(path.join(rootDirectory, "out", "index.html"), html);
  await writeFile(path.join(rootDirectory, "out", "tvm", "index.html"), html);
  await writeFile(
    path.join(rootDirectory, "out", "precache-manifest.js"),
    `self.__FINANCIAL_CALC_PRECACHE_MANIFEST__ = ${JSON.stringify({
      buildId: "build-123",
      assets: [
        "/_next/static/app.js",
        "/icon-192.png",
        "/icon-512.png",
        "/index.html",
        "/manifest.json",
        "/tvm/index.html",
      ],
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

  it("scopes every deployment header selector without changing header values", () => {
    expect(headersGenerator.scopeStaticHeaders(headers)).toBe(headers);
    const scoped = headersGenerator.scopeStaticHeaders(headers, "/calc");
    const parsed = checker.parseHeaders(scoped);

    expect([...parsed.keys()]).toEqual([
      "/calc/*",
      "/calc/_next/static/*",
      "/calc/*.html",
      "/calc/sw.js",
      "/calc/precache-manifest.js",
      "/calc/manifest.json",
    ]);
    expect(parsed.get("/calc/*")?.get("x-content-type-options")).toBe("nosniff");
    expect(parsed.get("/calc/_next/static/*")?.get("cache-control")).toContain("immutable");
  });

  it("regenerates headers from the root template without double-prefixing", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "financial-calc-headers-"));
    temporaryDirectories.push(rootDirectory);
    await mkdir(path.join(rootDirectory, "public"), { recursive: true });
    await mkdir(path.join(rootDirectory, "out"), { recursive: true });
    await writeFile(path.join(rootDirectory, "public", "_headers"), headers);

    const first = await headersGenerator.generateStaticHeaders({ rootDirectory, basePath: "/calc" });
    const second = await headersGenerator.generateStaticHeaders({ rootDirectory, basePath: "/calc" });

    expect(second).toBe(first);
    expect(await readFile(path.join(rootDirectory, "out", "_headers"), "utf8")).toBe(first);
    expect(first).not.toContain("/calc/calc/");
  });

  it("validates root and base-path exports end to end", async () => {
    for (const basePath of ["", "/calc"]) {
      const rootDirectory = await createStaticExport({ basePath });
      await expect(
        checker.checkStaticExport({ rootDirectory, basePath, logger: { log: vi.fn() } })
      ).resolves.toMatchObject({ assets: 6, routes: 2, htmlFiles: 2, references: 4 });
    }
  });

  it("validates install metadata and resolves the same manifest at root and under a base path", async () => {
    for (const basePath of ["", "/calc"]) {
      const rootDirectory = await createStaticExport({ basePath });
      await expect(
        checker.validateWebManifest(validWebManifest, {
          outputDirectory: path.join(rootDirectory, "out"),
          basePath,
        })
      ).resolves.toEqual({ icons: 2, shortcuts: 1 });
    }
  });

  it("rejects malformed manifest fields and missing install icons", async () => {
    const rootDirectory = await createStaticExport();
    const outputDirectory = path.join(rootDirectory, "out");
    const validate = (manifest: unknown) => checker.validateWebManifest(manifest, { outputDirectory });

    await expect(validate(null)).rejects.toThrow(/must contain an object/);
    await expect(validate({ ...validWebManifest, name: undefined, short_name: undefined })).rejects.toThrow(
      /name or short_name/
    );
    await expect(validate({ ...validWebManifest, display: "floating" })).rejects.toThrow(/display is unsupported/);
    await expect(validate({ ...validWebManifest, icons: [] })).rejects.toThrow(/icons must be a non-empty array/);
    await expect(validate({ ...validWebManifest, icons: validWebManifest.icons.slice(0, 1) })).rejects.toThrow(
      /512x512 PNG/
    );
    await expect(
      validate({
        ...validWebManifest,
        icons: validWebManifest.icons.map((icon) => ({ ...icon, purpose: "maskable" })),
      })
    ).rejects.toThrow(/192x192 PNG with purpose any/);
    await expect(
      validate({
        ...validWebManifest,
        icons: [{ ...validWebManifest.icons[0], sizes: "192" }, validWebManifest.icons[1]],
      })
    ).rejects.toThrow(/invalid size/);
  });

  it("rejects manifest URLs that escape a base path or point to non-HTML routes", async () => {
    const rootDirectory = await createStaticExport({ basePath: "/calc" });
    const outputDirectory = path.join(rootDirectory, "out");
    const validate = (manifest: unknown) =>
      checker.validateWebManifest(manifest, { outputDirectory, basePath: "/calc" });

    await expect(validate({ ...validWebManifest, id: "/calc/" })).rejects.toThrow(/must stay relative/);
    await expect(validate({ ...validWebManifest, start_url: "https://example.test/calc/" })).rejects.toThrow(
      /must stay relative/
    );
    await expect(validate({ ...validWebManifest, start_url: "../" })).rejects.toThrow(/outside base path/);
    await expect(validate({ ...validWebManifest, scope: "../" })).rejects.toThrow(/outside base path/);
    await expect(validate({ ...validWebManifest, start_url: "manifest.json" })).rejects.toThrow(/exported HTML route/);
    await expect(
      validate({
        ...validWebManifest,
        icons: [{ ...validWebManifest.icons[0], src: "%2e%2e/icon-192.png" }, validWebManifest.icons[1]],
      })
    ).rejects.toThrow(/outside base path/);
    await expect(
      validate({
        ...validWebManifest,
        icons: [{ ...validWebManifest.icons[0], src: "missing-192.png" }, validWebManifest.icons[1]],
      })
    ).rejects.toThrow(/missing exported file/);
    await expect(
      validate({ ...validWebManifest, shortcuts: [{ name: "Broken", url: "icon-192.png" }] })
    ).rejects.toThrow(/exported HTML route/);
    await expect(
      validate({ ...validWebManifest, shortcuts: [{ name: "Absolute", url: "/calc/tvm/" }] })
    ).rejects.toThrow(/must stay relative/);
    await expect(validate({ ...validWebManifest, shortcuts: [{ name: "Escaped", url: "../tvm/" }] })).rejects.toThrow(
      /outside base path/
    );
    await expect(
      validate({
        ...validWebManifest,
        shortcuts: [
          {
            name: "Escaped icon",
            url: "tvm/",
            icons: [{ src: "../icon-192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
      })
    ).rejects.toThrow(/shortcuts\[0\]\.icons\[0\]\.src resolves outside base path/);
  });

  it("requires start and shortcut routes to remain within manifest scope", async () => {
    const rootDirectory = await createStaticExport();
    const outputDirectory = path.join(rootDirectory, "out");

    await expect(
      checker.validateWebManifest({ ...validWebManifest, scope: "tvm/" }, { outputDirectory })
    ).rejects.toThrow(/start_url must stay within scope/);
    await expect(
      checker.validateWebManifest(
        { ...validWebManifest, start_url: "tvm/", scope: "tvm/", shortcuts: [{ name: "Home", url: "./" }] },
        { outputDirectory }
      )
    ).rejects.toThrow(/shortcuts\[0\]\.url must stay within scope/);
  });

  it("rejects root-scoped headers for a base-path export", async () => {
    const rootDirectory = await createStaticExport({ basePath: "/calc" });
    await writeFile(path.join(rootDirectory, "out", "_headers"), headers);

    await expect(
      checker.checkStaticExport({ rootDirectory, basePath: "/calc", logger: { log: vi.fn() } })
    ).rejects.toThrow(/\/calc\/\*/);
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
      cspGenerator.injectStaticContentPolicy(
        '<html><head><script src="/_next/static/app.js"></script></head><body></body></html>'
      )
    );
    await expect(
      checker.checkStaticExport({ rootDirectory, basePath: "/calc", logger: { log: vi.fn() } })
    ).rejects.toThrow(/outside base path/);
  });
});
