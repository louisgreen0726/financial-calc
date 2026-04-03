import type { NextConfig } from "next";

// Note: next-pwa v5 is not fully compatible with Next.js 16 static export mode.
// PWA is handled via public/sw.js + src/components/service-worker-registration.tsx
// Use `@ducanh2912/next-pwa` for Next.js 13+ if full PWA build integration needed.

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
