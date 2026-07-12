import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutputDirectory = path.join(projectRoot, "out");
const defaultBudget = 500_000;
const routeBudgets = {
  "/": 300_000,
  "/404": 300_000,
  "/_not-found": 300_000,
  "/help": 300_000,
  "/settings": 300_000,
  "/macro": 330_000,
  "/history": 350_000,
  "/equity": 350_000,
  "/tvm": 380_000,
  "/bonds": 470_000,
  "/cash-flow": 470_000,
  "/loans": 470_000,
  "/options": 470_000,
  "/risk": 470_000,
  "/portfolio": 500_000,
};

export async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const absolutePath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(absolutePath) : [absolutePath];
    })
  );
  return nested.flat();
}

export function routeFromHtmlPath(htmlPath, outputDirectory = defaultOutputDirectory) {
  const relativePath = path.relative(outputDirectory, htmlPath).replaceAll(path.sep, "/");
  if (relativePath === "index.html") return "/";
  if (relativePath.endsWith("/index.html")) return `/${relativePath.slice(0, -"/index.html".length)}`;
  return `/${relativePath.slice(0, -".html".length)}`;
}

export function resolveExportedAsset(reference, outputDirectory = defaultOutputDirectory) {
  const pathname = new URL(reference, "https://bundle.invalid").pathname;
  const nextAssetIndex = pathname.indexOf("/_next/");
  const exportedPath = nextAssetIndex >= 0 ? pathname.slice(nextAssetIndex + 1) : pathname.replace(/^\/+/, "");
  return path.join(outputDirectory, ...exportedPath.split("/"));
}

export async function measureRoute(htmlPath, outputDirectory = defaultOutputDirectory) {
  const html = await readFile(htmlPath, "utf8");
  const references = [
    ...new Set([...html.matchAll(/<script[^>]+src="([^"]+\.js(?:\?[^"]*)?)"/g)].map((match) => match[1])),
  ];
  const buffers = await Promise.all(
    references.map(async (reference) => {
      const assetPath = resolveExportedAsset(reference, outputDirectory);
      await stat(assetPath);
      return readFile(assetPath);
    })
  );

  return {
    route: routeFromHtmlPath(htmlPath, outputDirectory),
    scripts: references.length,
    rawBytes: buffers.reduce((total, buffer) => total + buffer.length, 0),
    gzipBytes: buffers.reduce((total, buffer) => total + gzipSync(buffer, { level: 9 }).length, 0),
  };
}

export async function checkBundleBudgets({
  outputDirectory = defaultOutputDirectory,
  logger = { log: console.log },
} = {}) {
  const htmlFiles = (await listFiles(outputDirectory)).filter((file) => file.endsWith(".html"));
  const routeMeasurements = new Map();
  for (const measurement of await Promise.all(htmlFiles.map((htmlPath) => measureRoute(htmlPath, outputDirectory)))) {
    const previous = routeMeasurements.get(measurement.route);
    if (!previous || measurement.gzipBytes > previous.gzipBytes) {
      routeMeasurements.set(measurement.route, measurement);
    }
  }
  const measurements = [...routeMeasurements.values()].sort((a, b) => b.gzipBytes - a.gzipBytes);
  const failures = [];

  for (const measurement of measurements) {
    const budget = routeBudgets[measurement.route] ?? defaultBudget;
    const status = measurement.gzipBytes <= budget ? "PASS" : "FAIL";
    logger.log(
      `${status} ${measurement.route.padEnd(12)} ${String(measurement.scripts).padStart(2)} scripts ${String(
        measurement.gzipBytes
      ).padStart(7)} / ${budget} gzip bytes`
    );
    if (measurement.gzipBytes > budget) failures.push({ ...measurement, budget });
  }

  if (failures.length > 0) {
    throw new Error(
      `Bundle budget exceeded for: ${failures.map(({ route, gzipBytes, budget }) => `${route} (${gzipBytes}/${budget})`).join(", ")}`
    );
  }

  return measurements;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkBundleBudgets();
}
