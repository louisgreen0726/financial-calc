import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeBasePath, withBasePath } from "./static-export-paths.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function scopeStaticHeaders(source, basePath = "") {
  const normalizedBasePath = normalizeBasePath(basePath);
  if (!normalizedBasePath) return source;

  return source.replace(/^[^\s\r\n].*$/gm, (selector) => {
    if (!selector.startsWith("/")) {
      throw new Error(`Invalid _headers path selector: ${selector}`);
    }
    return withBasePath(selector, normalizedBasePath);
  });
}

export async function generateStaticHeaders({
  rootDirectory = projectRoot,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "",
} = {}) {
  const templatePath = path.join(rootDirectory, "public", "_headers");
  const outputPath = path.join(rootDirectory, "out", "_headers");
  const source = scopeStaticHeaders(await readFile(templatePath, "utf8"), basePath);
  await writeFile(outputPath, source, "utf8");
  return source;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? "");
  await generateStaticHeaders({ basePath });
  console.log(`Generated static deployment headers${basePath ? ` for ${basePath}` : ""}.`);
}
