# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-20 Asia/Shanghai
**Commit:** `7f575c3`
**Branch:** `main`

## OVERVIEW
Static-export financial calculator app built with Next.js 16 App Router, React, TypeScript, Tailwind 4, Vitest, and shadcn/ui.
Workspace root is a wrapper; treat `financial-calc/` as the real repo and execution root.

## STRUCTURE
```text
financial-calc/
├─ public/                # manifest + manual service worker
├─ src/app/               # App Router routes and root layout
├─ src/components/        # shared UI, shell, charts, export/history widgets
├─ src/hooks/             # client hooks for history, export, SW, URL, simulation
├─ src/lib/               # finance engine, i18n, storage, validation, utilities
├─ src/test/              # Vitest setup
└─ src/workers/           # Monte Carlo worker entry
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| App composition root | `src/app/layout.tsx` | Server root; wires theme, language, error boundary, shell, toaster, SW registration |
| Landing/navigation | `src/app/page.tsx`, `src/lib/nav-config.ts` | Home page is client-side and driven by shared nav config |
| Financial formulas | `src/lib/finance-math.ts` | Shared engine; pair changes with tests |
| Localization | `src/lib/i18n.tsx` | Large file; read targeted sections only |
| Client persistence | `src/lib/storage.ts`, `src/hooks/use-local-storage.ts` | Browser-only storage flows |
| Portfolio simulation | `src/hooks/use-monte-carlo-simulation.ts`, `src/workers/monte-carlo.worker.ts` | Worker first, in-process fallback |
| Service worker/PWA | `src/components/service-worker-registration.tsx`, `public/sw.js`, `public/manifest.json` | Manual wiring, not framework-managed |
| Shared UI primitives | `src/components/ui/` | shadcn-generated territory |

## CODE MAP
| Symbol/File | Role |
|---|---|
| `RootLayout` (`src/app/layout.tsx`) | Main composition root and boundary note for static export |
| `Finance` (`src/lib/finance-math.ts`) | Central formula namespace used across calculator pages |
| `NAV_CONFIG` (`src/lib/nav-config.ts`) | Canonical route + menu structure |
| `useMonteCarloSimulation` (`src/hooks/use-monte-carlo-simulation.ts`) | Worker orchestration with fallback path |
| `ServiceWorkerRegistration` (`src/components/service-worker-registration.tsx`) | Client-only SW bootstrap |

## CONVENTIONS
- Run install/dev/build/lint/test/typecheck inside `financial-calc/`, never at workspace root.
- Use `@/*` imports for `src/*` paths.
- Keep route pages in `src/app`, shared logic in `src/lib`, hooks in `src/hooks`, worker code in `src/workers`.
- `src/app/layout.tsx` is a server component; route `page.tsx` files are client components in this app.
- Formatting is opinionated: double quotes, semicolons, width 120, trailing comma `es5`, LF endings.
- Vitest uses `jsdom`, `src/**/*.{test,spec}.{ts,tsx}`, and `src/test/setup.ts`.

## ANTI-PATTERNS (THIS PROJECT)
- Do not assume server runtime features, API routes, or Node-only production behavior; build target is static export.
- Do not put browser-only state or APIs into the server root layout. Theme, language, storage, and SW logic stay behind client boundaries.
- Do not switch back to `next-pwa` v5 integration for the current setup; PWA wiring is intentionally manual.
- Do not hand-reshape shadcn primitives in `src/components/ui/` unless necessary; prefer generator-style updates.
- Do not load all of `src/lib/i18n.tsx` casually when targeted reads will do.

## UNIQUE STYLES
- Home/navigation UX is config-driven from `NAV_CONFIG` rather than hardcoded route cards.
- Shared class composition uses `cn()` (`clsx` + `tailwind-merge`).
- Portfolio simulation is resilient by design: worker execution with client-side fallback.
- Storage helpers silently degrade on SSR/storage failures instead of throwing.

## COMMANDS
```bash
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run test
npm run build
npm run format
npm run format:check
```

## NOTES
- Recommended verification order: `npx tsc --noEmit`, then `npm run test`, then `npm run build`.
- `npm run build` emits static output to `out/`.
- `next-pwa` is installed but inactive; manual SW registration is the source of truth.
- Pre-commit runs `lint-staged`; staged TS/TSX files are auto-fixed with ESLint + Prettier.
