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

## Remaining P2 Work

- PDF export captures its header as a bitmap block; this can leave a mostly empty first page. Rendering the header directly through jsPDF, or capturing only its content height, would remove it.
- On approximately 390px-wide screens, Cash Flow period labels are visually cramped beside their inputs. A dedicated mobile row layout or wider label column would improve readability.
- Large amortization exports are raster PNG pages and can produce large PDFs. JPEG compression or vector/table output would reduce file size.
- The service worker uses `cache.addAll` for roughly 195 precache entries, so first offline installation is all-or-nothing on a weak connection. It intentionally waits for existing tabs to close and has no update prompt.
- The PDF libraries are lazy-loaded. A first-time PDF export while already offline is unavailable by design.
- `public/_headers` works only on hosts that support that format. Other static hosts must reproduce those policies, including base-path-prefixed rules. Its CSP retains `unsafe-inline` for current static Next output compatibility; moving to generated hashes/nonces is a separate hardening project.

## Verification Evidence

- Formatting, strict TypeScript, ESLint, Vitest, production build, `npm audit`, and `git diff --check` were run after the fixes.
- The test suite covers 36 files and 253 tests after the final TVM/history additions.
- Default static build exported 15 application routes and generated a precache manifest with 195 assets; route assets and precache entries were checked for missing files.
- A `NEXT_PUBLIC_BASE_PATH=/calc` build completed successfully and all exported HTML asset references used the `/calc` prefix.
- Browser checks covered desktop and 390px layouts, history restore, language/currency persistence, TVM validation, Monte Carlo Worker execution, Cash Flow/Loans PDF download, and printed amortization content.
