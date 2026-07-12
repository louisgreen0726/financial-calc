import { spawn } from "node:child_process";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const forbiddenPrecacheAssets = new Set(["/_headers", "/precache-manifest.js", "/sw.js"]);
const requiredCspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' blob:",
  "style-src 'self' 'unsafe-inline'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function normalizeBasePath(value = "") {
  if (!value) return "";
  invariant(value.startsWith("/"), `Base path must start with "/": ${value}`);
  invariant(value !== "/" && !value.endsWith("/"), `Base path must not be "/" or end with "/": ${value}`);
  invariant(!value.includes("?") && !value.includes("#") && !value.includes("\\"), `Invalid base path: ${value}`);
  invariant(
    value.split("/").every((segment, index) => index === 0 || (segment && segment !== "." && segment !== "..")),
    `Invalid base path segment: ${value}`
  );
  return value;
}

export function parseCommandLine(argumentsToParse, environment = process.env) {
  let build = false;
  let basePath = environment.NEXT_PUBLIC_BASE_PATH ?? "";

  for (let index = 0; index < argumentsToParse.length; index += 1) {
    const argument = argumentsToParse[index];
    if (argument === "--build") {
      build = true;
    } else if (argument === "--base-path") {
      index += 1;
      invariant(index < argumentsToParse.length, "--base-path requires a value.");
      basePath = argumentsToParse[index];
    } else if (argument.startsWith("--base-path=")) {
      basePath = argument.slice("--base-path=".length);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return { build, basePath: normalizeBasePath(basePath) };
}

export function parsePrecacheManifest(source, filename = "precache-manifest.js") {
  const sandbox = { self: {} };
  vm.runInNewContext(source, sandbox, { filename, timeout: 1_000 });
  const manifest = sandbox.self.__FINANCIAL_CALC_PRECACHE_MANIFEST__;

  invariant(manifest && typeof manifest === "object" && !Array.isArray(manifest), "Precache manifest is missing.");
  invariant(typeof manifest.buildId === "string" && manifest.buildId.length > 0, "Precache buildId is missing.");
  invariant(Array.isArray(manifest.assets), "Precache assets must be an array.");
  invariant(Array.isArray(manifest.routes), "Precache routes must be an array.");
  invariant(
    manifest.assets.every((item) => typeof item === "string"),
    "Precache assets must contain only strings."
  );
  invariant(
    manifest.routes.every((item) => typeof item === "string"),
    "Precache routes must contain only strings."
  );

  return manifest;
}

export function parseHeaders(source) {
  const blocks = new Map();
  let currentPath;

  for (const rawLine of source.split(/\r?\n/)) {
    if (!rawLine.trim()) {
      currentPath = undefined;
      continue;
    }
    if (!/^\s/.test(rawLine)) {
      currentPath = rawLine.trim();
      invariant(!blocks.has(currentPath), `Duplicate _headers path block: ${currentPath}`);
      blocks.set(currentPath, new Map());
      continue;
    }

    invariant(currentPath, `Header appears before a path rule: ${rawLine.trim()}`);
    const separator = rawLine.indexOf(":");
    invariant(separator > 0, `Invalid _headers line: ${rawLine.trim()}`);
    blocks.get(currentPath).set(rawLine.slice(0, separator).trim().toLowerCase(), rawLine.slice(separator + 1).trim());
  }

  return blocks;
}

function validateHeaders(source) {
  const blocks = parseHeaders(source);
  const globalHeaders = blocks.get("/*");
  invariant(globalHeaders, '_headers must define a global "/*" block.');

  const csp = globalHeaders.get("content-security-policy") ?? "";
  for (const directive of requiredCspDirectives) {
    invariant(csp.includes(directive), `Global Content-Security-Policy is missing: ${directive}`);
  }
  invariant(globalHeaders.get("referrer-policy"), "Global Referrer-Policy is missing.");
  invariant(globalHeaders.get("x-content-type-options")?.toLowerCase() === "nosniff", "nosniff is missing.");
  invariant(globalHeaders.get("x-frame-options")?.toUpperCase() === "DENY", "X-Frame-Options must be DENY.");
  invariant(globalHeaders.get("permissions-policy"), "Global Permissions-Policy is missing.");

  const expectedCachePolicies = new Map([
    ["/_next/static/*", ["max-age=31536000", "immutable"]],
    ["/*.html", ["max-age=0", "must-revalidate"]],
    ["/sw.js", ["no-store", "must-revalidate"]],
    ["/precache-manifest.js", ["no-store", "must-revalidate"]],
    ["/manifest.json", ["no-cache", "must-revalidate"]],
  ]);
  for (const [route, fragments] of expectedCachePolicies) {
    const policy = blocks.get(route)?.get("cache-control")?.toLowerCase() ?? "";
    for (const fragment of fragments) {
      invariant(policy.includes(fragment), `${route} Cache-Control is missing: ${fragment}`);
    }
  }
}

function toOutputPath(outputDirectory, pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const segments = decodedPath.split("/").filter(Boolean);
  invariant(!segments.some((segment) => segment === "." || segment === ".."), `Unsafe exported path: ${pathname}`);
  return path.join(outputDirectory, ...segments);
}

async function isFile(filename) {
  try {
    return (await stat(filename)).isFile();
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function resolveExportedReference(pathname, outputDirectory) {
  const directPath = toOutputPath(outputDirectory, pathname);
  const candidates = pathname.endsWith("/")
    ? [path.join(directPath, "index.html")]
    : [directPath, path.join(directPath, "index.html"), `${directPath}.html`];
  for (const candidate of candidates) {
    if (await isFile(candidate)) return candidate;
  }
  return null;
}

export function extractHtmlReferences(html) {
  return [...html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
}

function isExternalOrEmbeddedReference(reference) {
  return /^(?:#|data:|blob:|mailto:|tel:|javascript:|https?:\/\/|\/\/)/i.test(reference);
}

async function validateHtmlReferences({ outputDirectory, htmlFiles, basePath }) {
  let checkedReferences = 0;
  const origin = "https://static-export.invalid";

  for (const htmlPath of htmlFiles) {
    const relativeHtmlPath = path.relative(outputDirectory, htmlPath).replaceAll(path.sep, "/");
    const deploymentPath = `${basePath}/${relativeHtmlPath === "index.html" ? "" : relativeHtmlPath}`;
    const html = await readFile(htmlPath, "utf8");

    for (const reference of extractHtmlReferences(html)) {
      if (isExternalOrEmbeddedReference(reference)) continue;
      if (reference.startsWith("/")) {
        invariant(
          !basePath || reference === basePath || reference.startsWith(`${basePath}/`),
          `${relativeHtmlPath} contains an absolute reference outside base path ${basePath}: ${reference}`
        );
      }

      const url = new URL(reference, `${origin}${deploymentPath}`);
      if (url.origin !== origin) continue;
      invariant(
        !basePath || url.pathname === basePath || url.pathname.startsWith(`${basePath}/`),
        `${relativeHtmlPath} resolves outside base path ${basePath}: ${reference}`
      );
      const exportedPathname = basePath ? url.pathname.slice(basePath.length) || "/" : url.pathname;
      invariant(
        await resolveExportedReference(exportedPathname, outputDirectory),
        `${relativeHtmlPath} references a missing exported file or route: ${reference}`
      );
      checkedReferences += 1;
    }
  }

  return checkedReferences;
}

function validateWebManifest(manifest) {
  for (const property of ["id", "start_url", "scope"]) {
    const value = manifest[property];
    invariant(typeof value === "string" && value.length > 0, `manifest.json ${property} must be a non-empty string.`);
    invariant(
      !value.startsWith("/") && !/^[a-z][a-z\d+.-]*:/i.test(value),
      `manifest.json ${property} must stay relative for base-path deployment: ${value}`
    );
  }
}

async function listHtmlFiles(directory) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const child = path.join(directory, entry.name);
      return entry.isDirectory() ? listHtmlFiles(child) : entry.isFile() && child.endsWith(".html") ? [child] : [];
    })
  );
  return files.flat();
}

function routeFromHtmlPath(htmlPath, outputDirectory) {
  const relativePath = path.relative(outputDirectory, htmlPath).replaceAll(path.sep, "/");
  if (relativePath === "index.html") return "/";
  return relativePath.endsWith("/index.html") ? `/${relativePath.slice(0, -"index.html".length)}` : null;
}

export async function runBuild({ rootDirectory = projectRoot, basePath = "", logger = console } = {}) {
  const normalizedBasePath = normalizeBasePath(basePath);
  logger.log(`Building static export${normalizedBasePath ? ` for base path ${normalizedBasePath}` : ""}...`);

  await new Promise((resolve, reject) => {
    const npmCli = process.env.npm_execpath;
    const command = npmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
    const argumentsToPass = npmCli ? [npmCli, "run", "build"] : ["run", "build"];
    const child = spawn(command, argumentsToPass, {
      cwd: rootDirectory,
      env: { ...process.env, NEXT_PUBLIC_BASE_PATH: normalizedBasePath },
      shell: !npmCli && process.platform === "win32",
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Static build failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}.`));
    });
  });
}

export async function checkStaticExport({ rootDirectory = projectRoot, basePath = "", logger = console } = {}) {
  const normalizedBasePath = normalizeBasePath(basePath);
  const outputDirectory = path.join(rootDirectory, "out");
  const buildId = (await readFile(path.join(rootDirectory, ".next", "BUILD_ID"), "utf8")).trim();
  const manifestPath = path.join(outputDirectory, "precache-manifest.js");
  const precacheManifest = parsePrecacheManifest(await readFile(manifestPath, "utf8"), manifestPath);

  invariant(precacheManifest.buildId === buildId, "Precache buildId does not match the exported Next.js build.");
  invariant(
    new Set(precacheManifest.assets).size === precacheManifest.assets.length,
    "Precache assets contain duplicates."
  );
  invariant(
    new Set(precacheManifest.routes).size === precacheManifest.routes.length,
    "Precache routes contain duplicates."
  );
  for (const forbiddenAsset of forbiddenPrecacheAssets) {
    invariant(
      !precacheManifest.assets.includes(forbiddenAsset),
      `Precache must exclude mutable metadata: ${forbiddenAsset}`
    );
  }
  for (const asset of precacheManifest.assets) {
    invariant(asset.startsWith("/"), `Precache asset must be root-relative: ${asset}`);
    invariant(await isFile(toOutputPath(outputDirectory, asset)), `Precache asset is missing: ${asset}`);
  }
  for (const route of precacheManifest.routes) {
    invariant(route.startsWith("/") && route.endsWith("/"), `Precache route must use a trailing slash: ${route}`);
    invariant(await resolveExportedReference(route, outputDirectory), `Precache route is missing: ${route}`);
  }

  await Promise.all(
    ["sw.js", "precache-manifest.js", "manifest.json", "_headers"].map((file) =>
      access(path.join(outputDirectory, file))
    )
  );
  validateHeaders(await readFile(path.join(outputDirectory, "_headers"), "utf8"));
  validateWebManifest(JSON.parse(await readFile(path.join(outputDirectory, "manifest.json"), "utf8")));
  const htmlFiles = await listHtmlFiles(outputDirectory);
  invariant(htmlFiles.length > 0, "Static export contains no HTML files.");
  const exportedRoutes = htmlFiles.map((htmlPath) => routeFromHtmlPath(htmlPath, outputDirectory)).filter(Boolean);
  const missingRoutes = exportedRoutes.filter((route) => !precacheManifest.routes.includes(route));
  const unexpectedRoutes = precacheManifest.routes.filter((route) => !exportedRoutes.includes(route));
  invariant(missingRoutes.length === 0, `Precache routes omit exported routes: ${missingRoutes.join(", ")}`);
  invariant(unexpectedRoutes.length === 0, `Precache routes contain unexpected routes: ${unexpectedRoutes.join(", ")}`);
  const references = await validateHtmlReferences({ outputDirectory, htmlFiles, basePath: normalizedBasePath });

  const result = {
    buildId,
    basePath: normalizedBasePath,
    assets: precacheManifest.assets.length,
    routes: precacheManifest.routes.length,
    htmlFiles: htmlFiles.length,
    references,
  };
  logger.log(
    `Static export verified${normalizedBasePath ? ` at ${normalizedBasePath}` : ""}: ${result.routes} routes, ` +
      `${result.assets} precache assets, ${result.htmlFiles} HTML files, ${result.references} internal references.`
  );
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseCommandLine(process.argv.slice(2));
  if (options.build) await runBuild({ basePath: options.basePath });
  await checkStaticExport({ basePath: options.basePath });
}
