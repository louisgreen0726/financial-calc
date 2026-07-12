import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

import { translationCatalogs } from "@/lib/i18n";
import { MOBILE_PRIMARY_NAV, NAV_CONFIG, NAV_ITEMS } from "@/lib/nav-config";

function flattenCatalog(value: unknown, prefix = ""): Map<string, string> {
  const entries = new Map<string, string>();
  if (typeof value === "string") {
    entries.set(prefix, value);
    return entries;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Translation node must be an object or string: ${prefix || "<root>"}`);
  }

  for (const [key, child] of Object.entries(value)) {
    const childPrefix = prefix ? `${prefix}.${key}` : key;
    for (const [childKey, childValue] of flattenCatalog(child, childPrefix)) {
      entries.set(childKey, childValue);
    }
  }
  return entries;
}

async function listSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) return listSourceFiles(filename);
      return entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name) ? [filename] : [];
    })
  );
  return files.flat();
}

async function collectLiteralTranslationCalls(sourceDirectory: string): Promise<Map<string, string[]>> {
  const calls = new Map<string, string[]>();
  const sourceFiles = await listSourceFiles(sourceDirectory);

  for (const filename of sourceFiles) {
    const source = await readFile(filename, "utf8");
    const sourceFile = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "t" &&
        node.arguments.length > 0 &&
        ts.isStringLiteralLike(node.arguments[0])
      ) {
        const key = node.arguments[0].text;
        const locations = calls.get(key) ?? [];
        const position = sourceFile.getLineAndCharacterOfPosition(node.arguments[0].getStart(sourceFile));
        locations.push(`${path.relative(sourceDirectory, filename).replaceAll(path.sep, "/")}:${position.line + 1}`);
        calls.set(key, locations);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  return calls;
}

async function hasFile(filename: string): Promise<boolean> {
  try {
    await access(filename);
    return true;
  } catch {
    return false;
  }
}

describe("translation catalogs", () => {
  const english = flattenCatalog(translationCatalogs.en);
  const chinese = flattenCatalog(translationCatalogs.zh);

  it("keeps English and Chinese leaf keys identical and non-empty", () => {
    expect([...chinese.keys()].sort()).toEqual([...english.keys()].sort());
    expect(english.size).toBeGreaterThan(300);

    for (const [key, englishValue] of english) {
      expect(englishValue.trim(), `Empty English translation: ${key}`).not.toBe("");
      expect(chinese.get(key)?.trim(), `Empty Chinese translation: ${key}`).not.toBe("");
    }
  });

  it("resolves every literal t() call in production and test source", async () => {
    const calls = await collectLiteralTranslationCalls(path.resolve(process.cwd(), "src"));
    const missing = [...calls]
      .filter(([key]) => !english.has(key) || !chinese.has(key))
      .map(([key, locations]) => `${key} (${locations.join(", ")})`);

    expect(missing).toEqual([]);
    expect(calls.size).toBeGreaterThan(250);
  });

  it("gives every user route bilingual navigation copy", async () => {
    const appDirectory = path.resolve(process.cwd(), "src", "app");
    const routeDirectories = await readdir(appDirectory, { withFileTypes: true });
    const exportedRoutes = ["/"];
    for (const entry of routeDirectories) {
      if (entry.isDirectory() && (await hasFile(path.join(appDirectory, entry.name, "page.tsx")))) {
        exportedRoutes.push(`/${entry.name}`);
      }
    }

    const navigationRoutes = ["/", ...NAV_ITEMS.map(({ href }) => href)].sort();
    expect([...new Set(navigationRoutes)]).toEqual(navigationRoutes);
    expect(navigationRoutes).toEqual(exportedRoutes.sort());

    const navigationKeys = [
      ...NAV_CONFIG.map(({ titleKey }) => titleKey),
      ...NAV_ITEMS.flatMap(({ titleKey, descKey }) => [titleKey, descKey]),
      ...MOBILE_PRIMARY_NAV.map(({ labelKey }) => labelKey),
    ];
    for (const key of navigationKeys) {
      expect(english.get(key)?.trim(), `Missing English navigation copy: ${key}`).toBeTruthy();
      expect(chinese.get(key)?.trim(), `Missing Chinese navigation copy: ${key}`).toBeTruthy();
    }
  });

  it("keeps percentage and time units explicit on calculator input labels", () => {
    const percentInputKeys = [
      "tvm.annualRate",
      "cashFlow.discountRate",
      "equity.capm.rf",
      "equity.capm.rm",
      "equity.wacc.costEq",
      "equity.wacc.costDebt",
      "equity.wacc.tax",
      "equity.ddm.req",
      "equity.ddm.g",
      "bonds.coupon",
      "bonds.ytm",
      "portfolio.rf",
      "portfolio.ret",
      "portfolio.risk",
      "options.rate",
      "options.dividendYield",
      "options.vol",
      "risk.vol",
      "loans.rate",
      "macro.purchasingPower.inflation",
      "macro.realRate.nominal",
      "macro.realRate.inflation",
    ];
    for (const key of percentInputKeys) {
      expect(english.get(key), `English percentage unit missing: ${key}`).toContain("%");
      expect(chinese.get(key), `Chinese percentage unit missing: ${key}`).toContain("%");
    }

    const timeInputKeys = ["options.time", "bonds.years", "loans.term", "risk.horizon"];
    for (const key of timeInputKeys) {
      expect(english.get(key), `English time unit missing: ${key}`).toMatch(/year|day/i);
      expect(chinese.get(key), `Chinese time unit missing: ${key}`).toMatch(/年|日/);
    }
  });
});
