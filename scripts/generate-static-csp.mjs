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
        .map((source) => createHash("sha256").update(source).digest("base64"))
    ),
  ].sort();
}

function createPolicy(hashes) {
  const sources = hashes.map((hash) => `'sha256-${hash}'`);
  return `${["script-src", "'self'", ...sources].join(" ")}; worker-src 'self' blob:`;
}

export function createStaticScriptPolicy(html) {
  const dom = new JSDOM(html);
  try {
    return createPolicy(getInlineScriptHashes(dom.window.document));
  } finally {
    dom.window.close();
  }
}

export function injectStaticScriptPolicy(html, filename = "HTML document") {
  const dom = new JSDOM(html, { includeNodeLocations: true });
  try {
    const { document } = dom.window;
    invariant(document.head, `${filename} has no head element.`);
    invariant(getCspMetaElements(document).length === 0, `${filename} already has a CSP meta policy.`);

    const headLocation = dom.nodeLocation(document.head);
    invariant(headLocation?.startTag, `${filename} head location is unavailable.`);
    const policy = createPolicy(getInlineScriptHashes(document));
    const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
    const insertionOffset = headLocation.startTag.endOffset;
    return `${html.slice(0, insertionOffset)}${meta}${html.slice(insertionOffset)}`;
  } finally {
    dom.window.close();
  }
}

export function validateStaticScriptPolicy(html, filename = "HTML document") {
  const dom = new JSDOM(html, { includeNodeLocations: true });
  try {
    const { document } = dom.window;
    const policies = getCspMetaElements(document);
    invariant(policies.length === 1, `${filename} must contain exactly one CSP meta policy.`);

    const hashes = getInlineScriptHashes(document);
    const actualPolicy = policies[0].getAttribute("content") ?? "";
    const expectedPolicy = createPolicy(hashes);
    invariant(actualPolicy === expectedPolicy, `${filename} CSP hashes do not match its inline scripts.`);
    invariant(
      !actualPolicy.includes("'unsafe-inline'"),
      `${filename} CSP meta policy must not allow unsafe inline scripts.`
    );

    const metaLocation = dom.nodeLocation(policies[0]);
    const firstScript = document.querySelector("script");
    const firstScriptLocation = firstScript ? dom.nodeLocation(firstScript) : null;
    invariant(
      metaLocation && (!firstScriptLocation || metaLocation.startOffset < firstScriptLocation.startOffset),
      `${filename} CSP meta policy must precede every script.`
    );

    return { hashes: hashes.length, policy: actualPolicy };
  } finally {
    dom.window.close();
  }
}

export async function generateStaticCsp({ rootDirectory = projectRoot } = {}) {
  const outputDirectory = path.join(rootDirectory, "out");
  const htmlFiles = await listHtmlFiles(outputDirectory);
  invariant(htmlFiles.length > 0, "Static export contains no HTML files to harden.");

  let hashes = 0;
  for (const htmlFile of htmlFiles) {
    const source = await readFile(htmlFile, "utf8");
    const hardened = injectStaticScriptPolicy(source, path.relative(rootDirectory, htmlFile));
    await writeFile(htmlFile, hardened, "utf8");
    hashes += validateStaticScriptPolicy(hardened, path.relative(rootDirectory, htmlFile)).hashes;
  }

  return { documents: htmlFiles.length, hashes };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await generateStaticCsp();
  console.log(
    `Generated hash-based script CSP for ${result.documents} HTML documents and ${result.hashes} inline scripts.`
  );
}
