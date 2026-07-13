import type { NextConfig } from "next";

// PWA is handled manually via public/sw.js + src/components/service-worker-registration.tsx.
// Keep this static-export setup free of server/runtime assumptions.

export function resolveNextDistDir(value = process.env.NEXT_DIST_DIR) {
  if (!value) return undefined;
  if (!/^\.next\/playwright-[1-9]\d*$/.test(value)) {
    throw new Error("NEXT_DIST_DIR must match .next/playwright-<positive runner PID>.");
  }
  return value;
}

export function resolveNextTypeScriptConfigPath(distDir = resolveNextDistDir()) {
  return distDir ? "tsconfig.playwright.json" : undefined;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || undefined;
const distDir = resolveNextDistDir();
const tsconfigPath = resolveNextTypeScriptConfigPath(distDir);

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  distDir,
  ...(tsconfigPath ? { typescript: { tsconfigPath } } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
