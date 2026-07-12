# Continuous Improvement Log

Session start: 2026-07-13 03:06 +08:00

Active branch: `codex/continuous-improvements`

Minimum session target: 10 hours; continue until the user explicitly stops the goal.

## Active Improvement Queue

- [x] Complete the implied-volatility workflow: market-price validation, history/share/export, i18n, and E2E.
- [x] Add option-price and implied-volatility property coverage across a deterministic contract matrix.
- [x] Audit production bundle sizes and reduce avoidable client-side JavaScript or eager imports.
- [x] Add automated PWA/offline navigation and update-flow browser coverage.
- [x] Add automated accessibility checks for calculator forms, dialogs, navigation, and result announcements.
- [x] Review all calculator pages for validation/schema drift and inconsistent supported domains.
- [x] Profile large loan schedules, portfolio simulations, history filtering, and report exports.
- [x] Review dependency upgrades and remove confirmed dead code without destabilizing generated UI primitives.
- [x] Validate static deployment headers, base-path output, precache completeness, and cache invalidation in automation.
- [x] Expand user-facing documentation with model assumptions, limitations, and worked examples.
- [x] Exercise service-worker installation and offline navigation from a real `/calc` base-path deployment.
- [x] Add automated English/Chinese translation-key and route-copy coverage checks.
- [ ] Add independently sourced reference fixtures for the highest-impact financial formulas.
- [ ] Design bounded, schema-versioned history import/export with duplicate handling and validation.
- [ ] Profile CI jobs and split/cache independent gates where it reduces feedback time without weakening coverage.

## 2026-07-13

### Improvement 1: Core correctness, persistence, output, mobile UI, and CI hardening

Status: completed before the continuous-session branch was created; preserved in the current worktree for the first
session commit.

Changes:

- Replaced permissive separator stripping in numeric inputs with consistent three-digit grouping validation. Inputs
  such as `1,2,3`, `12,34`, mixed separators, and separators in fractional digits are rejected instead of silently
  becoming a different amount.
- Constrained Black-Scholes prices to theoretical no-arbitrage bounds for numerically extreme contracts.
- Aligned TVM page validation with the engine's supported negative-rate domain above the `-100%` singularity.
- Added cross-tab language and theme synchronization.
- Hardened Markdown sharing and Windows-compatible export filename truncation.
- Removed mobile overlap among result summaries, the page-history control, and fixed bottom navigation.
- Added `typecheck` and `verify` scripts plus a least-privilege GitHub Actions workflow.

Files and areas:

- `src/lib/input-utils.ts`, `src/lib/finance-math.ts`, `src/lib/data-export.ts`, `src/lib/share-markdown.ts`
- `src/app/tvm/page.tsx`, shared validation and i18n
- theme/language providers, result shell, history panel, related tests
- `package.json`, `.github/workflows/ci.yml`, README files, and `ENGINEERING_REVIEW.md`

Verification:

- `npm run verify`: passed.
- Vitest: 36 files, 271 tests passed at completion of this improvement.
- Default and `/calc` base-path static exports: passed; 15 routes and 195 precache assets.
- Browser review at 1440px and 390px: no console errors or horizontal overflow; overlap areas measured as zero.
- `npm audit`: zero known vulnerabilities across 767 installed dependencies.

### Improvement 2: Dividend-adjusted options pricing and reproducible browser tests

Status: completed.

Changes:

- Extended Black-Scholes-Merton pricing and all supported Greeks with a backward-compatible continuous dividend yield
  parameter (`q=0` by default).
- Applied dividend discounting to stochastic and zero-volatility prices, Delta, Gamma, Theta, Vega, and no-arbitrage
  bounds; retained the correct risk-free-rate definition of Rho.
- Added the dividend assumption to validation, accessible errors, share URLs, legacy history restore, report inputs,
  navigation/help copy, and English/Chinese UI.
- Added committed Playwright workflows for legacy defaults, dividend-aware benchmark prices, share-link round trips,
  Chinese localization, mobile overflow, browser errors, and fixed-navigation overlap.
- Integrated Chromium installation and Playwright execution into CI with failure screenshots and traces.

Files and areas:

- `src/lib/finance-math.ts`, `src/lib/validation.ts`, and their tests
- `src/app/options/page.tsx`, calculator accessibility tests, and `src/lib/i18n.tsx`
- `playwright.config.ts`, `e2e/options-dividend.spec.ts`, CI, README files, and engineering review

Verification:

- `npm run verify`: passed.
- Vitest: 36 files, 277 tests passed.
- `npm run test:e2e`: 2 Playwright workflows passed in desktop and 390px mobile viewports.
- Browser benchmark: legacy Call `$10.45`; with `q=2%`, Call `$9.23` and Put `$6.33`.
- Share URL retained `options_dividendYield=2`; Chinese label rendered correctly.
- Static export: 15 routes and 195 precache assets.
- `npm audit`: zero known vulnerabilities.

### Progress checkpoint: 03:06 +08:00

- Continuous-session elapsed time: initial checkpoint.
- Completed improvement batches in the current worktree: 2.
- Current work: implied-volatility solver foundation is implemented and unit-tested; UI workflow remains in progress.
- Queue status: 10 active items; queue is intentionally non-empty.

### Improvement 3: Stable implied-volatility solver and market workflow

Status: completed.

Changes:

- Added a bounded bisection implied-volatility solver for European calls and puts with continuous dividends.
- Enforced discounted no-arbitrage bounds, positive maturity, finite inputs, and the application's supported `0%` to
  `500%` volatility domain before and during the solve.
- Added a dedicated Options market-price workflow with Call/Put selection, observed price, live IV result, accessible
  validation, old-history defaults, history recording, share URL state, and structured report inputs/results.
- Updated English/Chinese navigation, help, model descriptions, README files, and engineering review.
- Extended Playwright to verify the market price `9.227` round-trips to `20.00%` at a `2%` dividend yield and remains in
  the copied share URL.

Files and areas:

- `src/lib/finance-math.ts`, `src/lib/validation.ts`, and their tests
- `src/app/options/page.tsx`, `src/app/calculator-accessibility.test.tsx`, and `src/lib/i18n.tsx`
- `e2e/options-dividend.spec.ts`, README files, and `ENGINEERING_REVIEW.md`

Verification:

- Focused Vitest: 3 files, 86 tests passed.
- `npm run verify`: passed; 36 Vitest files and 282 tests passed.
- TypeScript, ESLint, source formatting, and extra configuration formatting: passed.
- Playwright: 2 browser workflows passed.
- Static export: 15 routes and 195 precache assets.
- `npm audit`: zero known vulnerabilities across 767 installed dependencies.

### Improvement 4: Shared history-panel bundle reduction and enforceable route budgets

Status: completed.

Changes:

- Removed `framer-motion` from the shared History panel and replaced its panel entrance with the project's existing
  CSS animation utilities. History behavior, focus handling, favorites, selection, restore, and persistence retry
  paths remain unchanged.
- Reduced the Options route's raw initial JavaScript from 1,476,906 to 1,352,126 bytes (124,780 bytes, 8.4%). The
  Loans, Bonds, Risk, Cash Flow, Equity, and Macro routes received a similar reduction because they share the panel;
  TVM and Portfolio retain route-specific animation usage.
- Added a post-build route budget checker that measures each exported page's unique initial scripts using level-9
  gzip, applies explicit per-route ceilings, handles `/calc`-style base paths, and deduplicates Next.js' two 404
  exports conservatively.
- Added the budget check to `npm run verify`, documented the standalone command, and added regression tests for root,
  directory, flat error-page, and base-path exports.

Files and areas:

- `src/components/history-panel.tsx`
- `scripts/check-bundle-budget.mjs`, `src/lib/bundle-budget.test.ts`, and `package.json`
- README command references and `ENGINEERING_REVIEW.md`

Verification:

- Focused Vitest: 2 files, 14 tests passed.
- `npm run verify`: passed; 37 Vitest files and 285 tests passed.
- Production export: 15 routes and 197 precache assets; all route budgets passed. Largest route was Portfolio at
  450,961 / 500,000 gzip bytes; Options was 418,482 / 470,000 gzip bytes.
- Playwright: 2 desktop/mobile browser workflows passed using the installed system Chrome after the pinned Chromium
  download endpoint was unavailable locally.
