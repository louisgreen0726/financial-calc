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
- [x] Add independently sourced reference fixtures for the highest-impact financial formulas.
- [x] Design bounded, schema-versioned history import/export with duplicate handling and validation.
- [x] Profile CI jobs and split/cache independent gates where it reduces feedback time without weakening coverage.
- [x] Extract VaR/CVaR calculations from the route component into a pure tested engine with external tail references.
- [x] Assess and implement hash-based CSP generation for static export with host-independent enforcement.
- [x] Add property/fuzz coverage for URL and history restoration across every calculator schema.
- [ ] Add deterministic historical/stress scenarios alongside normal VaR without implying predictive certainty.
- [ ] Audit input-unit labels and display/export rounding consistency across all calculators.
- [ ] Plan and test remaining major dependency migrations as isolated compatibility batches.
- [ ] Reduce `style-src 'unsafe-inline'` exposure by inventorying static versus runtime component/chart styles.

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

### Improvement 15: Pinned external finance vectors and higher-precision normal CDF

Status: completed.

Changes:

- Added a machine-readable external fixture set pinned to NumPy Financial commit
  `f47e8af289f9abd34002267c6663869b9ed586a8` (BSD-3-Clause) and OpenGamma Strata commit
  `39c46e342a4a95ac083d66287f038f6ae276692a` (Apache-2.0). Each source URL, commit, license, expected value, and
  case-specific tolerance is checked in and reviewable without network access.
- Added nine NumPy/Google Sheets-compatible vectors covering PV, beginning/end FV, PMT, NPER, RATE, NPV, and both
  positive and negative IRR. These use the upstream published values and tolerances rather than values regenerated by
  this repository.
- Added three representative calls from Strata's precomputed 9-strike x 7-volatility x 7-rate Black-Scholes matrix,
  including negative rates/dividend yield, ATM moderate volatility, and a high-strike/high-volatility case. The
  documented `b = r - q` mapping converts Strata cost of carry to this engine's continuous dividend yield.
- The initial external run exposed a `1.4924e-5` ATM call-price difference from the existing low-order normal-CDF
  approximation. Replaced it with a piecewise high-precision rational/tail approximation instead of weakening the
  fixture tolerance.
- Added direct standard-normal checks at `0`, `+/-1`, `+/-6`, and `+/-8` standard deviations. All three Strata prices
  now pass at `1e-10` absolute tolerance while preserving extreme-tail behavior.
- Added fixture provenance documentation that forbids regenerating expected values from local formulas and requires
  pinned-source review for future migrations.

Files and areas:

- `src/test/fixtures/financial-reference-cases.json` and `src/test/fixtures/README.md`
- `src/lib/financial-reference-cases.test.ts`
- `src/lib/finance-math.ts`
- README and review/log documentation

Verification:

- External fixture suite: 20 tests passed (9 financial vectors, 3 Strata prices, 7 normal CDF points, 1 provenance
  contract).
- Focused finance/options suite: 3 files and 134 tests passed.
- `npm run verify`: passed; 44 Vitest files and 377 tests passed.
- Options Playwright workflows: 2 tests passed across desktop localization/share and mobile layout.
- Static export remained 15 routes and 197 precache assets. The higher-precision engine added about 213 gzip bytes to
  Finance-consuming routes; unaffected routes were unchanged and all budgets passed.
- `npm audit`: zero known vulnerabilities; expanded Prettier check and `git diff --check`: passed.

### Progress checkpoint: 05:53 +08:00

- Continuous-session elapsed time: 2 hours 47 minutes.
- Completed and committed improvement batches: 14; Improvement 15 is fully verified and ready to commit.
- Current work: independent formula fixtures and the normal-CDF precision improvement are complete.
- Queue status: 5 active items remain; history import/export and pure VaR/CVaR extraction are the next highest-value
  implementation candidates.

### Improvement 16: Bounded, versioned, idempotent history backup restore

Status: completed.

Changes:

- Added a pure history-import planner that accepts legacy history arrays and the current v1 envelope while rejecting
  malformed top-level data, unknown schema versions, and imports above 5,000 candidates.
