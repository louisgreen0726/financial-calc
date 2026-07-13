import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { createBrowserConfig } from "../../playwright.config";
import { createPwaConfig } from "../../playwright.pwa.config";
import {
  getSystemBrowserCandidates,
  resolveChromiumExecutable,
  resolveChromiumLaunchOptions,
  type ChromiumResolverOptions,
} from "../../scripts/resolve-playwright-browser";

const WINDOWS_BUNDLED = "C:\\pw\\chromium\\chrome.exe";
const WINDOWS_CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const WINDOWS_EDGE = "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe";

function executableProbe(...filenames: string[]) {
  const files = new Set(filenames);
  return vi.fn((filename: string) => files.has(filename));
}

function windowsOptions(overrides: Partial<ChromiumResolverOptions> = {}): ChromiumResolverOptions {
  return {
    bundledExecutablePath: WINDOWS_BUNDLED,
    cwd: "C:\\workspace",
    environment: {
      ProgramFiles: "C:\\Program Files",
      LOCALAPPDATA: "C:\\Users\\tester\\AppData\\Local",
    },
    homeDirectory: "C:\\Users\\tester",
    platform: "win32",
    isExecutableFile: executableProbe(),
    ...overrides,
  };
}

function launchOptionsFrom(config: unknown) {
  return (config as { use?: { launchOptions?: { executablePath?: string } } }).use?.launchOptions;
}