- `npm audit`: zero known vulnerabilities; `git diff --check`: passed.

### Progress checkpoint: 03:50 +08:00

- Continuous-session elapsed time: 44 minutes.
- Completed improvement batches in this session: 4; latest commit: `c5c870c`.
- Current work: production PWA Playwright coverage. Real-browser diagnostics confirmed service-worker installation,
  route precaching, page control, and interception; an unhandled fallback failure after a real socket disconnect is
  being isolated before the test is committed.
- Queue status: 8 active items remain after bundle optimization; the queue is intentionally non-empty.

### Improvement 5: Production PWA offline and update browser workflow

Status: completed.

Changes:

- Added an isolated Playwright configuration that builds and serves the production static export before exercising
  the real service worker. The normal development E2E suite explicitly excludes this production-only spec.
- Added a controlled static test server that can simulate a genuine network disconnect after installation without
  bypassing service-worker interception. Test-only worker and offline marker files are created in `out/` and removed
  after the workflow.
- Verified browser-level worker installation, page control, cache population, an unvisited Options route loading
  offline, an unknown route returning the cached 404 page, a waiting update prompt, user-confirmed `SKIP_WAITING`,
  controller replacement, and automatic page reload.
- Fixed a real Chromium compatibility issue found by the new workflow: cached document responses are now converted
  into fresh navigation responses before `respondWith`, rather than retaining the original `/route/index.html`
  response URL. Error responses with status 0 also enter fallback, and offline unknown routes retain HTTP 404 status
  instead of returning cached 404 content with status 200.
- Added the production PWA workflow to CI and documented `npm run test:e2e:pwa` in both README files.

Files and areas:

- `public/sw.js` and `src/lib/service-worker-script.test.ts`
- `e2e/pwa-offline.spec.ts`, `playwright.pwa.config.ts`, `playwright.config.ts`
- `scripts/serve-pwa-e2e.mjs`, package metadata, CI, and README command references

Verification:

- Focused service-worker Vitest: 9 tests passed.
- `npm run verify`: passed; 37 Vitest files and 286 tests passed.
- `npm run test:e2e`: 2 desktop/mobile calculator workflows passed.
- `npm run test:e2e:pwa`: 1 production PWA workflow passed in 38.2 seconds using system Chrome.
- Static export: 15 routes and 197 precache assets; all bundle budgets passed.
- `npm audit`: zero known vulnerabilities; `git diff --check`: passed.

### Improvement 6: Automated WCAG route and interaction coverage

Status: completed.

Changes:

- Added Axe 4.12 Playwright checks for WCAG 2.0/2.1/2.2 A and AA rules plus best practices across all 13
  user-facing routes. Each route is an independent test so one failure does not hide findings on later pages.
- Added explicit interaction scans for an invalid Options form, the Share Results dialog, the populated History
  panel, and the 390px mobile navigation/form state. Failures include rule, impact, target, and remediation summary.
- Wrapped the full desktop sidebar in a named complementary landmark so its brand, calculator search, footer, and
  collapse control are no longer outside the page landmark structure.
- Made the shared sensitivity heatmap and Loan amortization schedule scroll containers keyboard-focusable named
  regions, allowing Safari keyboard users to reach horizontally or vertically clipped content.
- Corrected Help page heading hierarchy from `h1 -> h2 -> h4` to `h1 -> h2 -> h3` without changing visual styles.
- Added component and page-level regression assertions for sidebar semantics and both focusable scroll regions.

Files and areas:

- `e2e/accessibility.spec.ts` and Axe development dependency metadata
- `src/components/layout/app-layout.tsx` and its tests
- `src/components/sensitivity-heatmap.tsx` and its new component test
- `src/app/loans/page.tsx`, `src/app/help/page.tsx`, and calculator accessibility tests

Verification:

- Focused Axe suite: 15 tests passed across routes, dialogs, invalid form state, History, and mobile navigation.
- `npm run verify`: passed; 38 Vitest files and 287 tests passed.
- `npm run test:e2e`: 17 tests passed (15 accessibility and 2 calculator workflows).
- `npm run test:e2e:pwa`: 1 production PWA workflow passed.
- Static export: 15 routes and 197 precache assets; all bundle budgets passed.
- `npm audit`: zero known vulnerabilities; `git diff --check`: passed.

