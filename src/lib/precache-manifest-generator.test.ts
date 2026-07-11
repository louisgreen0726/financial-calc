import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

interface GeneratedManifest {
  buildId: string;
  assets: string[];
  routes: string[];
}

interface PrecacheGeneratorModule {
  generatePrecacheManifest(options: { rootDirectory: string }): Promise<GeneratedManifest>;
  getDynamicAssetPaths(manifest: Record<string, { files?: unknown }>): Set<string>;
}

const generatorUrl = pathToFileURL(path.resolve(process.cwd(), "scripts", "generate-precache-manifest.mjs"));
const generator = (await import(/* @vite-ignore */ generatorUrl.href)) as PrecacheGeneratorModule;

describe("precache manifest generator", () => {
  const temporaryDirectories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
    );
  });

  it("normalizes and collects chunks produced by dynamic imports", () => {
    expect(
      generator.getDynamicAssetPaths({
        "export-menu -> pdf": { files: ["static/chunks/pdf.js", "static\\chunks\\pdf-helper.js"] },
        empty: { files: [] },
      })
    ).toEqual(new Set(["/_next/static/chunks/pdf.js", "/_next/static/chunks/pdf-helper.js"]));
  });

  it("keeps offline route assets while excluding lazy chunks and service-worker metadata", async () => {
    const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "financial-calc-precache-"));
    temporaryDirectories.push(rootDirectory);

    await mkdir(path.join(rootDirectory, ".next"), { recursive: true });
    await mkdir(path.join(rootDirectory, "out", "tvm"), { recursive: true });
    await mkdir(path.join(rootDirectory, "out", "_next", "static", "chunks"), { recursive: true });
    await writeFile(path.join(rootDirectory, ".next", "BUILD_ID"), "build-123\n", "utf8");
    await writeFile(
      path.join(rootDirectory, ".next", "react-loadable-manifest.json"),
      JSON.stringify({ pdf: { files: ["static/chunks/pdf-lazy.js"] } }),
      "utf8"
    );

    const files = new Map([
      ["out/index.html", "home"],
      ["out/tvm/index.html", "tvm"],
      ["out/_next/static/chunks/app.js", "initial"],
      ["out/_next/static/chunks/pdf-lazy.js", "lazy"],
      ["out/sw.js", "worker"],
      ["out/_headers", "headers"],
      ["out/precache-manifest.js", "placeholder"],
    ]);
    await Promise.all(
      [...files].map(([relativePath, contents]) => writeFile(path.join(rootDirectory, relativePath), contents, "utf8"))
    );

    const manifest = await generator.generatePrecacheManifest({ rootDirectory });

    expect(manifest).toEqual({
      buildId: "build-123",
      assets: ["/_next/static/chunks/app.js", "/index.html", "/tvm/index.html"],
      routes: ["/", "/tvm/"],
    });

    const generatedSource = await readFile(path.join(rootDirectory, "out", "precache-manifest.js"), "utf8");
    expect(generatedSource).toContain('"buildId": "build-123"');
    expect(generatedSource).not.toContain("pdf-lazy.js");
  });
});
