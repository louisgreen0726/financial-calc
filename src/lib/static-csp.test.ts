import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

interface StaticCspGenerator {
  createStaticScriptPolicy(html: string): string;
  injectStaticScriptPolicy(html: string, filename?: string): string;
  validateStaticScriptPolicy(html: string, filename?: string): { hashes: number; policy: string };
}

const generatorUrl = pathToFileURL(path.resolve(process.cwd(), "scripts", "generate-static-csp.mjs"));
const generator = (await import(/* @vite-ignore */ generatorUrl.href)) as StaticCspGenerator;

function hash(source: string) {
  return createHash("sha256").update(source).digest("base64");
}

const source =
  '<!doctype html><html><head><meta charset="utf-8"><script src="/app.js"></script>' +
  "<script>window.first = true;</script></head><body><script>window.second = true;</script></body></html>";

describe("static hash-based script CSP", () => {
  it("injects an exact policy before every script", () => {
    const hardened = generator.injectStaticScriptPolicy(source, "fixture.html");
    const result = generator.validateStaticScriptPolicy(hardened, "fixture.html");
    const expectedHashes = [hash("window.first = true;"), hash("window.second = true;")].sort();

    expect(result.hashes).toBe(2);
    expect(result.policy).toBe(
      `${["script-src 'self'", ...expectedHashes.map((value) => `'sha256-${value}'`)].join(" ")}; ` +
        "worker-src 'self' blob:"
    );
    expect(hardened.indexOf('http-equiv="Content-Security-Policy"')).toBeLessThan(hardened.indexOf("<script"));
    expect(result.policy).not.toContain("unsafe-inline");
  });

  it("detects missing, duplicate, and stale policies", () => {
    expect(() => generator.validateStaticScriptPolicy(source, "missing.html")).toThrow(/exactly one/);

    const hardened = generator.injectStaticScriptPolicy(source);
    expect(() => generator.injectStaticScriptPolicy(hardened)).toThrow(/already has/);
    expect(() => generator.validateStaticScriptPolicy(hardened.replace("window.second", "window.changed"))).toThrow(
      /do not match/
    );
  });

  it("emits a restrictive script policy even when a document has no inline scripts", () => {
    expect(generator.createStaticScriptPolicy("<html><head></head><body></body></html>")).toBe(
      "script-src 'self'; worker-src 'self' blob:"
    );
  });
});
