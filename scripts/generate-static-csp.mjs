import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { JSDOM } from "jsdom";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cspHttpEquiv = "content-security-policy";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function hashSource(source) {
  return createHash("sha256").update(source).digest("base64");
}

function extractInjectedStyleSources(moduleSource, filename) {
  const sources = [...moduleSource.matchAll(/__insertCSS\(("(?:\\.|[^"\\])*")\);/g)].map((match) =>
    JSON.parse(match[1])
  );
  invariant(sources.length === 1, `${filename} must contain exactly one statically analyzable CSS injection.`);
  return sources;
}

const sonnerModulePath = fileURLToPath(import.meta.resolve("sonner"));
const runtimeStyleHashes = [
  ...new Set(
    ["", ...extractInjectedStyleSources(await readFile(sonnerModulePath, "utf8"), sonnerModulePath)].map(hashSource)
  ),
].sort();

export function getRuntimeStyleHashes() {
  return [...runtimeStyleHashes];
}

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const child = path.join(directory, entry.name);
      return entry.isDirectory() ? listHtmlFiles(child) : entry.isFile() && child.endsWith(".html") ? [child] : [];
    })
  );
  return files.flat();
}

function getCspMetaElements(document) {
  return [...document.querySelectorAll("meta[http-equiv]")].filter(
    (element) => element.getAttribute("http-equiv")?.toLowerCase() === cspHttpEquiv
  );
}

function getInlineScriptHashes(document) {
  return [
    ...new Set(
      [...document.querySelectorAll("script:not([src])")]
        .map((script) => script.textContent)
        .filter((source) => source.length > 0)
        .map(hashSource)
    ),
  ].sort();
}

function getInlineStyleHashes(document) {
  return [
    ...new Set(
      [...document.querySelectorAll("style")]
        .map((style) => style.textContent)
        .filter((source) => source.length > 0)
        .map(hashSource)
    ),
  ].sort();
}

function createPolicy({ scriptHashes, styleHashes }) {
  const scriptSources = scriptHashes.map((hash) => `'sha256-${hash}'`);
  const styleSources = [...new Set([...styleHashes, ...runtimeStyleHashes])].sort().map((hash) => `'sha256-${hash}'`);
  return (
    `${["script-src", "'self'", ...scriptSources].join(" ")}; ` +
    `${["style-src-elem", "'self'", ...styleSources].join(" ")}; ` +
    "style-src-attr 'unsafe-inline'; worker-src 'self' blob:"
  );
}

function getInlineContentHashes(document) {
  return {
    scriptHashes: getInlineScriptHashes(document),
    styleHashes: getInlineStyleHashes(document),
  };
}

export function createStaticContentPolicy(html) {
  const dom = new JSDOM(html);
  try {
    return createPolicy(getInlineContentHashes(dom.window.document));
  } finally {
    dom.window.close();
  }
}

export function injectStaticContentPolicy(html, filename = "HTML document") {
  const dom = new JSDOM(html, { includeNodeLocations: true });
  try {
    const { document } = dom.window;
    invariant(document.head, `${filename} has no head element.`);
    invariant(getCspMetaElements(document).length === 0, `${filename} already has a CSP meta policy.`);

    const headLocation = dom.nodeLocation(document.head);
    invariant(headLocation?.startTag, `${filename} head location is unavailable.`);
    const policy = createPolicy(getInlineContentHashes(document));
    const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
    const insertionOffset = headLocation.startTag.endOffset;
    return `${html.slice(0, insertionOffset)}${meta}${html.slice(insertionOffset)}`;
  } finally {
    dom.window.close();
  }
}

export function validateStaticContentPolicy(html, filename = "HTML document") {
  const dom = new JSDOM(html, { includeNodeLocations: true });
  try {
    const { document } = dom.window;
    const policies = getCspMetaElements(document);
    invariant(policies.length === 1, `${filename} must contain exactly one CSP meta policy.`);

    const { scriptHashes, styleHashes } = getInlineContentHashes(document);
    const actualPolicy = policies[0].getAttribute("content") ?? "";
    const expectedPolicy = createPolicy({ scriptHashes, styleHashes });
    invariant(actualPolicy === expectedPolicy, `${filename} CSP hashes do not match its inline scripts and styles.`);
    invariant(
      !actualPolicy.match(/(?:^|;)\s*(?:script-src|style-src-elem)\s+[^;]*'unsafe-inline'/),
      `${filename} CSP meta policy must not allow unsafe inline scripts or style elements.`
    );
    invariant(
      actualPolicy.includes("style-src-attr 'unsafe-inline'"),
      `${filename} CSP meta policy must preserve runtime style-attribute compatibility.`
    );

    const metaLocation = dom.nodeLocation(policies[0]);
    const firstScript = document.querySelector("script");
    const firstStyle = document.querySelector("style");
    const firstScriptLocation = firstScript ? dom.nodeLocation(firstScript) : null;
    const firstStyleLocation = firstStyle ? dom.nodeLocation(firstStyle) : null;
    invariant(
      metaLocation &&
        (!firstScriptLocation || metaLocation.startOffset < firstScriptLocation.startOffset) &&
        (!firstStyleLocation || metaLocation.startOffset < firstStyleLocation.startOffset),
      `${filename} CSP meta policy must precede every script and style element.`
    );

    return {
      scriptHashes: scriptHashes.length,
      styleHashes: styleHashes.length,
      runtimeStyleHashes: runtimeStyleHashes.length,
      policy: actualPolicy,
    };
  } finally {
    dom.window.close();
  }
}

export async function generateStaticCsp({ rootDirectory = projectRoot } = {}) {
  const outputDirectory = path.join(rootDirectory, "out");
  const htmlFiles = await listHtmlFiles(outputDirectory);
  invariant(htmlFiles.length > 0, "Static export contains no HTML files to harden.");

  let scriptHashes = 0;
  let styleHashes = 0;
  for (const htmlFile of htmlFiles) {
    const source = await readFile(htmlFile, "utf8");
    const hardened = injectStaticContentPolicy(source, path.relative(rootDirectory, htmlFile));
    await writeFile(htmlFile, hardened, "utf8");
    const validation = validateStaticContentPolicy(hardened, path.relative(rootDirectory, htmlFile));
    scriptHashes += validation.scriptHashes;
    styleHashes += validation.styleHashes;
  }

  return { documents: htmlFiles.length, scriptHashes, styleHashes, runtimeStyleHashes: runtimeStyleHashes.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await generateStaticCsp();
  console.log(
    `Generated hash-based CSP for ${result.documents} HTML documents, ${result.scriptHashes} inline scripts, and ` +
      `${result.styleHashes} inline style blocks with ${result.runtimeStyleHashes} runtime style allowances per document.`
  );
}
