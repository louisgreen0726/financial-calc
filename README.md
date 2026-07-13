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
- Calculation history, favorite records, cross-page restore, home-page "continue" restore, and bounded JSON backup import/export
- Shareable URLs with absolute links, JSON-safe array encoding, legacy URL compatibility, and long-URL protection
- Inbound shared state is length/cardinality bounded before parsing and malformed `json:` arrays fail closed
- Self-describing schema-v2 CSV/JSON reports plus print-optimized, searchable PDF output; CSV includes a BOM
- Reports pair localized unit-bearing inputs with stable `rawInputs`; display results stay rounded while `data` keeps raw precision
- Manual PWA/service worker integration with base-path-aware registration
- Build-generated SHA-256 policies allow only the exact inline scripts emitted in each static HTML document
- Finite-result guards across calculator pages to avoid displaying `NaN` or `Infinity`
- Updated dependency lockfile with current semver-compatible minor/patch releases

## Calculator Modules

### Core financial tools

- **TVM**: present value, future value, payment, rate, and number of periods
- **Cash Flow**: NPV, IRR, and payback period
- **Equity**: CAPM, WACC, and DDM
- **Bonds**: price, duration, convexity, yield curve, and sensitivity heatmap
- **Portfolio**: reproducible Monte Carlo risk-return sampling with worker and client fallback
- **Options**: Black-Scholes-Merton pricing with continuous dividend yield, Greeks, and implied volatility
- **Risk**: VaR, CVaR, distribution visualization, and deterministic 5%/10%/20% stress scenarios
- **Loans**: CPM/CAM amortization schedules with accessible 100-row pagination and complete CSV/JSON/print output
- **Macro**: inflation, purchasing power, real rate, CPI adjustment, and PPP exchange rate

Every calculator exposes a bilingual **Reset defaults** action. It preserves unrelated URL parameters and offers an
Undo action that restores the prior inputs and visible result state.

### Supporting pages

- **History**: saved calculation browsing, search, favorites, restore, batch delete, and CSV export
- **Settings**: self-healing cross-tab language/theme/currency preferences, schema-validated history backup/restore,
  and reset controls
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
- PWA metadata, install icons, generated precache assets, and service worker caches respect `NEXT_PUBLIC_BASE_PATH`
- Monte Carlo simulations run in a Webpack-built worker and always include equal-weight and single-asset baselines
- Print / Save as PDF isolates the active report and uses native browser pagination for sharp, searchable output
- denied Clipboard API writes fall back to the legacy browser copy path; non-cancelled native-share and export
  failures show actionable feedback while leaving every action available for retry
- Recharts tooltip formatters and auto-calculation hooks are compatible with the current stricter dependency/lint versions

## Tech Stack

- **Framework**: Next.js 16 App Router
- **Runtime**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui, Radix UI
- **Charts and animation**: Recharts, Framer Motion
- **Forms and validation**: Zod, React Hook Form utilities
- **Export**: native print layout, versioned JSON reports, spreadsheet-safe CSV helpers
- **Testing**: Vitest, Testing Library, jsdom

## Requirements