describe("Playwright Chromium browser resolution", () => {
  it("gives a valid explicit absolute path priority over bundled and system browsers", () => {
    const explicitPath = "D:\\Browsers\\chrome.exe";
    const result = resolveChromiumExecutable(
      windowsOptions({
        environment: { PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: explicitPath },
        isExecutableFile: executableProbe(explicitPath, WINDOWS_BUNDLED, WINDOWS_CHROME),
      })
    );

    expect(result).toEqual({ kind: "explicit", executablePath: explicitPath });
  });

  it("resolves a relative explicit path against cwd and reads Windows environment keys case-insensitively", () => {
    const resolvedPath = "C:\\workspace\\browser\\chrome.exe";
    expect(
      resolveChromiumExecutable(
        windowsOptions({
          environment: { playwright_chromium_executable_path: "browser\\chrome.exe" },
          isExecutableFile: executableProbe(resolvedPath),
        })
      )
    ).toEqual({ kind: "explicit", executablePath: resolvedPath });
  });

  it("fails fast for blank or invalid explicit paths instead of silently falling back", () => {
    expect(() =>
      resolveChromiumExecutable(windowsOptions({ environment: { PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: "   " } }))
    ).toThrow(/must not be blank/);
    expect(() =>
      resolveChromiumExecutable(
        windowsOptions({ environment: { PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: "missing\\chrome.exe" } })
      )
    ).toThrow(/C:\\workspace\\missing\\chrome\.exe/);
  });

  it("launches the exact bundled full Chromium path that was probed locally", () => {
    const probe = executableProbe(WINDOWS_BUNDLED, WINDOWS_CHROME);
    const options = windowsOptions({ isExecutableFile: probe });

    expect(resolveChromiumExecutable(options)).toEqual({
      kind: "bundled",
      executablePath: WINDOWS_BUNDLED,
    });
    expect(resolveChromiumLaunchOptions(options)).toEqual({ executablePath: WINDOWS_BUNDLED });
  });

  it("keeps Playwright's default pinned launch in CI even when local executable candidates exist", () => {
    const options = windowsOptions({
      environment: { CI: "true", ProgramFiles: "C:\\Program Files" },
      isExecutableFile: executableProbe(WINDOWS_BUNDLED, WINDOWS_CHROME),
    });

    expect(resolveChromiumExecutable(options)).toEqual({ kind: "playwright-default" });
    expect(resolveChromiumLaunchOptions(options)).toBeUndefined();
  });

  it("selects local Chrome before Edge and falls back to Edge deterministically", () => {
    expect(
      resolveChromiumExecutable(windowsOptions({ isExecutableFile: executableProbe(WINDOWS_CHROME, WINDOWS_EDGE) }))
    ).toEqual({ kind: "system", product: "chrome", executablePath: WINDOWS_CHROME });
    expect(resolveChromiumExecutable(windowsOptions({ isExecutableFile: executableProbe(WINDOWS_EDGE) }))).toEqual({
      kind: "system",
      product: "edge",
      executablePath: WINDOWS_EDGE,
    });
  });

  it("deduplicates Windows roots and keeps Chrome candidates ahead of Edge", () => {
    const candidates = getSystemBrowserCandidates({
      platform: "win32",
      homeDirectory: "C:\\Users\\tester",
      environment: {
        ProgramW6432: "C:\\Program Files",
        PROGRAMFILES: "C:\\Program Files",
        LOCALAPPDATA: "C:\\Users\\tester\\AppData\\Local",
        PATH: "C:\\Tools;C:\\Tools",
      },
    });

    expect(candidates.filter(({ executablePath }) => executablePath === WINDOWS_CHROME)).toHaveLength(1);
    expect(candidates.findIndex(({ product }) => product === "chrome")).toBe(0);
    expect(candidates.findIndex(({ product }) => product === "edge")).toBeGreaterThan(
      candidates.findLastIndex(({ product }) => product === "chrome")
    );
  });

  it("uses stable macOS system and per-user Chrome-before-Edge candidates", () => {
    expect(getSystemBrowserCandidates({ platform: "darwin", homeDirectory: "/Users/tester", environment: {} })).toEqual(
      [
        {
          executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          product: "chrome",
        },
        {
          executablePath: "/Users/tester/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          product: "chrome",
        },
        {
          executablePath: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          product: "edge",
        },
        {
          executablePath: "/Users/tester/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          product: "edge",
        },
      ]
    );
  });

  it("checks fixed and PATH-derived Linux Chrome candidates before Edge", () => {
    const candidates = getSystemBrowserCandidates({
      platform: "linux",
      homeDirectory: "/home/tester",
      environment: { PATH: "/custom/bin:/usr/local/bin" },
    });

    expect(candidates.slice(0, 5).map(({ executablePath }) => executablePath)).toEqual([
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/opt/google/chrome/google-chrome",
      "/custom/bin/google-chrome",
      "/custom/bin/google-chrome-stable",
    ]);
    expect(candidates.findIndex(({ product }) => product === "edge")).toBeGreaterThan(
      candidates.findLastIndex(({ product }) => product === "chrome")
    );
  });

  it("returns the non-throwing Playwright default when no candidate exists", () => {
    expect(
      resolveChromiumExecutable({
        bundledExecutablePath: "/missing/chromium",
        cwd: "/workspace",
        environment: {},
        homeDirectory: "/home/tester",
        platform: "freebsd",
        isExecutableFile: executableProbe(),
      })
    ).toEqual({ kind: "playwright-default" });
  });

  it("resolves relative POSIX explicit paths with the injected platform API", () => {
    const executablePath = path.posix.resolve("/workspace", "browser/chrome");
    expect(
      resolveChromiumExecutable({
        bundledExecutablePath: "/missing/chromium",
        cwd: "/workspace",
        environment: { PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: "browser/chrome" },
        homeDirectory: "/home/tester",
        platform: "linux",
        isExecutableFile: executableProbe(executablePath),
      })
    ).toEqual({ kind: "explicit", executablePath });
  });

  it("applies the same local fallback to browser and PWA config factories", () => {
    const options = windowsOptions({ isExecutableFile: executableProbe(WINDOWS_CHROME) });

    expect(launchOptionsFrom(createBrowserConfig(options))).toEqual({ executablePath: WINDOWS_CHROME });
    expect(launchOptionsFrom(createPwaConfig("/calc", options))).toEqual({ executablePath: WINDOWS_CHROME });
  });

  it("leaves config launch options unset for a missing CI browser", () => {
    const options = windowsOptions({
      environment: { CI: "1", ProgramFiles: "C:\\Program Files" },
      isExecutableFile: executableProbe(WINDOWS_CHROME),
    });

    expect(launchOptionsFrom(createBrowserConfig(options))).toBeUndefined();
    expect(launchOptionsFrom(createPwaConfig("", options))).toBeUndefined();
  });
});
