import { accessSync, constants, statSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { chromium, type LaunchOptions } from "playwright/test";

type BrowserProduct = "chrome" | "edge";

interface SystemBrowserCandidate {
  executablePath: string;
  product: BrowserProduct;
}

export type ChromiumResolution =
  | { kind: "explicit"; executablePath: string }
  | { kind: "bundled"; executablePath: string }
  | { kind: "system"; executablePath: string; product: BrowserProduct }
  | { kind: "playwright-default" };

export interface ChromiumResolverOptions {
  bundledExecutablePath?: string;
  cwd?: string;
  environment?: Record<string, string | undefined>;
  homeDirectory?: string;
  isExecutableFile?: (filename: string) => boolean;
  platform?: NodeJS.Platform;
}

function environmentValue(environment: Record<string, string | undefined>, name: string, platform: NodeJS.Platform) {
  if (platform !== "win32") return environment[name];
  const matchingKey = Object.keys(environment).find((key) => key.toLowerCase() === name.toLowerCase());
  return matchingKey ? environment[matchingKey] : undefined;
}

function uniqueCandidates(candidates: SystemBrowserCandidate[], platform: NodeJS.Platform) {
  const seen = new Set<string>();
  return candidates.filter(({ executablePath }) => {
    const key = platform === "win32" ? executablePath.toLowerCase() : executablePath;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function candidatesFromPath(
  environment: Record<string, string | undefined>,
  platform: NodeJS.Platform,
  executableNames: string[],
  product: BrowserProduct
) {
  const pathApi = platform === "win32" ? path.win32 : path.posix;
  const delimiter = platform === "win32" ? ";" : ":";
  const searchPath = environmentValue(environment, "PATH", platform) ?? "";
  return searchPath
    .split(delimiter)
    .filter(Boolean)
    .flatMap((directory) =>
      executableNames.map((name) => ({ executablePath: pathApi.join(directory, name), product }))
    );
}

export function getSystemBrowserCandidates({
  environment = process.env,
  homeDirectory = homedir(),
  platform = process.platform,
}: Pick<ChromiumResolverOptions, "environment" | "homeDirectory" | "platform"> = {}) {
  const pathApi = platform === "win32" ? path.win32 : path.posix;
  const candidates: SystemBrowserCandidate[] = [];

  if (platform === "win32") {
    const roots = ["ProgramW6432", "PROGRAMFILES", "LOCALAPPDATA", "PROGRAMFILES(X86)"]
      .map((name) => environmentValue(environment, name, platform))
      .filter((value): value is string => Boolean(value));
    candidates.push(
      ...roots.map((root) => ({
        executablePath: pathApi.join(root, "Google", "Chrome", "Application", "chrome.exe"),
        product: "chrome" as const,
      })),
      ...candidatesFromPath(environment, platform, ["chrome.exe"], "chrome"),
      ...roots.map((root) => ({
        executablePath: pathApi.join(root, "Microsoft", "Edge", "Application", "msedge.exe"),
        product: "edge" as const,
      })),
      ...candidatesFromPath(environment, platform, ["msedge.exe"], "edge")
    );
  } else if (platform === "darwin") {
    candidates.push(
      {
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        product: "chrome",
      },
      {
        executablePath: pathApi.join(homeDirectory, "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
        product: "chrome",
      },
      {
        executablePath: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        product: "edge",
      },
      {
        executablePath: pathApi.join(homeDirectory, "Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"),
        product: "edge",
      }
    );
  } else if (platform === "linux") {
    candidates.push(
      { executablePath: "/usr/bin/google-chrome", product: "chrome" },
      { executablePath: "/usr/bin/google-chrome-stable", product: "chrome" },
      { executablePath: "/opt/google/chrome/google-chrome", product: "chrome" },
      ...candidatesFromPath(environment, platform, ["google-chrome", "google-chrome-stable"], "chrome"),
      { executablePath: "/usr/bin/microsoft-edge", product: "edge" },
      { executablePath: "/usr/bin/microsoft-edge-stable", product: "edge" },
      { executablePath: "/opt/microsoft/msedge/msedge", product: "edge" },
      ...candidatesFromPath(environment, platform, ["microsoft-edge", "microsoft-edge-stable"], "edge")
    );
  }

  return uniqueCandidates(candidates, platform);
}

function executableFile(filename: string, platform: NodeJS.Platform) {
  try {
    if (!statSync(filename).isFile()) return false;
    if (platform !== "win32") accessSync(filename, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export function resolveChromiumExecutable({
  bundledExecutablePath = chromium.executablePath(),
  cwd = process.cwd(),
  environment = process.env,
  homeDirectory = homedir(),
  platform = process.platform,
  isExecutableFile = (filename) => executableFile(filename, platform),
}: ChromiumResolverOptions = {}): ChromiumResolution {
  const pathApi = platform === "win32" ? path.win32 : path.posix;
  const explicitPath = environmentValue(environment, "PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH", platform);

  if (explicitPath !== undefined && explicitPath !== "") {
    if (explicitPath.trim().length === 0) {
      throw new Error("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH must not be blank.");
    }
    const resolvedPath = pathApi.isAbsolute(explicitPath)
      ? pathApi.normalize(explicitPath)
      : pathApi.resolve(cwd, explicitPath);
    if (!isExecutableFile(resolvedPath)) {
      throw new Error(`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH does not point to an executable file: ${resolvedPath}`);
    }
    return { kind: "explicit", executablePath: resolvedPath };
  }

  if (Boolean(environmentValue(environment, "CI", platform))) {
    return { kind: "playwright-default" };
  }

  if (bundledExecutablePath && isExecutableFile(bundledExecutablePath)) {
    return { kind: "bundled", executablePath: bundledExecutablePath };
  }

  const systemBrowser = getSystemBrowserCandidates({ environment, homeDirectory, platform }).find(
    ({ executablePath }) => isExecutableFile(executablePath)
  );
  return systemBrowser ? { kind: "system", ...systemBrowser } : { kind: "playwright-default" };
}

export function resolveChromiumLaunchOptions(options?: ChromiumResolverOptions): LaunchOptions | undefined {
  const resolution = resolveChromiumExecutable(options);
  return resolution.kind === "playwright-default" ? undefined : { executablePath: resolution.executablePath };
}
