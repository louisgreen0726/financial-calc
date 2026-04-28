import type { NextConfig } from "next";

// PWA is handled manually via public/sw.js + src/components/service-worker-registration.tsx.
// Keep this static-export setup free of server/runtime assumptions.

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