- Reuses the storage schema's field, page, finite-number, clock-skew, 30-day expiry, and per-page 50-record limits.
  Invalid/expired/future records are skipped; duplicate IDs keep the newest record; existing records are updated only
  by a newer timestamp; importing the same backup repeatedly is idempotent.
- Added a 2 MB browser file limit before JSON parsing. Import summaries separately report added, updated, duplicate,
  skipped, and final total counts.
- Settings now exports a repaired v1 envelope instead of blindly downloading raw localStorage. The new JSON import
  control parses and previews changes in a confirmation dialog, then re-reads and recomputes the merge inside the
  existing cross-tab storage lock before writing, so changes made after preview are not overwritten.
- Import preserves unknown future local storage versions instead of downgrading them, reports blocked storage, emits
  the existing same-tab history change event on success, and surfaces localized success/no-change/invalid/oversize/
  unsupported feedback.
- Added English/Chinese UI copy under the compile-time translation-key contract and updated user-facing feature docs.

Files and areas:

- `src/lib/calculation-history.ts` and its tests
- `src/app/settings/page.tsx` and its tests
- `src/lib/i18n.tsx`
- `e2e/history-import.spec.ts` and `e2e/accessibility.spec.ts`
- README and review/log documentation

Verification:

- Focused schema/settings/i18n suite: 3 files and 20 tests passed.
- Browser workflow: valid preview/write, repeated-import deduplication, malformed-file rejection, and storage
  preservation passed.
- Axe interaction scan for the history import preview dialog passed.
- `npm run verify`: passed; 44 Vitest files and 384 tests passed.
- Full standard Playwright suite: 20 tests passed.
- Static export remained 15 routes and 197 precache assets; all route budgets passed. Shared localized copy added about
  0.7 KB gzip, while Settings added about 2.0 KB and remains 262,792 / 300,000.
- `npm audit`: zero known vulnerabilities; `git diff --check`: passed.

### Improvement 17: Pure parametric-normal VaR/CVaR engine and tail references

Status: completed.

Changes:

- Moved the Risk page's annual-volatility scaling, inverse-normal quantile, VaR, and normal Expected Shortfall/CVaR
  calculations into a reusable pure `calculateParametricNormalRisk` engine.
- Replaced page-specific abbreviated fields with explicit value/fraction, horizon volatility, z-score, and expected-
  shortfall-factor outputs. The route now owns only parsing, Zod validation, rendering, history, export, and chart data.
- The engine rejects non-finite values, non-positive portfolio/horizon/trading-year domains, negative volatility,
  non-integer horizons, and confidence outside `(0.5, 1)`, and returns `null` rather than partial non-finite metrics.
- Added NIST-standard-normal-backed one-day 95% and 99% reference cases for a 100,000 portfolio at 20% annual
  volatility. The tests also verify closed-form normal Expected Shortfall `phi(z)/(1-confidence)`, positive loss
  amounts, square-root-of-time scaling, amount/fraction identities, zero volatility, and six invalid domains.
- Added a real browser reference workflow for 100,000 / 20% / 1 day / 99%, requiring `$2,930.92` VaR,
  `$3,357.85` CVaR, and a `2.93%` portfolio-loss fraction with no browser errors.

Files and areas:

- `src/lib/risk-math.ts` and `src/lib/risk-math.test.ts`
- `src/app/risk/page.tsx`
- `e2e/risk-reference.spec.ts`
- README and review/log documentation

Verification:

- Focused risk/finance/chart suite: 3 files and 72 tests passed.
- `npm run verify`: passed; 45 Vitest files and 394 tests passed.
- Full standard Playwright suite: 21 tests passed, including the new browser reference.
- Static export remained 15 routes and 197 precache assets. Risk added about 165 gzip bytes and remains
  419,244 / 470,000; all route budgets passed.
- `npm audit`: zero known vulnerabilities; `git diff --check`: passed.

### Improvement 18: Bounded URL restoration and deterministic cross-calculator properties

Status: completed.

Changes:

- Audited both URL hooks, shared scalar/array serialization, legacy pipe arrays, all page-level restore handlers,
  portfolio-specific normalization, and generic versioned history restoration.
