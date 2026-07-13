import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

interface StaticCspGenerator {
  getRuntimeStyleHashes(): string[];
  createStaticContentPolicy(html: string): string;
  injectStaticContentPolicy(html: string, filename?: string): string;
  validateStaticContentPolicy(
    html: string,
    filename?: string
  ): { scriptHashes: number; styleHashes: number; runtimeStyleHashes: number; policy: string };
}

const generatorUrl = pathToFileURL(path.resolve(process.cwd(), "scripts", "generate-static-csp.mjs"));
const generator = (await import(/* @vite-ignore */ generatorUrl.href)) as StaticCspGenerator;

function hash(source: string) {
  return createHash("sha256").update(source).digest("base64");
}

const source =
  '<!doctype html><html><head><meta charset="utf-8"><style>body { color: navy; }</style>' +
  '<script src="/app.js"></script>' +
  "<script>window.first = true;</script></head><body><script>window.second = true;</script></body></html>";

describe("static hash-based content CSP", () => {
  it("injects exact script and style-element policies before active content", () => {
    const hardened = generator.injectStaticContentPolicy(source, "fixture.html");
    const result = generator.validateStaticContentPolicy(hardened, "fixture.html");
    const expectedScriptHashes = [hash("window.first = true;"), hash("window.second = true;")].sort();
    const expectedStyleHashes = [hash("body { color: navy; }"), ...generator.getRuntimeStyleHashes()].sort();

    expect(result.scriptHashes).toBe(2);
    expect(result.styleHashes).toBe(1);
    expect(result.runtimeStyleHashes).toBe(2);
    expect(result.policy).toBe(
      `${["script-src 'self'", ...expectedScriptHashes.map((value) => `'sha256-${value}'`)].join(" ")}; ` +
        `${["style-src-elem 'self'", ...expectedStyleHashes.map((value) => `'sha256-${value}'`)].join(" ")}; ` +
        "style-src-attr 'unsafe-inline'; worker-src 'self' blob:"
    );
    const policyOffset = hardened.indexOf('http-equiv="Content-Security-Policy"');
    expect(policyOffset).toBeLessThan(hardened.indexOf("<script"));
    expect(policyOffset).toBeLessThan(hardened.indexOf("<style"));
    expect(result.policy).not.toMatch(/(?:script-src|style-src-elem)[^;]*'unsafe-inline'/);
    expect(result.policy).toContain("style-src-attr 'unsafe-inline'");
  });

  it("detects missing, duplicate, and stale policies", () => {
    expect(() => generator.validateStaticContentPolicy(source, "missing.html")).toThrow(/exactly one/);

    const hardened = generator.injectStaticContentPolicy(source);
    expect(() => generator.injectStaticContentPolicy(hardened)).toThrow(/already has/);
    expect(() => generator.validateStaticContentPolicy(hardened.replace("window.second", "window.changed"))).toThrow(
      /do not match/
    );
    expect(() => generator.validateStaticContentPolicy(hardened.replace("color: navy", "color: red"))).toThrow(
      /do not match/
    );

    const policyMeta = hardened.match(/<meta http-equiv="Content-Security-Policy"[^>]+>/)?.[0];
    expect(policyMeta).toBeDefined();
    const latePolicy = hardened.replace(policyMeta ?? "", "").replace("</style>", `</style>${policyMeta}`);
    expect(() => generator.validateStaticContentPolicy(latePolicy)).toThrow(/precede every script and style/);
  });

  it("emits restrictive element policies even when a document has no inline content", () => {
    const runtimeStyleSources = generator.getRuntimeStyleHashes().map((value) => `'sha256-${value}'`);
    expect(generator.createStaticContentPolicy("<html><head></head><body></body></html>")).toBe(
      `script-src 'self'; ${["style-src-elem 'self'", ...runtimeStyleSources].join(" ")}; ` +
        "style-src-attr 'unsafe-inline'; worker-src 'self' blob:"
    );
  });
});