### Progress checkpoint: 04:19 +08:00

- Continuous-session elapsed time: 1 hour 13 minutes.
- Completed improvement batches in this session: 6; latest committed improvement before this checkpoint:
  `01d8300`.
- Current work: automated accessibility improvement is fully verified and ready to commit.
- Queue status: 6 active items remain; the queue is intentionally non-empty.

### Improvement 7: Deterministic option pricing property matrix

Status: completed.

Changes:

- Added a 10-contract deterministic matrix spanning ITM/ATM/OTM contracts, sub-unit and four-digit notionals,
  0.01-to-30-year maturities, negative and positive rates, negative and high dividend yields, and 5% to 250%
  volatility.
- Enforced dividend-adjusted put-call parity, discounted no-arbitrage bounds, price monotonicity in spot and
  volatility, and degree-one homogeneity when spot and strike are scaled together.
- Enforced call-put Greek identities for Delta, Gamma, Vega, Theta, and Rho, along with sign and discounted Delta
  bounds across every contract.
- Added central finite-difference validation for all five reported Greeks on four representative contracts.
- Expanded implied-volatility round trips to both calls and puts for all 10 contracts and explicitly covered the
  solver's exact 0% and 500% supported boundaries.

Files and areas:

- `src/lib/option-properties.test.ts`

Verification:

- New option property matrix: 55 tests passed.
- Focused finance suite: 2 files and 114 tests passed.
- `npm run verify`: passed; 39 Vitest files and 342 tests passed.
- Static export: 15 routes and 197 precache assets; all bundle budgets passed.
- `git diff --check`: passed.

### Improvement 8: Portfolio and Loan input-contract alignment

Status: completed.

Changes:

- Reviewed calculator schemas, hand-written validation, HTML numeric constraints, restore paths, and Finance engine
  domains. Macro's five hand-written validators and the TVM, Bond, Equity, Options, Cash Flow, Risk, and asset-level
  Portfolio constraints were consistent with their engines.
- Replaced Portfolio's contradictory 0-to-10 slider / 0-to-100 schema contract with shared -10% to 10% constants.
  This adds realistic negative risk-free-rate support while making the schema and control range identical.
- Added strict Portfolio restoration normalizers. Finite numeric or numeric-string risk-free rates and correlations
  are accepted only inside their control domains; malformed, non-finite, and out-of-range URL/history values are
  ignored instead of creating an invalid controlled slider.
- Aligned Loan browser constraints with its shared schema: annual rate now exposes the 100% maximum, while term uses
  a one-month step, one-month minimum, and 50-year schedule maximum instead of implying whole-year-only input.
- Replaced Loan validation's literal `12` with the shared `MONTHS_PER_YEAR` constant for term bounds and whole-month
  checks.

Files and areas:

- `src/lib/constants.ts`, `src/lib/validation.ts`, and validation tests
- `src/lib/portfolio-state.ts` and its new tests
- `src/app/portfolio/page.tsx`, `src/app/loans/page.tsx`, and calculator accessibility tests
- `e2e/portfolio-validation.spec.ts`

Verification:

- Focused validation/restore/page suite: 3 files and 31 tests passed.
- Portfolio browser restore: supported `rf=-2` / `correlation=-0.25` restored; `rf=50` / `correlation=5` were rejected
  in favor of defaults with no browser errors.
- `npm run verify`: passed; 40 Vitest files and 346 tests passed.
- `npm run test:e2e`: 18 tests passed, including 15 Axe checks and the new Portfolio workflow.
- Static export: 15 routes and 197 precache assets; all bundle budgets passed.
- `npm audit`: zero known vulnerabilities; `git diff --check`: passed.

### Improvement 9: Linear-time equal-correlation portfolio variance

Status: completed.

Changes:

- Confirmed the Web Worker and chunked main-thread fallback both use the shared `calculatePortfolioPoint` hot path.
- Replaced the O(n^2) pairwise covariance loop with the equal-correlation identity
  `(1-rho) * sum((w*sigma)^2) + rho * sum(w*sigma)^2`, reducing variance work to O(n).
