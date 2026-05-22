# Financial Calc

English | [中文](README_zh.md)

> [!IMPORTANT]
> **This project was generated and refined with AI using OpenCode.**
> Treat it as an AI-assisted software project: useful, runnable, and tested, but still deserving normal engineering review before serious production use.

Financial Calc is a bilingual financial analysis app built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, and Radix UI. It is designed for static export, so the production build can be hosted as plain static files without a Node.js server or API runtime.

The app is no longer just a calculator demo. It includes a full app shell, responsive desktop/mobile navigation, history and restore flows, share/export actions, service worker support, and a hardened validation layer for financial inputs and computed results.

## Current Status

- Static-export Next.js app with `output: "export"`
- Bilingual UI: English and Chinese
- Desktop and mobile layouts, including bottom mobile navigation and accessible mobile drawer navigation
- Calculation history, favorite records, cross-page restore, and home-page "continue" restore
- Shareable URLs with absolute links, JSON-safe array encoding, legacy URL compatibility, and long-URL protection
- CSV, JSON, and PDF export; CSV output includes a BOM for better spreadsheet compatibility
- Manual PWA/service worker integration with base-path-aware registration
- Finite-result guards across calculator pages to avoid displaying `NaN` or `Infinity`
- Updated dependency lockfile with current semver-compatible minor/patch releases

## Calculator Modules

### Core financial tools

- **TVM**: present value, future value, payment, rate, and number of periods
- **Cash Flow**: NPV, IRR, and payback period
- **Equity**: CAPM, WACC, and DDM
- **Bonds**: price, duration, convexity, yield curve, and sensitivity heatmap
- **Portfolio**: Monte Carlo efficient-frontier simulation with worker and client fallback
- **Options**: Black-Scholes pricing and Greeks
- **Risk**: VaR, CVaR, and distribution visualization
- **Loans**: CPM/CAM amortization schedules with virtualized table rendering
- **Macro**: inflation, purchasing power, real rate, CPI adjustment, and PPP exchange rate

### Supporting pages

- **History**: saved calculation browsing, search, favorites, restore, batch delete, and CSV export
- **Settings**: language, theme, display currency, data-management, and reset controls
- **Help**: usage guide and app support information

## Reliability Work Included

Recent hardening work is reflected in the current source:

- shared validation schemas now enforce rate, period, asset, cash-flow, and portfolio-size limits
- finance math helpers reject unsupported bond frequencies, invalid DDM cases, invalid CPI/PPP inputs, and oversized amortization schedules
- page-level result readiness checks verify outputs are finite before rendering or recording history
- history records carry result-format metadata so currency, percentages, periods, and ratios render correctly
- history restore no longer re-records restored entries as fresh calculations
- TVM clears stale results and calculation steps when target, payment timing, or inputs change
- mobile sidebar content now satisfies Radix Dialog title/description requirements and closes after navigation
- PWA metadata, manifest, icons, and service worker scope respect `NEXT_PUBLIC_BASE_PATH`
- Recharts tooltip formatters and auto-calculation hooks are compatible with the current stricter dependency/lint versions

## Tech Stack

- **Framework**: Next.js 16 App Router
- **Runtime**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui, Radix UI
- **Charts and animation**: Recharts, Framer Motion
- **Forms and validation**: Zod, React Hook Form utilities
- **Tables and large lists**: `@tanstack/react-virtual`
- **Export**: html2canvas, jsPDF, CSV/JSON helpers
- **Testing**: Vitest, Testing Library, jsdom

## Requirements

- Node.js >= 20
- npm

The repository includes `.nvmrc` with the target Node major version.

## Install

```bash
npm install
```

For a clean lockfile-based install, use:

```bash
npm ci
```

## Local Development

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Verification Commands

```bash
npm run format:check
npx tsc --noEmit
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

The current codebase has been verified with the full gate above. The Vitest suite currently covers 16 test files and 122 tests.

## Recommended Pre-Commit Gate

Before committing or pushing, run:

```bash
npm run format:check
npx tsc --noEmit
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

The project also has a Husky pre-commit hook that runs `lint-staged` for staged source files.

## Build and Deployment

```bash
npm run build
```

Production output is written to:

```text
out/
```

Preview the exported static site with:

```bash
npm run preview
```

Deployment notes:

- `next.config.ts` uses `output: "export"`
- production does not require `next start`
- production does not assume server-side API routes or a Node runtime
- static routes use trailing slashes
- service worker registration lives in `src/components/service-worker-registration.tsx`
- the service worker file is `public/sw.js`
- app manifest and icons live under `public/`
- `NEXT_PUBLIC_BASE_PATH` is supported by metadata and service worker registration

## Project Structure

```text
financial-calc/
├─ public/                # Static assets, manifest, service worker
├─ src/
│  ├─ app/                # App Router pages
│  ├─ components/         # Shared UI, layout, result, history, export components
│  ├─ hooks/              # History, URL state, export, simulation, calculation hooks
│  ├─ lib/                # Finance math, validation, i18n, storage, URL/history utilities
│  ├─ test/               # Vitest setup
│  └─ workers/            # Monte Carlo worker
├─ README.md
├─ README_zh.md
├─ package.json
└─ package-lock.json
```

## Important Source Files

- `src/lib/finance-math.ts`: shared financial calculation engine
- `src/lib/validation.ts`: shared Zod validation schemas and input limits
- `src/lib/history-format.ts`: history result formatting by unit/type
- `src/lib/url-state-utils.ts`: URL state serialization and absolute share-link helpers
- `src/hooks/use-calculation-history.ts`: persisted calculation history model
- `src/hooks/use-shareable-url.ts`: share URL restore/build flow
- `src/components/service-worker-registration.tsx`: browser-side service worker registration
- `public/sw.js`: static-export service worker

## Dependency Notes

Dependencies have been updated within the package.json semver ranges. Remaining newer versions reported by `npm outdated` are either major-version upgrades or versions blocked by explicit package constraints. Handle those as separate migration work rather than routine maintenance.

After a clean `npm ci`, npm may still mark a few `@emnapi` / `@napi-rs` / `@tybys` WASM helper packages as extraneous; they are peer/optional helper packages pulled through the native/WASM toolchain. `npm audit --omit=dev`, typecheck, lint, tests, and build are clean.

## AI Generation Disclosure

- This repository was produced through OpenCode-driven AI generation and iterative AI-assisted refinement.
- Architecture, UI structure, validation flows, documentation, tests, and reliability fixes were generated and revised with AI assistance.
- The project is suitable as a working application, learning reference, and experimentation base, but production use should still include independent code review, security review, and financial-domain validation.

## License

MIT
