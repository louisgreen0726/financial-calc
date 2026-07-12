# Engineering Review

Review date: 2026-07-12

## Scope

This review covered the static Next.js application, shared financial formulas, client persistence, exports, PWA/static deployment, accessibility, responsive UI, dependencies, and production artifacts.

## Fixed Findings

### P0

No unresolved P0 findings remain.

### P1

- Financial calculation boundaries and numeric stability: TVM, RATE/IRR/NPV, bond, WACC/DDM, Black-Scholes, risk, PPP, and amortization paths now reject invalid domains and non-finite results. TVM cash-flow fields correctly accept negative values.
- History and favorites persistence: versioned schemas validate and repair safe legacy data, preserve unknown future schemas, serialize read-modify-write transactions, retain failed operations for retry, and prevent stale tabs from recreating data after Settings clears it.
- Portfolio simulations: the Web Worker is emitted by Webpack, worker/fallback runs are isolated by run id, and seeded simulations include deterministic equal-weight and single-asset baselines.
- Static/PWA behavior: the precache manifest is generated from the final export, lazy PDF chunks are not precached, base paths are supported, and unknown offline navigations return the static 404 page rather than the home page.
- PDF export: the cloned document now resolves Tailwind 4 `oklab`/`oklch`/`color-mix()` colors into browser-supported RGBA before html2canvas parses it. Browser verification confirmed a successful Cash Flow PDF download without console errors.
- Security and output safety: CSV formula injection is escaped, share Markdown is escaped, history/restore inputs are bounded, and static-host security header templates were added.

### P2

- Accessibility and responsive behavior: semantic form/error associations, focus restoration, chart descriptions, non-duplicated responsive content, sidebar landmarks, and accessible amortization tables were improved.
- Data/export presentation: locale-aware history formatting, result type metadata, CSV/JSON safety, PDF long-content pagination, and print styles were added.
- PDF pagination and file size: oversized report blocks now use the remainder of the current page instead of leaving a header-only first page, and high-quality JPEG page slices reduce large amortization export sizes while preserving a white capture background.
- Cash Flow mobile layout: period labels occupy a dedicated row below 640px, leaving a stable second row for the value input and delete action without horizontal overflow.
- PWA installation and updates: precache downloads are bounded and failure-isolated, while the home and 404 offline fallbacks remain mandatory. Waiting workers now surface a localized, user-controlled refresh prompt instead of updating silently.

## Residual Constraints

- The PDF libraries are intentionally lazy-loaded to keep the initial application payload smaller. A first-ever PDF export cannot start after the browser is already offline; once loaded, the runtime cache can retain those chunks.
- `public/_headers` is a deployment template, not a cross-host standard. Hosts that do not support that file must reproduce the policies in their own configuration, including base-path-prefixed rules. The CSP retains `unsafe-inline` for compatibility with the current static Next.js output; hash-based CSP generation is a separate deployment hardening project.

## Verification Evidence

- Formatting, strict TypeScript, ESLint, Vitest, production build, `npm audit`, and `git diff --check` were run after the fixes.
- The test suite covers 36 files and 257 tests after the PDF pagination, resilient precache, and controlled-update regressions were added.
- Default static build exported 15 application routes and generated a precache manifest with 195 assets; route assets and precache entries were checked for missing files.
- A `NEXT_PUBLIC_BASE_PATH=/calc` build completed successfully and all exported HTML asset references used the `/calc` prefix.
- Browser checks covered desktop and 390px layouts, history restore, language/currency persistence, TVM validation, Monte Carlo Worker execution, Cash Flow/Loans PDF download, and printed amortization content. The final 390px pass confirmed zero horizontal overflow, dedicated Cash Flow label rows, and a successful compressed PDF export.