- Combined asset/weight validation, weight normalization, expected return, and risk exposure accumulation into one
  pass without changing error contracts or zero-risk Sharpe semantics.
- Added a quadratic reference test covering 20 assets, 71 deterministic weight vectors, and six correlations (426
  comparisons), including the positive-semidefinite lower boundary and perfect correlation.
- Reviewed the remaining profiling targets. Loan schedules are capped at 600 rows and the 600-period engine path
  averaged 0.016 ms over 2,000 runs; History is capped at 50 items per page; report printing performs bounded DOM
  isolation/chart measurement and delegates pagination to the browser without eager rasterization.

Performance evidence:

- Harness: 20 assets, 5,000 fixed seeded weight vectors, correlation 0.2, 31 alternating post-warmup rounds.
- Before: 4.7835 ms median, 4.8506 ms mean.
- After: 0.5344 ms median, 0.5412 ms mean.
- Median speedup: 8.95x; covariance terms per 5,000-point run fall from 2,000,000 pair terms to 100,000 linear asset
  terms.

Files and areas:

- `src/lib/portfolio-math.ts` and `src/lib/portfolio-math.test.ts`

Verification:

- Focused Portfolio math/worker fallback: 2 files and 17 tests passed.
- `npm run verify`: passed; 40 Vitest files and 347 tests passed.
- Static export: 15 routes and 197 precache assets; all bundle budgets passed.
- `npm audit`: zero known vulnerabilities; `git diff --check`: passed.

### Improvement 10: Confirmed dead-code and dependency cleanup

Status: completed.

Changes:

- Ran dependency version review, direct import search, and Knip static analysis, then separated actionable findings
  from expected false positives for Playwright entry points, public workers, CSS plugins, Husky/lint-staged, and
  shadcn-generated primitives.
- Removed the unused `@hookform/resolvers` production dependency. `react-hook-form` and the unused Radix packages
  remain because checked-in shadcn primitives import them and must continue to typecheck as available UI building
  blocks.
- Deleted four confirmed orphan modules with no static, dynamic, test, configuration, or documentation consumers:
  the old `SensitivityAnalysis` component, unused `useAutoCalculate` hook, disconnected chart theme, and duplicate
  TypeScript design-token set. This removes 359 source lines.
- Reviewed available upgrades. The only outdated direct packages are major-version migrations (`@types/node` 20 to
  26, ESLint 9 to 10, Lucide 0.x to 1.x, and TypeScript 5 to 7); they were intentionally deferred because this batch
  has no security finding or feature requiring their broader compatibility work.

Files and areas:

- `package.json` and `package-lock.json`
- Removed `src/components/sensitivity-analysis.tsx`, `src/hooks/use-auto-calculate.ts`, `src/lib/chart-theme.ts`, and
  `src/lib/design-tokens.ts`

Verification:

- Import search after deletion: no remaining references.
- `npm run verify`: passed; 40 Vitest files and 347 tests passed.
- Static export remained 15 routes and 197 precache assets; all bundle budgets passed. Initial bundles were unchanged,
  confirming these modules were source/install debt rather than hidden runtime chunks.
- `npm audit`: zero known vulnerabilities; `git diff --check`: passed.

### Progress checkpoint: 04:49 +08:00

- Continuous-session elapsed time: 1 hour 43 minutes.
- Completed improvement batches in this session: 10; latest committed improvement before this checkpoint:
  `e0373c5`.
- Current work: dependency and dead-code cleanup is fully verified and ready to commit.
- Queue status: 2 active items remain; additional findings will be added as review continues so the queue stays
  non-empty.

### Improvement 11: Automated static-deployment artifact validation

Status: completed.

Changes:

- Added a cross-platform static-export checker that can validate an existing `out/` tree or trigger a clean build for
  a specified base path. Nested npm execution uses npm's own CLI entry point when available, avoiding Windows
  `npm.cmd` spawn incompatibilities.
- Parse the generated JavaScript precache manifest in an isolated, time-bounded VM context and verify its build ID
  against `.next/BUILD_ID`, reject duplicate or mutable metadata entries, and confirm every declared asset and route
  exists in the export.
