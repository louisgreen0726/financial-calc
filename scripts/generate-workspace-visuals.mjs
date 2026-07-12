import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "visuals");

const palettes = {
  light: {
    backgroundA: "#f6fafb",
    backgroundB: "#e8f0f3",
    grid: "#426675",
    emerald: "#008f73",
    cyan: "#43c7cf",
    cobalt: "#3978e7",
    gold: "#e7a744",
    rose: "#dc6680",
    glass: "#ffffff",
    line: "#315d6d",
  },
  dark: {
    backgroundA: "#070a0c",
    backgroundB: "#10171a",
    grid: "#9bc7cf",
    emerald: "#23d2aa",
    cyan: "#59dbe4",
    cobalt: "#5b8ff2",
    gold: "#f4bd62",
    rose: "#ef6f8c",
    glass: "#d8f8f3",
    line: "#9bc7cf",
  },
};

function buildVisual(theme) {
  const p = palettes[theme];
  const isDark = theme === "dark";
  const glowOpacity = isDark ? 0.72 : 0.42;
  const planeOpacity = isDark ? 0.1 : 0.24;
  const dataOpacity = isDark ? 0.2 : 0.13;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1600" viewBox="0 0 2560 1600">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${p.backgroundA}"/>
          <stop offset="1" stop-color="${p.backgroundB}"/>
        </linearGradient>
        <linearGradient id="ribbon-main" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${p.emerald}"/>
          <stop offset="0.38" stop-color="${p.cyan}"/>
          <stop offset="0.72" stop-color="${p.cobalt}"/>
          <stop offset="1" stop-color="${p.rose}"/>
        </linearGradient>
        <linearGradient id="ribbon-warm" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="${p.emerald}"/>
          <stop offset="0.5" stop-color="${p.gold}"/>
          <stop offset="1" stop-color="${p.rose}"/>
        </linearGradient>
        <linearGradient id="glass-plane" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${p.glass}" stop-opacity="0.65"/>
          <stop offset="0.42" stop-color="${p.glass}" stop-opacity="0.08"/>
          <stop offset="1" stop-color="${p.glass}" stop-opacity="0"/>
        </linearGradient>
        <pattern id="fine-grid" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M64 0H0V64" fill="none" stroke="${p.grid}" stroke-opacity="${isDark ? 0.08 : 0.09}" stroke-width="1"/>
        </pattern>
        <pattern id="micro-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="${p.grid}" stroke-opacity="${isDark ? 0.025 : 0.03}" stroke-width="1"/>
        </pattern>
        <filter id="soft-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="38"/>
        </filter>
        <filter id="wide-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="90"/>
        </filter>
        <filter id="texture" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="17" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 ${isDark ? 0.035 : 0.025}"/>
          </feComponentTransfer>
        </filter>
      </defs>

      <rect width="2560" height="1600" fill="url(#background)"/>
      <rect width="2560" height="1600" fill="url(#micro-grid)"/>
      <rect width="2560" height="1600" fill="url(#fine-grid)"/>

      <path d="M1690 -220 C1950 210 2040 430 2610 610" fill="none" stroke="url(#ribbon-main)" stroke-width="360" stroke-linecap="round" opacity="${glowOpacity * 0.38}" filter="url(#wide-glow)"/>
      <path d="M1690 -220 C1950 210 2040 430 2610 610" fill="none" stroke="url(#ribbon-main)" stroke-width="190" stroke-linecap="round" opacity="${glowOpacity}" filter="url(#soft-glow)"/>
      <path d="M1690 -220 C1950 210 2040 430 2610 610" fill="none" stroke="url(#ribbon-main)" stroke-width="92" stroke-linecap="round" opacity="${isDark ? 0.88 : 0.62}"/>

      <path d="M-360 1410 C300 1080 550 1240 980 1660" fill="none" stroke="url(#ribbon-warm)" stroke-width="280" stroke-linecap="round" opacity="${glowOpacity * 0.3}" filter="url(#wide-glow)"/>
      <path d="M-360 1410 C300 1080 550 1240 980 1660" fill="none" stroke="url(#ribbon-warm)" stroke-width="112" stroke-linecap="round" opacity="${isDark ? 0.58 : 0.35}" filter="url(#soft-glow)"/>

      <path d="M2250 -80 L2660 300 L2050 990 L1650 600 Z" fill="url(#glass-plane)" opacity="${planeOpacity}"/>
      <path d="M2160 210 L2500 520 L1900 1160 L1570 830 Z" fill="none" stroke="${p.glass}" stroke-opacity="${isDark ? 0.16 : 0.28}" stroke-width="2"/>
      <path d="M-120 960 L510 690 L980 1540 L310 1740 Z" fill="url(#glass-plane)" opacity="${planeOpacity * 0.55}"/>

      <g fill="none" stroke="${p.line}" stroke-width="2" opacity="${dataOpacity}">
        <path d="M180 360 C390 310 520 450 720 390 S1070 220 1260 310"/>
        <path d="M260 480 C440 520 610 390 790 470 S1110 610 1320 500"/>
        <path d="M1260 1240 C1480 1080 1650 1180 1810 1020 S2120 780 2360 860"/>
      </g>
      <g fill="${p.glass}" opacity="${isDark ? 0.4 : 0.5}">
        <rect x="176" y="356" width="8" height="8" rx="2"/>
        <rect x="716" y="386" width="8" height="8" rx="2"/>
        <rect x="1256" y="306" width="8" height="8" rx="2"/>
        <rect x="1256" y="1236" width="8" height="8" rx="2"/>
        <rect x="1806" y="1016" width="8" height="8" rx="2"/>
        <rect x="2356" y="856" width="8" height="8" rx="2"/>
      </g>

      <rect width="2560" height="1600" filter="url(#texture)" opacity="1"/>
    </svg>`;
}

await mkdir(outputDir, { recursive: true });

await Promise.all(
  Object.keys(palettes).map(async (theme) => {
    const output = path.join(outputDir, `workspace-${theme}.webp`);
    await sharp(Buffer.from(buildVisual(theme))).webp({ quality: 88, effort: 6 }).toFile(output);
    console.log(`Generated ${path.relative(root, output)}`);
  })
);
