import type { NextConfig } from "next";

// PWA is handled manually via public/sw.js + src/components/service-worker-registration.tsx.
// Keep this static-export setup free of server/runtime assumptions.

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