- Added reverse route-completeness checks: every exported route `index.html` must appear in the precache route set,
  and the manifest cannot name routes that are absent from the export.
- Validate every internal HTML `href` and `src` across all exported documents. References must resolve to real files
  or routes, and absolute references from a base-path build must remain under that base path.
- Validate relative PWA `id`, `start_url`, and `scope`, required service-worker/deployment files, security headers,
  HTML revalidation, mutable worker/manifest revalidation, and one-year immutable caching for hashed Next assets.
- Added `static:check` to the default `verify` gate, a `test:static` command that rebuilds with `/calc`, and a dedicated
  CI step for that deployment topology. Updated both READMEs with the commands and enforced artifact contract.
- Added five focused tests covering CLI/environment normalization, VM parsing and timeout, case-insensitive header
  parsing, root/base-path success, stale build IDs, and escaped base-path references.

Files and areas:

- `scripts/check-static-export.mjs` and `src/lib/static-export-check.test.ts`
- `package.json` and `.github/workflows/ci.yml`
- `README.md`, `README_zh.md`, and `ENGINEERING_REVIEW.md`

Verification:

- Focused static-export checker: 5 tests passed.
- Existing default export: 15 routes, 197 precache assets, 16 HTML files, and 722 internal references passed.
- Fresh `/calc` production export: 15 routes, 197 precache assets, 16 HTML files, and 706 internal references passed.
- `npm run verify`: passed; 41 Vitest files and 352 tests passed, followed by the default static artifact check and
  all 15 per-route bundle budgets.
- `npm audit`: zero known vulnerabilities; expanded Prettier check and `git diff --check`: passed.

### Improvement 12: Bilingual model assumptions, limitations, and worked examples

Status: completed.

Changes:

- Audited the implemented formulas and page-level conventions before documenting them, including TVM cash-flow
  signs/timing, NPV period zero, IRR root ambiguity, monthly loan conversion, flat-YTM bonds, Gordon growth, BSM Greek
  units, equal-correlation portfolios, zero-drift normal VaR, exact Fisher rates, and PPP quote direction.
- Added a full in-app English/Chinese model guide covering six families: TVM/cash flow/loans, bonds, equity, options,
  portfolio/risk, and macroeconomic scenarios. Each family explicitly separates assumptions, a numerically
  reproducible example, and limitations/excluded effects.
- Added a prominent decision boundary explaining that deterministic calculator outputs are not quotes, forecasts,
  accounting/tax conclusions, or investment advice, and that material decisions require independent validation.
- Kept the guide in a Help-only typed module rather than the shared i18n dictionary. An initial shared implementation
  increased every route by about 4.7 KB gzip; the final build restores all 14 non-Help routes exactly to their prior
  sizes and charges the documentation only to `/help`.
- Added English and persisted-Chinese rendering tests that require all six model families and all six worked-example
  headings. Updated both READMEs to point users to the in-app guide.

Files and areas:

- `src/lib/model-guide.ts`
- `src/app/help/page.tsx` and `src/app/help/page.test.tsx`
- `README.md`, `README_zh.md`, `IMPROVEMENT_LOG.md`, and `ENGINEERING_REVIEW.md`

Verification:

- Focused Help guide suite: 2 tests passed in English and Chinese; TypeScript and focused ESLint passed.
- Help route Axe WCAG/best-practice baseline: passed.
- Browser review at 1440px and 390px: 6 model sections rendered, document width equaled viewport width, and no heading,
  paragraph, or list text overflow was detected.
- Bundle isolation: all non-Help routes returned exactly to their pre-guide gzip sizes; Help is 262,196 / 300,000
  gzip bytes, approximately 6.3 KB above its previous 255,911-byte baseline.
- `npm run verify`: passed; 42 Vitest files and 354 tests passed, static artifact checks passed, and all route bundle
  budgets passed.
- Full standard Playwright suite: 18 tests passed, including all route Axe scans and mobile/interacted states.
- `npm audit`: zero known vulnerabilities; expanded Prettier check and `git diff --check`: passed.

### Progress checkpoint: 05:19 +08:00

