/**
 * Design Tokens — single source of truth for spacing, typography, radii, shadows.
 * Inspired by Notion/Linear/Vercel design systems.
 *
 * USAGE GUIDE:
 * - Import tokens for inline style overrides or when Tailwind classes are insufficient:
 *   `import { SPACING, TYPOGRAPHY, CARD_BASE } from "@/lib/design-tokens";`
 * - CARD_BASE/CARD_HOVER/CARD_RESULT/INPUT_BASE/BUTTON_PRIMARY are Tailwind class-string presets
 *   for consistent component styling. Use with the `cn()` utility.
 * - CHART_COLORS_DARK: Use for recharts fill/stroke props in dark-mode-aware charts.
 * - Z_INDEX: Use for fixed/modal/tooltip elements that need precise stacking order.
 */

// ─── Spacing Scale ──────────────────────────────────────────────
export const SPACING = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "0.75rem", // 12px
  lg: "1rem", // 16px
  xl: "1.5rem", // 24px
  "2xl": "2rem", // 32px
  "3xl": "2.5rem", // 40px
  "4xl": "3rem", // 48px
} as const;

// ─── Typography Scale ───────────────────────────────────────────
export const TYPOGRAPHY = {
  display: { fontSize: "2.25rem", lineHeight: "2.5rem", fontWeight: "800", letterSpacing: "-0.025em" }, // 36px
  h1: { fontSize: "1.875rem", lineHeight: "2.25rem", fontWeight: "700", letterSpacing: "-0.025em" }, // 30px
  h2: { fontSize: "1.5rem", lineHeight: "2rem", fontWeight: "600", letterSpacing: "-0.015em" }, // 24px
  h3: { fontSize: "1.25rem", lineHeight: "1.75rem", fontWeight: "600", letterSpacing: "-0.01em" }, // 20px
  h4: { fontSize: "1.125rem", lineHeight: "1.75rem", fontWeight: "600" }, // 18px
  body: { fontSize: "1rem", lineHeight: "1.5rem", fontWeight: "400" }, // 16px
  sm: { fontSize: "0.875rem", lineHeight: "1.25rem", fontWeight: "400" }, // 14px
  xs: { fontSize: "0.75rem", lineHeight: "1rem", fontWeight: "400" }, // 12px
} as const;

// ─── Border Radius ──────────────────────────────────────────────
export const RADIUS = {
  sm: "0.375rem", // 6px
  md: "0.5rem", // 8px
  lg: "0.75rem", // 12px
  xl: "1rem", // 16px
  "2xl": "1.5rem", // 24px
  full: "9999px",
} as const;

// ─── Shadows (Light Mode) ───────────────────────────────────────
export const SHADOWS = {
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;

// ─── Transitions ────────────────────────────────────────────────
export const TRANSITIONS = {
  fast: "100ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "250ms cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

// ─── Z-Index Scale ──────────────────────────────────────────────
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  toast: 1070,
  tooltip: 1080,
} as const;

// ─── Chart Colors (Dark Mode Override) ──────────────────────────
export const CHART_COLORS_DARK = {
  primary: "hsl(158 64% 52%)",
  secondary: "hsl(210 70% 60%)",
  tertiary: "hsl(25 80% 60%)",
  quaternary: "hsl(280 65% 65%)",
  quinary: "hsl(340 75% 60%)",
} as const;

// ─── Touch Target (Accessibility) ───────────────────────────────
export const TOUCH_TARGET_MIN = "44px";

// ─── Utility: Tailwind class helpers ────────────────────────────
export const CARD_BASE = "rounded-xl border bg-card/80 backdrop-blur-sm";
export const CARD_HOVER = "hover:shadow-lg hover:border-primary/20 hover:bg-card transition-all duration-200";
export const CARD_RESULT =
  "rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-blue-50/30 dark:from-primary/10 dark:via-card dark:to-blue-950/20 shadow-md";
export const INPUT_BASE =
  "h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 outline-none";
export const BUTTON_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md active:scale-[0.98] transition-all";
export const SKELETON = "animate-pulse rounded-md bg-muted";