- Node.js >= 20.19.0
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
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run test:e2e:pwa
npm run build
npm run bundle:check
npm audit
```

The current codebase is verified with the full gate above, including focused coverage for PWA registration, sharing,
worker concurrency, and export safety.

## Recommended Pre-Commit Gate

Before committing or pushing, run:

```bash
npm run format:check
npm run typecheck
npm run lint
npm run test
npm run build
npm audit
```

Run the complete local quality gate with:

```bash
npm run verify
```

GitHub Actions runs the same coverage as parallel quality, browser, and root/base-path production jobs, followed by a
high-severity production dependency audit. Each production matrix entry builds once, then checks that exact artifact's
precache manifest, internal HTML references, PWA metadata, static-host headers, route bundle budgets, and PWA
installation/offline/update lifecycle. Failed browser jobs upload their retained screenshots and traces for seven days.
Locally, install Chromium once with
`npx playwright install chromium` before running `npm run test:e2e`.
The local Playwright configuration caps execution at two workers because concurrent Axe scans are CPU- and
memory-intensive; CI keeps its single-worker setting for reproducibility.

Run the production PWA workflows with:

```bash
npm run test:e2e:pwa
npm run test:e2e:pwa:base-path
```

The project also has a Husky pre-commit hook that runs `lint-staged` for staged source files.
Translation keys are type-checked, and the Vitest catalog gate verifies English/Chinese key parity, non-empty copy,
literal lookup resolution, and navigation coverage for every user route.

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
- development and production builds intentionally use Webpack so the TypeScript Monte Carlo worker is emitted as executable JavaScript
- the build injects a per-document hash-based script/style-element CSP, then scans `out/` and writes
  `out/precache-manifest.js`; do not edit generated HTML or the manifest after the build because the hashes would
  become stale
- `npm run static:check` validates the existing export, while `npm run test:static` rebuilds and validates a `/calc` base-path export
- production does not require `next start`
- production does not assume server-side API routes or a Node runtime
- static routes use trailing slashes
- service worker registration lives in `src/components/service-worker-registration.tsx`
- the service worker file is `public/sw.js`
- app manifest, PNG install icons, and the development precache placeholder live under `public/`
- `NEXT_PUBLIC_BASE_PATH` is supported by metadata, navigation, and service worker registration
- for a base-path deployment, build with `NEXT_PUBLIC_BASE_PATH=/calc` and configure the static host to map `/calc/` to the same exported `out/` directory; exported files remain at the root of `out/`, not inside an additional `calc/` folder
- base-path hosts must preserve `/calc` when redirecting clean URLs; stripping it from precache requests such as `/calc/options/index.html` prevents service-worker installation
- `public/_headers` supplies security and cache headers for hosts that support the Netlify/Cloudflare Pages format
- hosts that do not consume `_headers` must map the same CSP, referrer, nosniff, frame, permissions, and cache policies in their own configuration
- each HTML file also carries build-generated `script-src` and `style-src-elem` meta directives with exact SHA-256
  hashes; the generator includes deterministic Sonner startup styles from the installed package, and the policy
  intersects with the host header even on hosts with `_headers` matching or line-length limitations
- only `style-src-attr` retains inline compatibility for dynamic React chart/component attributes; unlisted style
  elements and scripts are blocked by the document policy
- for a base-path deployment, prefix the host-specific `/_next/static/*`, `/sw.js`, `/precache-manifest.js`, and `/manifest.json` header rules with that base path
- HTML, `sw.js`, and the precache manifest must be revalidated; hashed `/_next/static/*` assets should be cached as immutable for one year

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
- `src/lib/risk-math.ts`: pure parametric-normal VaR and expected-shortfall engine
- `src/test/fixtures/financial-reference-cases.json`: pinned NumPy Financial and OpenGamma Strata reference vectors
- `src/lib/validation.ts`: shared Zod validation schemas and input limits
- `src/lib/history-format.ts`: history result formatting by unit/type
- `src/lib/data-export.ts`: schema-v2 report envelope, raw/display input preservation, and spreadsheet-safe CSV serialization
- `src/lib/clipboard.ts`: permission-aware modern/legacy clipboard fallback with temporary-DOM cleanup
- `src/lib/report-fields.ts`: localized report field labeling without changing canonical input keys
- `src/lib/url-state-utils.ts`: URL state serialization and absolute share-link helpers
- `src/hooks/use-calculation-history.ts`: persisted calculation history model
- `src/hooks/use-shareable-url.ts`: share URL restore/build flow
- `src/components/service-worker-registration.tsx`: browser-side service worker registration
- `public/sw.js`: static-export service worker
- `scripts/generate-precache-manifest.mjs`: post-build static asset and route manifest generator
- `scripts/generate-static-csp.mjs`: per-document inline-script hash policy generator and validator
- `scripts/check-static-export.mjs`: static export, precache, base-path, manifest, and host-header validator
- `public/_headers`: static-host security and cache policy template
- the in-app Help page documents calculation timing, rate/statistical assumptions, worked examples, and model limitations in English and Chinese

## Dependency Notes

Dependencies have been updated within the package.json semver ranges. Remaining newer versions reported by `npm outdated` are either major-version upgrades or versions blocked by explicit package constraints. Handle those as separate migration work rather than routine maintenance.

After a clean `npm ci`, npm may still mark a few `@emnapi` / `@napi-rs` / `@tybys` WASM helper packages as extraneous; they are peer/optional helper packages pulled through the native/WASM toolchain. `npm audit`, typecheck, lint, tests, and build are clean.

## AI Generation Disclosure

- This repository was produced through OpenCode-driven AI generation and iterative AI-assisted refinement.
- Architecture, UI structure, validation flows, documentation, tests, and reliability fixes were generated and revised with AI assistance.
- The project is suitable as a working application, learning reference, and experimentation base, but production use should still include independent code review, security review, and financial-domain validation.

## License

MIT