- Continuous-session elapsed time: 2 hours 13 minutes.
- Completed and committed improvement batches: 11; Improvement 12 is implemented and undergoing final verification.
- Current work: model-guide correctness, accessibility, responsive layout, and route-local bundle isolation are
  verified.
- Queue status: 4 active items remain; the next priority is real base-path PWA coverage, followed by automated i18n
  parity and formula reference fixtures.

### Improvement 13: Real base-path PWA installation, offline, and update coverage

Status: completed.

Changes:

- Parameterized the production PWA Playwright configuration and workflow around an explicit deployment base path,
  while preserving the existing root-path test as a separate regression topology.
- Added a dedicated `/calc` PWA configuration that builds with `NEXT_PUBLIC_BASE_PATH=/calc`, serves the root-level
  `out/` tree through a `/calc/` host mapping, and runs the same install/offline/update contract in a fresh browser.
- Extended assertions to require the exact worker scope, base-prefixed active/controller script URLs, base-prefixed
  precache asset and navigation keys, and absence of cache requests that escape the configured base path.
- Kept coverage for the more behavioral contract: install and control, offline navigation to an unvisited Options
  route, an offline unknown-route HTML response with status 404, a waiting update prompt, `SKIP_WAITING`, controller
  replacement, and application reload.
- Browser testing exposed a test-host issue that static output validation could not see: `serve-handler` redirected
  explicit `/calc/options/index.html` precache requests to absolute `/options/index`, losing the base path and aborting
  worker installation. The host now disables clean-URL redirects only for explicit `.html` files while retaining
  index resolution for normal `/calc/` and `/calc/options/` navigations.
- Added the base-path PWA workflow to package scripts and CI, and documented both production PWA commands in English
  and Chinese.

Files and areas:

- `playwright.pwa.config.ts` and `playwright.pwa-base-path.config.ts`
- `e2e/pwa-offline.spec.ts` and `scripts/serve-pwa-e2e.mjs`
- `package.json`, `.github/workflows/ci.yml`, both READMEs, and review/log documentation

Verification:

- Root production PWA workflow: 1 test passed after the server refactor.
- `/calc` production PWA workflow: 1 test passed with exact scope, cache-prefix, offline route/404, and update checks.
- Focused TypeScript and ESLint checks passed.
- `npm run verify`: passed; 42 Vitest files and 354 tests passed, static artifact checks passed, and all route bundle
  budgets passed.
- `npm audit`: zero known vulnerabilities; expanded Prettier check and `git diff --check`: passed.

### Improvement 14: Compile-time and catalog-level bilingual copy integrity

Status: completed.

Changes:

- Promoted the existing nested translation-key union into the `useLanguage().t` contract. Literal translation typos
  now fail TypeScript instead of rendering the raw key at runtime.
- Applied the same `TranslationKey` type to navigation section titles, item titles/descriptions, and the Help FAQ key
  registry. Dynamic key containers must now state their bilingual-copy contract explicitly.
- Exported the read-only English/Chinese catalogs for integrity tests without changing the runtime dictionary selected
  by `LanguageProvider`.
- Added catalog traversal that requires identical English and Chinese leaf-key sets and non-empty values for every
  entry. The current catalogs contain 537 typed leaf keys.
- Added TypeScript-AST scanning for literal `t()` calls across all `src` TypeScript/JavaScript files. More than 250
  distinct literal calls are resolved against both catalogs with file/line diagnostics for a missing key.
- Added route-to-copy coverage: every checked-in `src/app/*/page.tsx` user route must appear exactly once in root or
  `NAV_ITEMS`, and every desktop/mobile navigation label and description must resolve in both languages.

Files and areas:

- `src/lib/i18n.tsx`, `src/lib/nav-config.ts`, and `src/lib/i18n-catalog.test.ts`
- `src/app/help/page.tsx`
- README and review/log documentation

Verification:

- Focused catalog suite: 3 tests passed.
- Strict TypeScript and focused ESLint passed after the key contract was tightened.
- `npm run verify`: passed; 43 Vitest files and 357 tests passed.
- Static export remained 15 routes and 197 precache assets; every route bundle size was unchanged and within budget.
- `npm audit`: zero known vulnerabilities; expanded Prettier check and `git diff --check`: passed.