- Added a 4,000-character inbound value gate before numeric/string assignment or JSON parsing, aligning hostile inbound
  state with the existing maximum generated share URL. Oversized scalar values are ignored in favor of defaults.
- Bounded shared array restoration to 120 items, matching the application's maximum cash-flow domain. Both JSON arrays
  and legacy pipe-delimited arrays are truncated before reaching page state.
- Fixed a newly reproduced format-confusion bug: values with a `json:` prefix but an invalid JSON array shape (for
  example `json:{}` or `json:[1,2]`) previously fell through and became a one-element legacy string array. A declared
  JSON format now fails closed; only values without the prefix use the legacy parser.
- Replaced direct dynamic property assignment during restore with `Object.defineProperty`, preserving special own keys
  such as `__proto__` without mutating the result object's prototype.
- Added representative round trips for all nine calculators, 500 seeded JSON-array cases containing pipes, quotes,
  slashes and URL punctuation, hostile size/cardinality cases, malformed JSON types, special keys, and valid history
  envelope round trips for every `CalculatorPageId`.
- Added a browser workflow proving malformed JSON retains the five default cash flows and a 170-item URL is capped at
  120 flows with Add Period disabled and no browser errors.

Files and areas:

- `src/lib/url-state-utils.ts` and `src/hooks/use-shareable-url.ts`
- `src/lib/url-state-properties.test.ts` and `src/lib/calculation-history.test.ts`
- `e2e/url-restore-bounds.spec.ts`
- Review/log documentation

Verification:

- Focused URL/history suite: 4 files and 28 tests passed, including 500 seeded property iterations.
- `npm run verify`: passed; 46 Vitest files and 399 tests passed.
- Full standard Playwright suite: 22 tests passed.
- Static export remained 15 routes and 197 precache assets. Shared parsing added at most about 89 gzip bytes to affected
  routes; every route stayed within budget.
- `npm audit`: zero known vulnerabilities; `git diff --check`: passed.

### Progress checkpoint: 06:24 +08:00

- Continuous-session elapsed time: 3 hours 18 minutes.
- Completed and committed improvement batches: 17; Improvement 18 is fully verified and ready to commit.
- Current work: bounded restoration and the cross-calculator URL/history property matrix are complete.
- Queue status: 5 active items remain; CI feedback-time profiling and static CSP feasibility are next, followed by
  risk stress scenarios, unit/rounding consistency, and isolated dependency migrations.

### Improvement 19: Parallel CI gates with single-build production verification

Status: completed.

Changes:

- Profiled the warm local verification path by phase: formatting 2.48s, type checking 3.05s, lint 12.79s, unit tests
  21.58s, production build 28.40s, static validation 0.65s, and bundle validation 0.95s. The prior CI then performed
  another base-path build and two PWA commands that each rebuilt again, all in one sequential job.
- Added `verify:quality` as the shared format/type/lint/unit gate while retaining `verify` as the complete local gate.
- Split GitHub Actions into independent quality, standard browser, and root/base-path production jobs. Both production
  topologies run in a fail-independent matrix so one deployment failure does not hide evidence from the other.
- Reused each matrix build for static-export validation, per-route gzip budgets, and production PWA tests through an
  explicit `PWA_SKIP_BUILD=1` CI path. Normal local PWA commands continue to build first, protecting developers from
  stale output.
- Added deployment-target-specific Next.js build caches keyed by the lockfile and source/config inputs.
- Uploaded Playwright screenshots and traces for seven days when standard or production browser jobs fail.
- Added configuration tests proving the default build-first behavior, explicit prebuilt-artifact behavior, and
  base-path environment propagation without leaking modified environment state between tests.

Files and areas:

- `.github/workflows/ci.yml`, `package.json`, and `playwright.pwa.config.ts`
- `src/lib/playwright-pwa-config.test.ts`
- English/Chinese operational documentation and engineering review/log records

Verification:

- Focused PWA configuration test: 2 tests passed; strict TypeScript and workflow/source Prettier checks passed.
- Prebuilt root PWA workflow: passed in 9.8s versus the previously recorded 38.2s build-plus-test path.
- `/calc` single-build matrix simulation passed: 15 routes, 197 precache assets, 706 internal references, every route
  bundle budget, and the full PWA install/offline/404/update workflow.
- `npm run verify`: passed; 47 Vitest files and 401 tests passed, followed by a root static export with 15 routes and
  197 precache assets and all route bundle budgets within limits.
- Standard Playwright suite: all 22 tests passed. Production dependency audit reported zero vulnerabilities.
- Workflow YAML parsed successfully with the quality/browser jobs and both production matrix entries; extended
  Prettier and `git diff --check` passed.

### Progress checkpoint: 06:32 +08:00

- Continuous-session elapsed time: 3 hours 26 minutes.
- Completed improvement batches: 19; CI feedback stages now run independently and production artifacts are built once
  per deployment topology.
- Current work: Improvement 19 is fully verified and ready to commit; static CSP feasibility is next.
- Queue status: 4 active items remain: static CSP feasibility, deterministic risk stress scenarios, calculator-wide
  unit/rounding consistency, and isolated major dependency migrations.

### Improvement 20: Host-independent hash-based script CSP for static export

Status: completed.

Changes:

- Audited the final root export with an HTML parser: 16 documents contained 48 globally unique inline script bodies,
  308 external script references, 121 style attributes, 19 style elements, and zero inline event-handler attributes.
- Rejected a fixed nonce because it would be public and reusable in static files. A secure per-response nonce would
  require the runtime server that this static-export architecture intentionally avoids.
- Measured a global SHA-256 script allowlist at about 2,615 characters, above Cloudflare Pages' documented
  2,000-character `_headers` line limit. Each document has only six inline scripts and needs about 370 characters.
- Added a post-build generator that parses every HTML document, hashes its exact inline script text, and inserts a
  `script-src 'self'` meta policy at the start of `<head>`. Blob permission is isolated to `worker-src`. This policy
  intersects with the existing host header,
  so the header's compatibility fallback cannot authorize an unlisted inline script.
- Extended the static-export gate to recompute and validate every document policy before accepting the artifact.
  Missing, duplicate, stale, late, or `unsafe-inline` script policies now fail the build contract.
- Added focused generator/validator tests and updated end-to-end static-export fixtures to use the real policy generator.
- Added a production browser probe that injects an unknown inline script, requires a `securitypolicyviolation`, and
  proves the script did not execute while normal PWA hydration, offline navigation, and update activation still work.
- Documented why inline styles remain a separate boundary: current React charts and UI primitives emit dynamic style
  attributes, while script execution is now independently hash-restricted.

Files and areas:

- `scripts/generate-static-csp.mjs`, `scripts/check-static-export.mjs`, and `package.json`
- `src/lib/static-csp.test.ts` and `src/lib/static-export-check.test.ts`
- `e2e/pwa-offline.spec.ts`
- English/Chinese deployment documentation and engineering review/log records

Verification:

- Focused CSP/static-export suite: 2 files and 8 tests passed; strict TypeScript and targeted formatting passed.
- Root production build generated and validated 96 per-document hash entries across 16 HTML files; static export stayed
  at 15 routes and 197 precache assets, and every route bundle budget passed.
- Root production PWA suite: both the active attack probe and full install/offline/404/update workflow passed.
- `/calc` production matrix also validated 96 hash entries, 706 internal references, every bundle budget, and both CSP
  attack-probe and PWA lifecycle tests.
- `npm run verify`: passed; 48 Vitest files and 404 tests passed, followed by the 15-route root static contract and all
  route budgets. The final root PWA suite passed 2/2 against the newly generated artifact.
- Production dependency audit reported zero vulnerabilities; extended formatting and `git diff --check` passed.

### Progress checkpoint: 06:44 +08:00

- Continuous-session elapsed time: 3 hours 38 minutes.
- Completed improvement batches: 20; static inline scripts are now restricted by exact build-time hashes.
- Current work: Improvement 20 is fully verified and ready to commit; deterministic risk stress scenarios are next.
- Queue status: 4 active items remain: deterministic risk stress scenarios, calculator-wide unit/rounding consistency,
  isolated major dependency migrations, and inline-style CSP reduction.
