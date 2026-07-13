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
- [x] Add deterministic stress scenarios alongside normal VaR without implying predictive certainty.
- [x] Audit and align input-unit labels plus display/export rounding across all calculators.
- [x] Plan and test remaining major dependency migrations as isolated compatibility batches.
- [x] Reduce `style-src 'unsafe-inline'` exposure by inventorying static versus runtime component/chart styles.
- [x] Bound amortization-table DOM rendering without weakening complete exports or accessibility coverage.
- [x] Reduce the remaining dynamic style-attribute compatibility surface in owned components.
- [x] Audit calculator reset/default workflows and add a consistent reversible reset command where missing.
- [x] Add corrupted-storage browser coverage for persisted theme, language, and currency preferences.
- [x] Add browser coverage for denied clipboard/share permissions and export failure recovery.
- [x] Audit service-worker cache growth and storage-quota failure behavior across upgrades.
- [x] Surface theme/language persistence write failures consistently with currency settings.
- [x] Audit remaining preference setters for silent write failures, starting with sidebar collapse state.
- [x] Investigate and eliminate development-only missing translation warnings for Portfolio seed controls.
- [x] Localize default Portfolio asset names without overwriting user-edited or restored names.
- [x] Make local Playwright browser selection deterministic when the pinned browser binary is unavailable.
- [x] Extend preference recovery coverage to failed cleanup of invalid persisted values.
- [x] Consume pending history restores exactly once even when sessionStorage cleanup is blocked.
- [x] Generate and verify base-path-aware static deployment `_headers` rules.
- [x] Validate PWA manifest icons, shortcuts, and base-path asset targets in the static export gate.
- [x] Prevent rapid consecutive `useUrlState` field updates from overwriting earlier edits.
- [x] Split storage feedback between applied session preferences and operations that were not completed.
- [x] Stabilize Black-Scholes log-moneyness for extreme but finite spot/strike ratios.
- [x] Normalize History filters when deleting the last record in the active category.
- [x] Bound legacy cash-flow History parsing so long corrupt records cannot freeze restoration.
- [x] Infer legacy History result formats from stable raw discriminators before localized labels.
- [x] Detect and explain multiple valid TVM RATE roots instead of presenting one as unique.
- [x] Preserve NPV/IRR invariance when appending economically irrelevant zero cash flows.
- [x] Stabilize translation-catalog source scanning under full-suite worker contention.
- [x] Extend formatting enforcement beyond `src/` to E2E, scripts, workflows, and root configuration.
- [x] Add analytic and finite-difference oracles for bond duration and convexity.
- [x] Explain unsupported fractional or over-600 coupon periods with actionable bond input validation.
- [x] Repair stale cross-tab PWA update prompts after another tab activates the waiting worker.
- [ ] Localize remaining hard-coded application-shell copy and refine sidebar information hierarchy.
- [x] Design and validate a compatible-history scenario comparison workflow before implementation.
- [ ] Add a strict two-record comparison UI for compatible non-currency History results.
- [x] Handle cross-tab `localStorage.clear()` without reviving queued history or favorite writes.

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

### Improvement 21: Deterministic portfolio stress scenarios with bounded mobile presentation

Status: completed.

Changes:

- Added pure deterministic stress calculations for fixed -5%, -10%, and -20% aggregate portfolio shocks. Each result
  includes loss, stressed value, and an optional loss-to-VaR multiple.
- Kept stress math independent from volatility, time horizon, and confidence. UI copy assigns no probability and calls
  the scenarios mechanical shocks rather than forecasts or historical calibrations.
- Guarded invalid domains and extreme floating-point ratios; zero or subnormal VaR produces a localized not-comparable
  value instead of `Infinity`.
- Added a bilingual semantic table beside the normal distribution view, with fixed scenario labels, numeric alignment,
  currency formatting, and explicit model-boundary copy.
- Included deterministic scenarios in result sharing and structured CSV/JSON/PDF output while preserving VaR as the
  history record's primary indexed result and keeping share URLs unchanged because no input was added.
- Expanded the bilingual model guide with exact scenario mechanics, a reproducible 100,000 / 10% example, and limits
  covering asset repricing, nonlinear exposure, correlation breakdown, margin calls, liquidity, impact, and recovery.
- Desktop/mobile screenshot review reproduced a 390px document-overflow regression from table min-content sizing.
  Added `min-w-0` at the report grid boundary so only the table scrolls horizontally, plus a browser geometry contract.
- Capped local Playwright execution at two workers after 8 simultaneous Axe scans consistently exceeded the 30-second
  per-test budget without accessibility violations. CI remains at one worker; the stable local default passed all tests.

Files and areas:

- `src/lib/risk-math.ts`, its tests, and bilingual model-guide content
- `src/app/risk/page.tsx` and `src/lib/i18n.tsx`
- `e2e/risk-reference.spec.ts` and `playwright.config.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Focused risk/i18n suite passed; the complete `npm run verify` gate passed with 48 files and 411 Vitest tests.
- Root build remained 15 routes and 197 precache assets with 96 inline-script hashes and 722 internal references.
- `/risk` measured 420,663 / 470,000 gzip bytes, about 1.35 KB above the preceding build; every route budget passed.
- Focused desktop/mobile risk workflows passed, including exact -20% values and document-versus-local overflow geometry.
- Desktop 1440px and mobile 390px full-page screenshots were visually inspected after the overflow fix.
- The final default Playwright suite passed all 23 tests with two local workers; the risk Axe scan passed in 22.7s.
- Production dependency audit reported zero vulnerabilities; extended formatting and `git diff --check` passed.

### Progress checkpoint: 07:15 +08:00

- Continuous-session elapsed time: 4 hours 9 minutes.
- Completed improvement batches: 21; deterministic stress results now complement normal VaR without probability claims.
- Current work: Improvement 21 is fully verified and ready to commit; calculator-wide unit/rounding review is next.
- Queue status: 3 active items remain: calculator-wide input-unit/rounding consistency, isolated major dependency
  migrations, and inline-style CSP reduction.

### Improvement 22: Unit-bearing reports with schema-v2 raw/display separation

Status: completed.

Changes:

- Audited all eleven `ResultActions` call sites across TVM, Cash Flow, Equity, Bonds, Portfolio, Options, Risk, Loans,
  and Macro against their UI labels, internal units, history formats, and export representations.
- Added a pure report-field labeler and made `inputLabels` compile-time mandatory whenever result actions receive
  inputs. Missing labels now fail TypeScript rather than leaking internal keys into future reports.
- Added optional display inputs for enum and scaled values. Reports now show localized payment timing/frequency/method,
  option type, 99% confidence, and detailed portfolio asset return/risk values instead of raw codes or decimals.
- Applied bilingual, unit-bearing input labels to every result action. Fixed Portfolio's risk-free-rate label to include
  `%`, and added a catalog test covering all percentage and time-unit input labels in both languages.
- Upgraded report export schema from v1 to v2. JSON now includes localized `report.inputs`, stable
  `report.rawInputs`, display-rounded `report.results`, and raw-precision `data`; CSV includes both `input.*` and
  `rawInput.*` context columns.
- Aligned implied-volatility human output at 2 decimal places across the visible result, sharing, CSV, and JSON report
  summary while preserving its unrounded decimal in `data.impliedVolatility`.
- Added focused tests for label fallback/special keys, schema-v2 JSON/CSV structure, bilingual unit markers, and a real
  Options JSON download that verifies display labels, raw keys, enum values, rounding, and machine precision together.

Files and areas:

- `src/components/result-actions.tsx`, `src/components/export-menu.tsx`, and all calculator result-action call sites
- `src/lib/report-fields.ts`, `src/lib/data-export.ts`, and focused tests
- `src/lib/i18n.tsx`, translation contract tests, and `e2e/options-dividend.spec.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Focused report/export/i18n suite: 3 files and 13 tests passed; strict TypeScript and targeted formatting passed.
- Focused Options browser workflow downloaded and validated the schema-v2 report successfully.
- `npm run verify`: passed; 49 Vitest files and 415 tests passed.
- Root export remained 15 routes, 197 precache assets, 96 inline-script hashes, and 722 internal references; every route
  bundle budget passed.
- The final default Playwright suite passed all 23 tests, including schema-v2 JSON download and the updated
  unit-bearing Portfolio slider contract.
- Production dependency audit reported zero vulnerabilities; strict TypeScript, ESLint, extended formatting, and
  `git diff --check` passed after the final compile-time input-label constraint.

### Progress checkpoint: 07:43 +08:00

- Continuous-session elapsed time: 4 hours 37 minutes.
- Completed improvement batches: 22; all calculator reports now preserve both unit-bearing display inputs and raw keys.
- Current work: Improvement 22 is fully verified and ready to commit; major dependency compatibility is next.
- Queue status: 2 active items remain: isolated major dependency migrations and inline-style CSP reduction.

### Improvement 23: Lucide React 1.x migration with deterministic large-document accessibility coverage

Status: completed.

Changes:

- Upgraded `lucide-react` from 0.561.0 to 1.24.0 after confirming the new major's React 19 peer contract and checking
  every existing icon import through strict TypeScript, ESLint, production bundling, and browser rendering.
- Measured the generated route bundles after the migration rather than assuming tree shaking remained stable. Route
  gzip sizes increased by roughly 50-250 bytes; `/portfolio` remained the largest route at 452,584 / 500,000 bytes.
- Investigated an intermittent Loans Axe failure that surfaced during the full browser run. The trace showed that the
  runner closed the page at its 30-second test deadline while Axe was traversing the complete 360-period table, whose
  accessibility tree contains about 2,400 nodes; it was not a page navigation or an icon-rendering regression.
- Made route readiness explicit by waiting for network idle and a visible `main` element before injecting Axe.
- Assigned only the exhaustive Loans document scan a 60-second budget. All other browser tests retain the default
  30-second limit, and the full amortization table remains covered instead of being excluded to make the test faster.

Files and areas:

- `package.json` and `package-lock.json`
- `e2e/accessibility.spec.ts`

Verification:

- `npm run verify`: passed; strict TypeScript, ESLint, 49 Vitest files and 415 tests, production build, static-export
  validation, and all route bundle budgets passed.
- The production export remained at 15 routes, 197 precache assets, 96 exact inline-script hashes, and 722 validated
  internal references.
- The Loans accessibility baseline passed three consecutive runs with two workers, including two concurrent scans;
  the final complete Playwright suite passed all 23 tests in 2.6 minutes.
- Production dependency audit reported zero vulnerabilities; changed-file Prettier checks and `git diff --check`
  passed.

### Progress checkpoint: 08:12 +08:00

- Continuous-session elapsed time: 5 hours 6 minutes.
- Completed improvement batches: 23; the icon stack now uses the supported 1.x line without bundle-budget regression.
- Current work: Improvement 23 is fully verified and ready to commit; ESLint 10 compatibility is next.
- Queue status: 3 active items remain: ESLint 10 migration, inline-style CSP reduction, and amortization-table rendering
  scalability without weakening complete exports or accessibility coverage.

### Improvement 24: Per-document style-element CSP with deterministic runtime allowances

Status: completed.

Changes:

- Inventoried the root static export with an HTML parser: 16 documents contained 19 style elements and 121 style
  attributes. The attributes include runtime-mutated Radix scroll/slider state, chart/heatmap values, and workspace
  visual variables, so a blanket attribute hash policy would break supported interactions.
- Extended the build-generated meta policy with exact `style-src-elem` SHA-256 hashes for every static style block.
  `unsafe-inline` is now isolated to `style-src-attr`; scripts and unlisted style elements do not inherit it.
- Traced initial browser violations to Sonner's deterministic startup behavior: it appends an empty style node and then
  writes its packaged CSS. The generator resolves the installed Sonner module, statically extracts its single CSS
  injection, and hashes both sources. Package upgrades therefore update the allowlist from actual installed code
  instead of relying on a copied version-specific hash.
- Extended static validation to recompute script, static-style, and runtime-style sources; reject stale or element-level
  `unsafe-inline` policies; and require the meta policy to precede both the first script and first style element.
- Expanded the production attack probe to inject an unknown style block, require a `style-src-elem` violation, and
  verify its custom property was not applied. Existing script blocking remains covered in the same workflow.
- Tested ESLint 10.7.0 as an isolated compatibility batch and restored ESLint 9.39.5 after `npm ls` proved that the
  latest import, JSX accessibility, and React plugins still declare only ESLint 9 peers. TypeScript 7 remains outside
  `typescript-eslint`'s supported range, and Node types remain aligned with the Node 20 runtime contract.
- Updated English/Chinese deployment instructions and the engineering review with the exact style-element versus
  style-attribute trust boundary.

Files and areas:

- `scripts/generate-static-csp.mjs` and `scripts/check-static-export.mjs`
- `src/lib/static-csp.test.ts` and `src/lib/static-export-check.test.ts`
- `e2e/pwa-offline.spec.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Focused CSP/static-export suite: 2 files and 8 tests passed, including stale script/style content and late-policy
  rejection; strict TypeScript and ESLint passed after the final ordering invariant.
- `npm run verify`: passed with 49 Vitest files and 415 tests, followed by production build, static checks, and every
  route bundle budget. `/portfolio` remained at 452,584 / 500,000 gzip bytes.
- Root export validated 15 routes, 197 precache assets, 96 inline-script hashes, 19 static-style hashes, 2 runtime-style
  hashes per document, 722 internal references, and both CSP/PWA browser tests.
- `/calc` production export validated the same route/assets/hash counts, 706 internal references, all bundle budgets,
  and both base-path CSP/PWA browser tests.
- Production dependency audit reported zero vulnerabilities; extended Prettier and `git diff --check` passed.

### Progress checkpoint: 08:34 +08:00

- Continuous-session elapsed time: 5 hours 28 minutes.
- Completed improvement batches: 24; arbitrary inline style elements are now blocked without breaking dynamic
  component style attributes.
- Current work: Improvement 24 is fully verified and ready to commit; amortization-table DOM scalability is next.
- Queue status: 3 active items remain: bounded amortization rendering, reducing owned dynamic style attributes, and
  calculator-wide reversible reset/default workflows.

### Improvement 25: Bounded amortization DOM with complete structured and print exports

Status: completed.

Changes:

- Replaced the live 360-600-row amortization DOM with stable 100-row pages using the existing display-row boundary.
  Previous/next icon controls expose localized names, disabled end states, a live page indicator, and visible/total row
  ranges; the table keeps its named keyboard-scroll region and semantic row/column headers.
- Keyed pagination to method and raw loan inputs so any direct edit, restored history item, shared URL, or browser
  navigation starts the corresponding schedule on page one without a state-setting effect or stale out-of-range page.
- Added a shared print-mode lifecycle callback through result actions, export menus, share dialogs, and the print
  coordinator. Loans expands the live table to all rows, waits for React/layout to settle, opens the print dialog, and
  restores the selected bounded page on `afterprint` or fallback cleanup.
- Kept CSV and JSON connected to the complete schedule array rather than the visible slice. A browser download contract
  verifies that a 50-year schedule emits all 600 data rows, while a print probe observes all 600 DOM rows exactly when
  `window.print()` is invoked and only 100 after cleanup.
- Removed an incorrect `max=100` attribute from the loan amount input. It had reused the interest-rate maximum and made
  the default 500,000 amount fail native HTML validity even though the calculation schema correctly accepted it.
- Removed the Loans-only 60-second Axe allowance introduced for the former 2,400-node accessibility tree. The paginated
  route now passes under the same 30-second budget as every other page.
- Updated bilingual feature documentation and engineering review evidence for bounded live rows versus complete
  machine/print output.

Files and areas:

- `src/app/loans/page.tsx` and bilingual pagination labels in `src/lib/i18n.tsx`
- `src/lib/print-report.ts`, shared result/export/share components, and print coordinator tests
- `e2e/loans-pagination.spec.ts` and `e2e/accessibility.spec.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Focused print/i18n suite passed with 8 tests; the Loans browser contract passed pagination, native validity, 600-row
  CSV, 600-row print expansion, cleanup restoration, and console-error checks.
- Three Loans Axe runs passed with two workers. Concurrent scans fell from roughly 24-25 seconds before pagination to
  19 seconds in the repeated profile; the final full suite completed the route in 17 seconds under the default limit.
- `npm run verify`: passed with 49 Vitest files and 416 tests, 15 routes, 197 precache assets, unchanged CSP hash counts,
  722 internal references, and every route budget. `/loans` measured 422,794 / 470,000 gzip bytes.
- The complete Playwright suite passed all 24 tests in 2.6 minutes.
- Desktop 1440px and mobile 390px screenshots were inspected. Both rendered exactly 100 live rows with no document
  overflow; table/pager widths were 686px desktop and 356px mobile, and mobile pager/navigation overlap was zero.
- Production dependency audit reported zero vulnerabilities; extended Prettier and `git diff --check` passed.

### Progress checkpoint: 08:52 +08:00

- Continuous-session elapsed time: 5 hours 46 minutes.
- Completed improvement batches: 25; large loan schedules no longer inflate the live accessibility tree or require a
  special browser timeout, while all export formats remain complete.
- Current work: Improvement 25 is fully verified and ready to commit; owned dynamic style attributes are next.
- Queue status: 3 active items remain: owned style-attribute reduction, reversible calculator reset/default workflows,
  and corrupted preference-storage browser coverage.

### Improvement 26: Owned inline-style reduction with hashed base-path visuals

Status: completed.

Changes:

- Re-audited all 16 exported documents after style-element CSP enforcement and separated owned values from
  runtime-required third-party layout values.
- Moved base-path-aware light/dark workspace image variables from the `<body style>` attribute into one static style
  block per document. The existing build generator now hashes those blocks, so root and `/calc` asset URLs retain
  static-export portability without consuming the attribute-level compatibility exception.
- Replaced 25 continuously generated bond heatmap style attributes with nine bounded `data-heatmap-level` values and
  static light/dark CSS palettes. Non-finite or flat datasets resolve to a stable middle level, and cells retain
  readable foreground contrast in both themes.
- Removed the heatmap's theme hook and per-render color strings. The Bonds route shed about 620 gzip bytes while the
  rendered matrix still exposes eight distinct levels for its current 5x5 dataset.
- Moved four fixed Sonner theme variables from its React `style` prop into a higher-specificity static rule while
  leaving Sonner's genuinely dynamic width, gap, offset, and toast-height values intact.
- Extended the root/base-path production CSP probe to require exactly one workspace style block and verify the applied
  pseudo-element background URL includes the deployment prefix.
- Updated engineering security evidence: aggregate exported style attributes fell from 121 to 80 (34%), while static
  style blocks increased from 19 to 35 and remain covered by exact per-document hashes.

Files and areas:

- `src/app/layout.tsx` and `src/app/globals.css`
- `src/components/sensitivity-heatmap.tsx`, its focused test, and `src/components/ui/sonner.tsx`
- `e2e/pwa-offline.spec.ts`
- Engineering review and improvement log

Verification:

- Focused heatmap/CSP suite passed with 4 tests; cell extrema map to levels 0/8 and no data cell retains a style
  attribute. Strict TypeScript and ESLint passed.
- A parsed root export contained 80 style attributes, 35 style blocks, and exactly 16 workspace configuration blocks.
- `npm run verify`: passed with 49 files and 416 tests, 15 routes, 197 precache assets, 96 script hashes, 35 static
  style hashes, 2 runtime style hashes per document, 722 internal references, and every route budget.
- Root and `/calc` CSP/PWA suites each passed 2/2. The base-path artifact validated 706 internal references and all
  route budgets; its browser probe observed `/calc/visuals/workspace-*` as the applied background.
- Desktop light/dark Bonds screenshots were inspected. The heatmap produced eight computed background colors, no
  inline cell styles, readable dark-theme text, the correct workspace image, and zero console errors.
- Production dependency audit reported zero vulnerabilities; extended Prettier and `git diff --check` passed.

### Progress checkpoint: 09:06 +08:00

- Continuous-session elapsed time: 6 hours.
- Completed improvement batches: 26; owned inline style attributes are reduced by 34% and base-path visuals now sit
  behind exact style-element hashes.
- Current work: Improvement 26 is fully verified and ready to commit; calculator reset/default consistency is next.
- Queue status: 3 active items remain: reversible reset/default workflows, corrupted preference-storage coverage, and
  denied clipboard/share/export recovery.

### Improvement 27: Reversible Reset defaults across all calculators

Status: completed.

Changes:

- Audited all nine calculators. TVM alone had a Clear command that emptied values; Cash Flow, Equity, Portfolio, Bonds,
  Options, Risk, Loans, and Macro had no consistent way to restore defaults.
- Added one bilingual Reset defaults action to every calculator header. The shared component uses a familiar reset icon,
  preserves base paths/hash fragments/unrelated query parameters, removes only the active calculator prefix, and shows
  an Undo action through the existing notification system.
- Unified both state architectures by explicitly notifying `popstate` after History API replacements. This keeps
  Next `useSearchParams` and the local `useShareableUrl` subscription synchronized without issuing competing router
  transitions.
- Improved `useUrlState.reset()` itself so future callers remove only owned keys rather than discarding all query
  parameters. Added a focused contract that preserves analytics and unrelated feature state.
- Captured page-specific Undo state rather than only input text: TVM restores results, errors, derivation steps, and
  touched fields; Equity/Macro restore active models and interaction state; Loans restores recording state; all simple
  calculators restore their interaction/error state.
- Portfolio captures cloned assets, risk-free rate, correlation, seed, simulation points, optimal/minimum-volatility
  results, and freshness signature. Reset is disabled while the worker is running because a canceled computation cannot
  honestly be restored by Undo.
- Exercised the browser matrix under two workers. Initial implementations exposed two real TVM/Loans URL races: an
  asynchronous router write could land after direct cleanup or Undo. Replacing the competing writes with one History
  API update plus explicit location notification eliminated the race; six concurrent repeated cases then passed.
- Documented the reset/Undo behavior in English/Chinese README and the engineering review.

Files and areas:

- `src/components/reset-defaults-button.tsx` and its focused test
- All nine calculator route pages and bilingual common labels
- `src/hooks/use-url-state.ts` and its reset contract
- `e2e/reset-defaults.spec.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Focused reset, URL-state, and translation suites passed with 11 tests; strict TypeScript and ESLint passed across all
  nine page integrations.
- The nine-route browser matrix passed 9/9 under two workers. TVM/Loans additionally passed six repeated concurrent
  cases after the location-notification fix.
- `npm run verify`: passed with 50 Vitest files and 418 tests, 15 routes, 197 precache assets, 96 script hashes, 35
  static style hashes, 722 internal references, and every route budget.
- The complete Playwright suite passed all 33 tests in 3.3 minutes, including all route Axe scans and existing workflows.
- A focused component contract used `/calc/options/` and proved Reset/Undo preserves the base path, fragment, unrelated
  query parameter, calculator value, and original History state.
- Production dependency audit reported zero vulnerabilities; extended Prettier and `git diff --check` passed.

### Progress checkpoint: 09:52 +08:00

- Continuous-session elapsed time: 6 hours 46 minutes.
- Completed improvement batches: 27; every calculator now has a consistent default recovery path with a real Undo.
- Current work: Improvement 27 is fully verified and ready to commit; corrupted preference-storage coverage is next.
- Queue status: 3 active items remain: corrupted preference storage, denied clipboard/share/export recovery, and
  service-worker storage-quota behavior.

### Improvement 28: Self-healing cross-tab preference storage

Status: completed.

Changes:

- Audited theme, language, and display-currency hydration plus cross-tab event handling. All three safely fell back from
  invalid strings, but corrupt values remained indefinitely in localStorage and the Settings currency selection did
  not follow another tab even though currency formatters did.
- Added supported-value validation and repair at the provider boundary. Invalid persisted themes, languages, and
  currencies are removed and resolve to system, English, and USD. Storage access failures remain caught by the existing
  safe wrappers and are not mistaken for corrupt values.
- Applied the same repair to runtime `storage` events. Valid cross-tab values update theme classes, document language,
  translations, currency formatting, and Settings selection; invalid updates restore defaults and delete the bad key.
- Made Settings subscribe to both real cross-tab currency events and the existing same-tab custom event, with symmetric
  cleanup. Its selected button can no longer drift from the currency used by calculator formatters.
- Added unit coverage for invalid theme/language/currency startup values and a production-like browser workflow that
  injects corrupt storage before hydration, then alternates valid and invalid cross-tab updates for all three settings.
- Updated bilingual Settings descriptions and engineering review evidence.

Files and areas:

- `src/components/theme-provider.tsx` and focused tests
- `src/lib/i18n.tsx`, `src/hooks/use-locale-format.test.tsx`, and `src/app/settings/page.tsx`
- `e2e/preferences-storage.spec.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Focused theme/locale/Settings suite passed with 11 tests; strict TypeScript and ESLint passed.
- The browser workflow repaired initial `sepia`, `fr`, and `BTC` values; synchronized valid `dark`, `zh`, and `EUR`
  events; repaired a second invalid update for each key; and reported zero console/page errors.
- `npm run verify`: passed with 50 Vitest files and 420 tests, 15 routes, 197 precache assets, 96 script hashes, 35
  static style hashes, 722 internal references, and every route budget.
- The complete Playwright suite passed all 34 tests in 3.6 minutes, including Settings Axe coverage, Reset/Undo, and
  the new preference corruption flow.
- Production dependency audit reported zero vulnerabilities; extended Prettier and `git diff --check` passed.

### Progress checkpoint: 10:06 +08:00

- Continuous-session elapsed time: 7 hours.
- Completed improvement batches: 28; persisted visual/locale preferences now self-repair and stay synchronized across
  tabs and Settings UI.
- Current work: Improvement 28 is fully verified and ready to commit; denied clipboard/share/export recovery is next.
- Queue status: 3 active items remain: denied clipboard/share/export recovery, service-worker quota behavior, and
  explicit theme/language write-failure feedback.

### Improvement 29: Recoverable share, clipboard, and export failures

Status: completed.

Changes:

- Audited all shared copy, native-share, CSV, JSON, and print entry points. A rejected modern Clipboard API call
  previously skipped the available legacy path, while every native-share rejection was silently treated as a user
  cancellation. Export handlers caught failures, but their retry behavior had no regression coverage.
- Changed clipboard copying to try `document.execCommand("copy")` after secure-context Clipboard API rejection. The
  fallback always removes its temporary textarea and restores the previously focused element. If both paths fail, an
  `AggregateError` preserves both causes for diagnostics; even an unusual `Promise.reject(undefined)` is tracked as a
  real attempted failure.
- Classified native-share `AbortError` as an expected cancellation across realm-compatible error objects. Permission,
  payload, and platform failures are logged and surface a bilingual message directing users to link/text copy options,
  which remain interactive.
- Added hook contracts proving repeated CSV and JSON object-URL failures show errors without emitting false success or
  disabling later retries. Added a browser recovery chain for cancelled/denied sharing, Clipboard API plus legacy-copy
  denial, a successful legacy retry, two consecutive CSV failures, and a missing print target with Export re-enabled.
- Updated both READMEs and the engineering review with the new failure semantics and maintenance boundary.

Files and areas:

- `src/lib/clipboard.ts`, focused unit tests, and bilingual share translations
- `src/components/share-dialog.tsx` and its native-share failure tests
- `src/hooks/use-export.test.tsx` and `e2e/share-export-failures.spec.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Focused clipboard/share/export/copy regression suite passed 9 tests; strict TypeScript and ESLint passed.
- The browser recovery workflow passed with no uncaught page errors. Expected operational failures were logged, every
  user-facing error appeared, legacy copy recovered after permission denial, and Export remained enabled after two
  download failures plus a print failure.
- `npm run verify`: passed with 53 Vitest files and 426 tests, 15 routes, 197 precache assets, 96 script hashes, 35
  static style hashes, 2 runtime style hashes per document, 722 internal references, and every route budget.
- The complete Playwright suite passed all 35 tests in 4.3 minutes, including all route Axe scans, pagination,
  Reset/Undo, preference repair, and the new failure workflow.
- Production dependency audit reported zero vulnerabilities; changed-file Prettier and `git diff --check` passed.
- A broader advisory Prettier scan still reports three pre-existing unmodified files (`generate-workspace-visuals.mjs`,
  `vitest.config.ts`, and `tsconfig.json`); they are intentionally excluded from this behavioral commit.

### Progress checkpoint: 10:27 +08:00

- Continuous-session elapsed time: 7 hours 21 minutes.
- Completed improvement batches: 29; denied browser capabilities now fall back where possible, explain real failures,
  and preserve retryable UI state.
- Current work: Improvement 29 is fully verified and ready to commit; service-worker cache growth and quota recovery is
  next.
- Queue status: 2 active items remain: service-worker cache growth/storage-quota behavior and explicit theme/language
  write-failure feedback. The next audit will add follow-up items before this queue can become empty.

### Improvement 30: Bounded service-worker cache growth and quota recovery

Status: completed; final round per user instruction.

Changes:

- Modeled install, activate, cache-first, network-first, offline fallback, version upgrade, and CacheStorage failure
  behavior. The runtime cache nominally capped itself at 40 entries, but wrote a 41st item before trimming. A quota
  failure therefore happened before cleanup and could reject a successful asset response or send an online navigation
  into stale/offline fallback handling.
- Made cache reads, opens, and writes best effort around successful network requests. Runtime writes reserve a slot
  before adding a genuinely new key; `QuotaExceededError` trims the cache to 20 entries and retries once. If storage is
  disabled or both writes fail, the original network response still reaches the page and warnings are deduplicated per
  cache operation.
- Removed 15 clean-navigation aliases from the static install cache. Offline navigation already maps clean paths to
  emitted `index.html` assets, so the aliases duplicated about 970,939 bytes in the current build without adding
  coverage. Each installed version now has 197 static entries rather than 212, reducing upgrade coexistence by about
  1.94 MB before the old version is removed.
- Added transactional install cleanup: if either essential offline document cannot be cached, the partially populated
  new version cache is deleted before installation rejects. Stale-cache deletion now uses settled results, so one busy
  old cache does not prevent client claiming or the rest of the cleanup.
- Expanded deterministic worker VM coverage for double quota failure, storage-open/write failure, bounded eviction,
  partial-install cleanup, and isolated activation deletion. Updated production PWA checks to require emitted route
  assets and the absence of duplicate clean-path aliases.
- Updated bilingual reliability documentation and engineering review evidence.

Files and areas:

- `public/sw.js`
- `src/lib/service-worker-script.test.ts`
- `e2e/pwa-offline.spec.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Focused service-worker VM suite passed 12 tests; strict TypeScript and ESLint passed.
- Root production PWA suite passed 2/2: exact CSP enforcement, 197-asset installation without route aliases, offline
  Options navigation, offline 404 status, waiting-worker prompt, explicit activation, and reload all succeeded.
- `/calc` production PWA suite passed the same 2/2 contract with base-prefixed scope, worker, cache keys, assets,
  offline routes, and update flow.
- `npm run verify`: passed with 53 Vitest files and 429 tests, 15 routes, 197 precache assets, 96 script hashes, 35
  static style hashes, 2 runtime style hashes per document, 722 internal references, and every route budget.
- Production dependency audit reported zero vulnerabilities; changed-file Prettier and `git diff --check` passed.

### Progress checkpoint: 10:43 +08:00

- Continuous-session elapsed time: 7 hours 37 minutes. The user explicitly requested stopping after this final round,
  superseding the earlier minimum-duration request.
- Completed improvement batches: 30; service-worker storage growth is lower and cache failures can no longer turn a
  successful online response into a failed request.
- Current work: all final gates passed; commit Improvement 30 and stop as explicitly requested.
- Remaining reviewed item: explicit theme/language persistence write-failure feedback. It stays queued and unmodified
  for a future session rather than being started after the requested final round.

### Improvement 31: Honest theme and language persistence feedback

Status: completed after the continuous improvement goal resumed.

Changes:

- Changed the shared theme and language setters to return the actual browser-storage write result while preserving
  immediate in-session state changes when storage is unavailable.
- Added localized storage-failure notifications to every theme/language entry point: the Settings page, the header
  theme menu, and the header language switcher. Users are told that the active choice may be lost after refresh rather
  than receiving a false impression that it was persisted.
- Added provider-level regression coverage proving failed writes return `false` without blocking the visible theme or
  language change, plus Settings coverage for both failure notifications.
- Extended the real-browser preference workflow to block only theme/language/currency writes, exercise both Settings
  and header controls, verify English and Chinese error messages, retain immediate UI changes, and confirm no blocked
  key was written.
- Updated bilingual feature documentation and the engineering review. Refilled the active queue with follow-up
  preference, translation, and local-browser reliability work before completing this item.

Files and areas:

- `src/components/theme-provider.tsx`, `src/lib/i18n.tsx`, and focused provider tests
- `src/app/settings/page.tsx`, `src/components/mode-toggle.tsx`, and `src/components/language-switcher.tsx`
- `e2e/preferences-storage.spec.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Strict TypeScript passed; three focused Vitest files passed 9/9 tests before the full gate.
- The preference Playwright file passed 2/2 browser workflows in installed system Chrome. Both the pre-existing corrupt
  preference flow and the new blocked-write flow completed without console or page errors. The tool wrapper did not
  exit after reporting both passes and reached its outer timeout; a process audit confirmed no Playwright workers were
  left behind.
- `npm run verify`: passed with 54 Vitest files and 431 tests, 15 routes, 197 precache assets, 96 script hashes, 35
  static style hashes, 2 runtime style hashes per document, 722 internal references, and every route bundle budget.
- Changed source and documentation passed Prettier; `git diff --check` passed before the full gate.

### Progress checkpoint: 11:55 +08:00

- Resumed-goal elapsed time: 44 minutes; cumulative logged active work: approximately 8 hours 21 minutes.
- Completed improvement batches: 31; theme/language selection now communicates persistence failures without disabling
  the usable in-session preference.
- Current work: Improvement 31 is fully verified and ready to commit; remaining silent preference setters are next.
- Queue status: 4 active items remain covering sidebar persistence, Portfolio translation warnings, deterministic local
  Playwright browser selection, and invalid-preference cleanup failures.

### Improvement 32: Retryable sidebar preference fallback

Status: completed.

Changes:

- Audited the remaining desktop sidebar preference setter. A blocked localStorage write previously left the collapse
  button visually unresponsive and provided no explanation, unlike the newly hardened theme/language controls.
- Added an explicit session-only sidebar override. A denied write now applies the requested collapsed or expanded
  layout immediately, updates content spacing and accessible button state, and shows the existing localized storage
  failure message.
- Kept persisted state authoritative whenever it is available. A later successful retry dispatches the existing
  same-tab preference event and clears the override; cross-tab storage events do the same, preventing stale transient
  state from masking a valid persisted update.
- Added a component contract for failed collapse, session behavior, user-visible feedback, and a successful expand
  retry. Extended the browser storage-denial matrix to include the sidebar key and production DOM state.
- Updated bilingual reliability documentation and engineering review evidence.

Files and areas:

- `src/components/layout/app-layout.tsx` and its focused test
- `e2e/preferences-storage.spec.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Strict TypeScript passed; the focused AppLayout suite passed 4/4 tests.
- The preference Playwright file passed 2/2 workflows in 11.9 seconds using installed system Chrome and one worker.
  The new path changed the real desktop sidebar while all four blocked preference keys remained absent, with no
  console or page errors.
- `npm run verify`: passed with 54 Vitest files and 432 tests, 15 routes, 197 precache assets, 96 script hashes, 35
  static style hashes, 2 runtime style hashes per document, 722 internal references, and every route bundle budget.
- Changed source and documentation passed Prettier; `git diff --check` passed.

### Progress checkpoint: 12:12 +08:00

- Resumed-goal elapsed time: 1 hour; cumulative logged active work: approximately 8 hours 37 minutes.
- Completed improvement batches: 32; all user-facing theme, language, currency, and desktop sidebar preference writes
  now either persist or provide honest, retryable failure behavior.
- Current work: Improvement 32 is fully verified and ready to commit; three parallel audits are ranking the next item.
- Queue status: 6 active items cover pending-history replay, base-path deployment headers, manifest assets, Portfolio
  translation warnings, deterministic local Playwright browser selection, and invalid-preference cleanup failures.

### Improvement 33: Once-only pending history restore consumption

Status: completed.

Changes:

- Reproduced a pending cross-page restore that could rerun whenever calculator pages supplied a new `onRestore`
  callback. When sessionStorage cleanup was blocked, restored state caused another render, the effect saw a new callback,
  and the same payload could be applied repeatedly.
- Added raw sessionStorage reads so malformed JSON can be distinguished from a missing key and cleaned rather than
  persisting indefinitely behind a JSON fallback.
- Made consumption resilient in three tiers: normal `removeItem`, a semantic JSON `null` overwrite when removal alone
  is blocked, and a module-session payload signature when every cleanup write fails. The signature survives Next.js
  component remounts but intentionally resets on a full browser refresh.
- Added a dedicated bilingual warning for the final failure tier. It states that the calculation is active but a full
  refresh may restore it again, instead of silently hiding the remaining temporary payload.
- Expanded unit coverage for malformed JSON, removal-only failure, total cleanup failure, callback replacement, and
  component remount. Added a real TVM browser workflow that blocks both cleanup paths, verifies one restore and one
  warning, then proves a later URL-backed edit remains stable.
- The first browser probe also isolated a separate shared `useUrlState` race: two immediate field edits can lose the
  first value because both updates read the same stale URL snapshot. That defect is queued as the next improvement
  rather than being folded into this restore-consumption commit.

Files and areas:

- `src/components/history-panel.tsx` and focused tests
- `src/lib/storage.ts`, `src/lib/storage.test.ts`, and the bilingual history catalog
- `e2e/history-pending-restore.spec.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Strict TypeScript passed; focused storage, history, and translation suites passed 24/24 tests.
- The pending-restore Playwright workflow passed in 1.8 seconds using installed system Chrome. The restored TVM values,
  single localized warning, later rate edit, URL state, and absence of console/page errors were all asserted.
- `npm run verify`: passed with 54 Vitest files and 435 tests, 15 routes, 197 precache assets, 96 script hashes, 35
  static style hashes, 2 runtime style hashes per document, 722 internal references, and every route bundle budget.
- Changed source, browser tests, and documentation passed Prettier; `git diff --check` passed before the full gate.

### Improvement 34: Lossless consecutive URL-state updates

Status: completed.

Changes:

- Turned the failure discovered during the pending-restore browser probe into a minimal shared reproduction: editing
  TVM rate and periods in quick succession produced two router replacements from the same stale search-parameter
  snapshot, so the second replacement silently restored the old rate.
- Added a latest-requested state ref inside `useUrlState`. Full-state restores update it immediately, and subsequent
  field writes merge into that pending state rather than waiting for the asynchronous Next.js router commit.
- Kept browser navigation authoritative. Once a new URL-derived state is observed, it replaces the optimistic snapshot;
  reset also restores the ref to calculator defaults before removing owned query parameters.
- Added hook contracts for full-state restore followed by multiple immediate edits and for an external URL change
  superseding optimistic state. Added a real TVM workflow that edits two fields consecutively and verifies both the
  controlled inputs and query parameters retain the new values.
- Re-ran the pending-history browser workflow alongside the concurrency test to ensure the shared hook fix did not
  weaken once-only restore behavior.
- Updated bilingual reliability documentation and engineering review evidence.

Files and areas:

- `src/hooks/use-url-state.ts` and its focused test
- `e2e/url-state-concurrency.spec.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Strict TypeScript passed; the focused hook suite passed 8/8 tests.
- The URL concurrency and pending-history Playwright workflows passed 2/2 in 5.5 seconds using installed system Chrome.
  TVM retained `rate=8` and `nper=24` in both inputs and URL state, with no console or page errors.
- `npm run verify`: passed with 54 Vitest files and 437 tests, 15 routes, 197 precache assets, 96 script hashes, 35
  static style hashes, 2 runtime style hashes per document, 722 internal references, and every route bundle budget.
- Changed source, browser tests, and documentation passed Prettier; `git diff --check` passed before the full gate.

### Improvement 35: Stable extreme-moneyness option pricing and Greeks

Status: completed.

Changes:

- Reproduced finite positive option inputs whose spot/strike division underflowed to zero before `Math.log`, turning
  Black-Scholes prices and every Greek into `NaN`. The inverse ratio could overflow for the same reason.
- Replaced both price and Greek log-moneyness calculations with `log(S) - log(K)`. Logs of all accepted positive finite
  doubles remain finite even when their direct ratio is not representable.
- Evaluated Gamma entirely in the log domain, including continuous dividend discounting. This avoids both a zero direct
  denominator and premature normal-density underflow while retaining representable tail sensitivities.
- Independent subagent review rejected an initial `nd1 === 0 ? 0` shortcut with a concrete subnormal counterexample:
  Gamma can remain approximately `4.332662143e10` after the direct density/denominator have underflowed. The final
  implementation and tests use the complete log-domain formula instead.
- Added exact endpoint price/parity checks for both extreme directions, finite-value checks for all call/put Greeks,
  a subnormal Gamma reference value, call/put Gamma equality, and inverse scaling under a common spot/strike scale.
- Updated bilingual reliability documentation and engineering review evidence.

Files and areas:

- `src/lib/finance-math.ts` and `src/lib/finance-math.test.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- The focused finance engine suite passed 61/61 tests; strict TypeScript passed during the full gate.
- `npm run verify`: passed with 54 Vitest files and 439 tests, 15 routes, 197 precache assets, 96 script hashes, 35
  static style hashes, 2 runtime style hashes per document, 722 internal references, and every route bundle budget.
- Changed source and documentation passed Prettier; `git diff --check` passed.

### Progress checkpoint: 12:43 +08:00

- Resumed-goal elapsed time: 1 hour 31 minutes; cumulative logged active work: approximately 9 hours 8 minutes.
- Completed improvement batches: 35; recent work hardened preference failures, pending restores, URL state concurrency,
  and extreme-scale core option math in separate verified commits.
- Current work: Improvement 35 is fully verified and ready to commit; storage feedback semantics are next, followed by
  generated base-path deployment headers.
- Queue status: 10 active items remain across user feedback correctness, deployment headers/manifest validation,
  history state, RATE/NPV math semantics, local browser resolution, preference cleanup, translations, and formatting.

### Improvement 36: Truthful storage failure semantics

Status: completed.

Changes:

- Audited all 12 production uses of the former generic storage error. Five preference actions (theme/language in
  Settings and header controls plus sidebar layout) apply immediately in memory, while seven currency, history
  restore, clear, and import paths do not complete or may only partially complete.
- Replaced the ambiguous message with two bilingual contracts: `changeNotPersisted` says the active session preference
  may be lost on refresh; `storageOperationFailed` says the operation could not be completed and asks the user to
  inspect current state before retrying, which is honest for non-atomic history/favorites clearing.
- Mapped every call site to its actual state transition. Currency continues to retain the old selection on failure;
  Home and History continue to prevent navigation when a pending restore cannot be stored; failed imports emit no
  success notification.
- Expanded Settings tests for currency and confirmed-import failures, and History tests for the no-navigation failure
  path. Existing theme/language and sidebar contracts now assert the session-only message key.
- Extended the browser preference matrix to block all four preference keys, verify USD remains selected after failed
  CNY writes, and assert both message classes in English and Chinese alongside the applied theme/language/sidebar state.
- Updated bilingual reliability documentation and engineering review evidence.

Files and areas:

- `src/lib/i18n.tsx`
- Settings, Home, History, theme/language controls, and AppLayout storage failure call sites
- Focused Settings, History, and AppLayout tests plus `e2e/preferences-storage.spec.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Strict TypeScript passed; four focused translation/UI test files passed 17/17 tests.
- The preference Playwright file passed 2/2 workflows in 8.4 seconds using installed system Chrome. Both message classes,
  both languages, retained currency, active session preferences, absent blocked keys, and zero console/page errors were
  asserted.
- `npm run verify`: passed with 54 Vitest files and 440 tests, 15 routes, 197 precache assets, 96 script hashes, 35
  static style hashes, 2 runtime style hashes per document, 722 internal references, and every route bundle budget.
- Changed source, browser tests, and documentation passed Prettier; `git diff --check` passed.

### Improvement 37: Generated base-path deployment headers

Status: completed.

Changes:

- Confirmed a production artifact gap: `/calc` builds copied the root `public/_headers` unchanged, and the static
  checker also looked only for root selectors. CI therefore passed while hashed assets, worker metadata, and manifest
  requests under `/calc` missed their intended cache policies; the broad `/*` security block could also affect sibling
  applications on the same host.
- Added one shared base-path normalizer plus selector helper used by both generation and validation, eliminating drift
  between accepted build values and expected deployment paths.
- Added a deterministic post-build headers generator. `public/_headers` remains the canonical root template; each build
  reads that template and writes `out/_headers`, scoping every non-indented selector to `NEXT_PUBLIC_BASE_PATH`. Repeated
  runs cannot produce `/calc/calc/...` because generated output is never used as input.
- Made the static checker require the scoped global security block and all five cache-policy blocks. Base-path exports
  also reject known unscoped root selectors, so a mixture of `/calc/*` and overbroad `/*` cannot pass.
- Updated the end-to-end static fixture to generate topology-correct headers. Added contracts for byte-identical root
  output, six `/calc` selectors, preserved header values, repeat generation, and the original root template failing a
  `/calc` check.
- Replaced documentation that required deployment operators to prefix rules manually. Hosts supporting `_headers` now
  deploy final `out/_headers`; other hosts reproduce policies from that generated, scoped artifact.

Files and areas:

- `scripts/static-export-paths.mjs` and `scripts/generate-static-headers.mjs`
- `scripts/check-static-export.mjs`, its focused test, and the package build chain
- English/Chinese README, engineering review, and improvement log

Verification:

- Strict TypeScript passed; the focused static-export checker suite passed 8/8 tests.
- A root `npm run build` plus `npm run static:check` passed and emitted exactly `/*`, `/_next/static/*`, `/*.html`,
  `/sw.js`, `/precache-manifest.js`, and `/manifest.json`.
- `npm run test:static` rebuilt `/calc`, passed with 706 internal references, and emitted the corresponding six
  `/calc/...` selectors with no known root selector.
- `npm run verify`: passed with 54 Vitest files and 443 tests, 15 routes, 197 precache assets, 96 script hashes, 35
  static style hashes, 2 runtime style hashes per document, 722 internal references, and every route bundle budget.
- The production `/calc` PWA Playwright suite passed 2/2 in 1.8 minutes: CSP hashes, installation, uncached offline
  navigation, 404 fallback, user-controlled worker activation, and reload all remained intact.
- Changed scripts, tests, metadata, and documentation passed Prettier; `git diff --check` passed.

### Improvement 38: Valid History filters after category removal

Status: completed.

Changes:

- Reproduced a History view with TVM selected, one TVM record, and one Risk record. Removing the TVM record deleted its
  filter button but left internal `activeTab="tvm"`; the remaining Risk record was hidden behind `noResults`, and no
  visible filter had `aria-pressed="true"`.
- Added an effective active filter derived from current grouped history. All filtering, visual variants, and pressed
  states use it, so deletion, expiry, cross-tab synchronization, or clearing a category displays All and remaining
  records in the same render without an empty-state flash.
- Kept Favorites as an explicit stable filter even at zero items. Search misses and empty Favorites are valid user
  views and are never mistaken for a missing page-category button.
- Evaluated an effect-based state normalization, but the repository's React 19 lint correctly rejected synchronous
  state updates inside effects. The final derivation has no cascading render and preserves the user's original category
  intent if that category later reappears without another filter selection.
- Reset mutable test history before each case. Added a deletion/category-removal contract with a MutationObserver that
  proves `history.noResults` is never inserted, plus an empty-Favorites contract that remains selected and shows the
  intended empty state.
- Updated bilingual reliability documentation and engineering review evidence.

Files and areas:

- `src/app/history/page.tsx` and its focused test
- English/Chinese README, engineering review, and improvement log

Verification:

- Strict TypeScript and focused ESLint passed; the History page suite passed 5/5 tests.
- `npm run verify`: passed with 54 Vitest files and 445 tests, 15 routes, 197 precache assets, 96 script hashes, 35
  static style hashes, 2 runtime style hashes per document, 722 internal references, and every route bundle budget.
- Changed source and documentation passed Prettier; `git diff --check` passed.

### Progress checkpoint: 13:21 +08:00

- Resumed-goal elapsed time: 2 hours 9 minutes; cumulative logged active work: approximately 9 hours 46 minutes.
- Completed improvement batches: 38; recent batches now cover core numeric tails, truthful failures, deployment topology,
  and History filter state with independent subagent review.
- Current work: Improvement 38 is fully verified and ready to commit; NPV/IRR zero-tail invariance is next.
- Queue status: 7 active items remain across manifest validation, RATE/NPV semantics, preference cleanup, Portfolio
  translations, deterministic local browser resolution, and broader formatting enforcement.

### Improvement 39: Exact-zero cash-flow tail invariance

Status: completed.

Changes:

- Reproduced an NPV/IRR stability defect near the `rate = -100%` singularity: appending economically irrelevant exact
  zero cash flows could make an otherwise finite calculation return `NaN` after a far-period discount factor
  underflowed to zero.
- Short-circuited exact `+0` and `-0` cash flows before discount-factor division in NPV and both the value and Newton
  derivative paths used by IRR. The result now depends on economically meaningful cash flows rather than the length of
  a zero-padded schedule.
- Kept the existing strict behavior for every nonzero value. A real `+1` or `-1` cash flow whose discounted magnitude
  is not representable still returns `NaN`; `NaN`, infinities, and other invalid inputs remain rejected by entry
  validation.
- Added regressions for positive and negative zero tails, an all-zero 120-period schedule, a maximal positive rate,
  near-singular negative rates, genuine nonzero overflow, and IRR invariance across 118 appended zero periods.
- Updated bilingual reliability documentation and engineering review evidence with the new numeric contract.

Files and areas:

- `src/lib/finance-math.ts` and `src/lib/finance-math.test.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- The focused finance-math suite passed 63/63 tests; strict TypeScript passed.
- The first full run passed 446 tests but one translation-source scan exceeded its fixed five-second timeout by 39ms.
  Its focused rerun completed in 384ms, and a clean second `npm run verify` passed all 54 Vitest files and 447 tests,
  15 routes, 197 precache assets, 722 internal references, and every route bundle budget. The contention-sensitive scan
  is retained as a separate queue item rather than mixed into this numeric fix.
- Changed source and documentation passed Prettier; `git diff --check` passed.

Queue status: 7 active items remain. PWA manifest integrity is the next implementation while RATE root semantics,
preference cleanup failures, Portfolio development translations, local browser resolution, translation-scan stability,
and broader formatting coverage remain queued.

### Improvement 40: Deployable PWA manifest contract

Status: completed.

Changes:

- Closed a static-export blind spot: the gate previously required `manifest.json` to exist and checked only that
  `id`, `start_url`, and `scope` were relative strings. Broken icon paths, missing install sizes, invalid display modes,
  scope escapes, and shortcuts targeting arbitrary files could all pass CI.
- Added an asynchronous manifest validator for object shape, install naming, supported display modes, portable relative
  identity/start/scope URLs, and deployment-base containment. Start and shortcut URLs must remain inside scope and
  resolve to emitted HTML routes, so an existing icon or `manifest.json` cannot masquerade as an application route.
- Validated icon objects, MIME types, declared dimensions, purposes, and final exported files. Install metadata must
  include local `192x192` and `512x512` PNG icons usable for the default `any` purpose; optional shortcut icons follow
  the same local-file and base-path rules.
- Added deterministic shortcut validation for required names, optional metadata, unique resolved URLs, route existence,
  scope containment, and optional icon arrays.
- Upgraded the static-export fixture with install metadata, dummy icon targets, and a TVM shortcut. The test matrix now
  covers root and `/calc` exports plus malformed objects, missing install assets, unsupported size/purpose/display data,
  absolute and encoded traversal URLs, missing files, non-HTML start/shortcut targets, and scope escapes.
- Updated bilingual deployment guidance and engineering review evidence with the emitted-manifest contract.

Files and areas:

- `scripts/check-static-export.mjs` and `src/lib/static-export-check.test.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- Focused static-export tests passed 12/12; strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.
- The existing root artifact passed `npm run static:check` with 15 routes, 197 precache assets, 16 HTML files, and 722
  internal references.
- `npm run test:static` rebuilt `/calc` and passed with 15 routes, 197 precache assets, 16 HTML files, and 706
  base-path-contained internal references.
- `npm run verify` passed all 54 Vitest files and 451 tests, 15 routes, 197 precache assets, 722 internal references,
  and every route bundle budget on a fresh root build.

Queue status: 6 active items remain. TVM RATE root ambiguity is next; preference cleanup, Portfolio development
translations, deterministic local browser resolution, translation-scan stability, and broader formatting enforcement
remain queued.

### Improvement 41: Explicit TVM RATE root ambiguity

Status: completed.

Changes:

- Reproduced ordinary and due two-period cash-flow equations with two mathematically valid RATE roots. For example,
  `nper=2`, `pmt=-225`, `pv=100`, `fv=351`, and end-of-period payments reduce to
  `100(x-1.05)(x-1.20)` for `x=1+r`, so both 5% and 20% exactly reconstruct the requested future value.
- Preserved the existing `Finance.rate` API, default 10% guess, Newton path, and bracketed fallback. Different guesses
  are now regression-tested against two distinct roots, but the application does not silently redefine which root is
  preferable or claim that fallback always returns the closest root.
- Extracted a shared zero-aware sign-change counter and added `Finance.rateSignChanges`. For finite positive integer
  periods it computes the compressed RATE polynomial coefficients for ordinary and due payments, validates derived
  sums against overflow, and applies Descartes' rule to identify patterns that may contain multiple roots.
- Added a persistent, accessible warning beside successful ambiguous RATE results. It states that the displayed value
  is one mathematical solution from the 10% initial guess with a bracketed fallback when needed; changing inputs,
  target, timing, preset, reset state, or restored history clears it together with the stale result.
- Added bilingual warning copy and Help model-boundary guidance. The copy deliberately says “mathematically valid” so
  it does not imply that every root is economically useful.
- Added formula tests for ordinary/due double-positive roots, negative/positive roots, default-root compatibility,
  FV round trips, one-period and zero coefficients, invalid inputs, and derived overflow. UI tests cover warning
  display and clearing plus no false warning for ordinary single-root loans under both payment timings.

Files and areas:

- `src/lib/finance-math.ts` and `src/lib/finance-math.test.ts`
- `src/app/tvm/page.tsx`, shared calculator/Help tests, bilingual i18n, and model guide
- English/Chinese README, engineering review, and improvement log

Verification:

- The focused finance-math suite passed 69/69 tests; the combined TVM/Help/finance suites passed 89/89 after the final
  no-false-positive cases were added.
- Strict TypeScript and focused ESLint passed; changed source passed Prettier and `git diff --check`.
- `npm run verify` passed all 54 Vitest files and 460 tests, 15 routes, 197 precache assets, 722 internal references,
  and every route bundle budget.

Queue status: 6 active items remain across Portfolio development translations, deterministic local browser selection,
invalid-preference cleanup, translation-scan stability, broader formatting enforcement, and bond sensitivity oracles.

### Progress checkpoint: 13:59 +08:00

- Resumed-goal elapsed time: approximately 2 hours 47 minutes; cumulative logged active work: approximately 10 hours
  24 minutes. The minimum session duration has been crossed, but the goal remains active until the user explicitly stops.
- Completed improvement batches: 41; the latest work covers exact-zero discounted tails, deployable PWA manifest
  topology, and honest disclosure of non-unique RATE solutions, each with independent subagent review.
- Current work: Improvement 41 has passed focused formula, UI, Help, type, lint, and formatting checks; the full root
  verification is next, followed by the still-nonempty queue.
- Queue status: 6 active items remain; lower-risk work can continue even if any browser-specific item needs follow-up.

### Improvement 42: Contention-resistant translation source audit

Status: completed.

Changes:

- Investigated the transient full-suite failure recorded during Improvement 39. The literal translation-call audit
  exceeded Vitest's five-second default by 39ms even though its focused rerun finished in 384ms, confirming a worker
  contention problem rather than a catalog correctness failure.
- Found that the audit performed 171 sequential asynchronous reads across roughly 0.98MB of source while up to 16
  Vitest forks competed for I/O, CPU, and memory. It also asked TypeScript to build parent links that the traversal and
  line-number diagnostics never consume.
- Sorted the complete source-file list, read source text concurrently, then retained sequential full AST parsing with
  `setParentNodes=false`. The check still scans production and test TypeScript/JavaScript files with the TypeScript
  parser; it does not trade correctness for a comment/string-sensitive regular expression.
- Sorted missing-key diagnostics so a future failure has stable output independent of filesystem enumeration order.
  Parent-free ASTs continue to produce the same key locations through `getStart(sourceFile)` and line mapping.
- Kept the original five-second timeout as a pressure signal instead of hiding the bottleneck by increasing it or
  globally reducing Vitest concurrency.

Files and areas:

- `src/lib/i18n-catalog.test.ts`
- Engineering review and improvement log

Verification:

- Nine consecutive focused translation-source runs passed. The first full-file run reported 899ms for the literal
  scan; the final measured repetitions reported 533ms, 492ms, and 1085ms, all with the original five-second timeout.
- Three consecutive complete `npm test` runs passed all 54 files and 460 tests under normal worker concurrency in
  54.77s, 60.24s, and 38.08s.
- `npm run verify` passed all 54 Vitest files and 460 tests, 15 routes, 197 precache assets, 722 internal references,
  and every route bundle budget.
- Changed source and documentation passed Prettier and `git diff --check`.

Queue status: 6 active items remain across cross-tab PWA updates, Portfolio development translations, deterministic
local browser selection, invalid-preference cleanup, broader formatting enforcement, and bond sensitivity oracles.

### Improvement 43: Actionable cross-tab PWA update prompts

Status: completed.

Changes:

- Reproduced a multi-tab update failure: tabs A and B both showed a waiting-worker prompt; after A activated the new
  worker, B received `controllerchange` but retained an action closing over the now-active worker. Clicking B's stale
  action sent `SKIP_WAITING` to an active worker, produced no further controller change, and never refreshed the page.
- Captured the tab's current controller identity when registration starts. A `null` to controller transition remains a
  normal first install and does not prompt or reload; an old-controller to new-controller transition is recognized as
  an update activated outside this tab.
- Preserved the existing user-controlled flow in the initiating tab: its action posts `SKIP_WAITING`, records the local
  request, and reloads only after `controllerchange` confirms activation.
- When another tab replaces the controller, reused the existing toast ID to replace the obsolete waiting-worker action
  with a direct current-page reload. The action no longer sends a meaningless message to the active worker.
- Hardened the surrounding races: same-controller events are ignored; old-controller to null to new-controller
  transitions remain recognizable; reload executes at most once; a prompt click prefers the latest waiting worker;
  and an installed prompt candidate remains activatable while `registration.waiting` is briefly unset.
- Subscribed to any installing worker already present when registration resolves, deduplicated worker prompts, and
  released state listeners as soon as a worker becomes installed or redundant instead of retaining every historical
  worker until page teardown.
- Added an optional stable reload dependency to the client component so reload behavior can be asserted without
  mutating jsdom's non-configurable `window.location`. Production still defaults to `window.location.reload()`.
- Expanded component contracts across unsupported/development/registration paths with first claim, local confirmation,
  external activation, control loss/reclaim, duplicate events, pre-click activation, latest-worker selection, early
  installation, one-shot reload, terminal listener release, and full unmount cleanup.

Files and areas:

- `src/components/service-worker-registration.tsx`
- `src/components/service-worker-registration.test.tsx`
- English/Chinese README, engineering review, and improvement log

Verification:

- The focused service-worker registration suite passed 18/18 tests.
- Strict TypeScript and focused ESLint passed; both changed source files passed Prettier and `git diff --check`.
- `npm run verify` passed all 54 Vitest files and 470 tests, 15 routes, 197 precache assets, 722 internal references,
  and every route bundle budget.
- The production root PWA browser workflow reused the final verified artifact and passed 2/2 tests in 10.1 seconds. A fresh
  `/calc` build passed the same 2/2 CSP, install, offline navigation, 404, user-controlled activation, controller, and
  reload workflows in 54.1 seconds using system Chrome.

Queue status: 7 active items remain across Portfolio development translations, deterministic local browser selection,
invalid-preference cleanup, broader formatting enforcement, bond sensitivity oracles, app-shell UI refinement, and a
validated scenario-comparison feature design.

### Progress checkpoint: 14:30 +08:00

- Resumed-goal elapsed time: approximately 3 hours 18 minutes; cumulative logged active work: approximately 10 hours
  55 minutes. Work continues because the user has not requested a stop and the queue remains substantive.
- Completed improvement batches: 43; recent reliability work has passed both unit-level state-machine tests and real
  root/base-path PWA browser lifecycles.
- Current work: Improvement 43 is fully verified and ready to commit. Deterministic local browser selection is next,
  followed by preference recovery and the remaining numeric/tooling/UI/product queue.
- Queue status: 7 active items; the newly requested UI and feature work has concrete discovery entries rather than an
  unbounded visual rewrite.

### Improvement 44: Deterministic local Playwright browser resolution

Status: completed.

Changes:

- Confirmed the local failure mode: Playwright 1.61 expected its pinned full Chromium at
  `C:\Users\mache\AppData\Local\ms-playwright\chromium-1228\chrome-win64\chrome.exe`, which is absent, while stable
  system Chrome exists under `C:\Program Files`. Every browser command therefore required a manually supplied
  executable-path environment variable despite a usable local browser.
- Added one shared resolver for standard and PWA Playwright configs. A non-empty
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` has highest priority and is resolved against the working directory when
  relative; blank, missing, directory, or non-executable explicit targets fail immediately with the normalized path.
- CI always retains Playwright's default pinned headless launch and never substitutes auto-updating system software, so
  a broken `playwright install` remains visible. Locally, `chromium.executablePath()` is probed and that exact pinned
  full-Chromium path is launched explicitly; this avoids assuming its existence also proves that Playwright's distinct
  default `chromium-headless-shell` executable is installed.
- Added deterministic local-only Chrome-then-Edge candidates for Windows, macOS, and Linux, including stable system,
  per-user, and appropriate PATH locations. Candidate paths are deduplicated case-insensitively on Windows; POSIX
  probes require executable permission.
- Kept config imports non-throwing when neither bundled nor system candidates exist. Playwright then provides its
  standard install guidance at launch; unknown platforms retain explicit and bundled support without guessed paths.
- Exposed root and PWA config factories that consume the same resolver, so `/calc` inherits identical selection.
  The base-path config remains a thin call to the PWA factory.
- Added cross-platform pure tests for explicit absolute/relative paths, Windows environment casing and candidate
  order, macOS/Linux topology, bundled and CI priority, Chrome/Edge fallback, missing candidates, and both config
  integrations.

Files and areas:

- `scripts/resolve-playwright-browser.ts`
- `playwright.config.ts` and `playwright.pwa.config.ts`
- `src/lib/playwright-browser-resolver.test.ts`
- English/Chinese README, engineering review, and improvement log

Verification:

- The resolver plus existing PWA-config suites passed 15/15 tests; strict TypeScript, focused ESLint, Prettier, and
  `git diff --check` passed.
- With no executable-path environment variable, all 38 standard tests and both two-test PWA configurations listed
  successfully. A real development-server Portfolio browser workflow launched system Chrome and passed 1/1 in 20.6s.
- `npm run verify` passed all 55 Vitest files and 483 tests, 15 routes, 197 precache assets, 722 internal references,
  and every route bundle budget.
- After explicitly removing the executable-path environment variable, the root production PWA workflow launched via
  the resolver and passed 2/2 CSP, install, offline navigation, 404, activation, controller, and reload tests in 11.2s.

Queue status: 6 active items remain across Portfolio development translations, invalid-preference cleanup, broader
formatting enforcement, bond sensitivity oracles, app-shell UI refinement, and validated scenario-comparison design.

### Progress checkpoint: 15:12 +08:00

- Resumed-goal elapsed time: approximately 4 hours; cumulative logged active work: approximately 11 hours 37 minutes.
  The minimum duration remains a floor, not a completion signal.
- Completed improvement batches: 44. The latest batches combine numeric semantics, deployment topology, PWA
  multi-tab correctness, test stability, and deterministic browser tooling with root/base-path verification.
- Current work: Improvement 44 is fully verified and ready to commit. Invalid-preference cleanup is next while
  Portfolio diagnostics, formatting, bond oracles, and the requested UI/feature work stay queued.
- Product/UI discovery: a same-page, same-metric History comparison is feasible as an MVP, but current records contain
  only one primary result and no stable metric ID, original currency, or model version. The queued design will avoid
  claiming full scenario equivalence and will reject ambiguous legacy records.
- Queue status: 6 active items remain; implementation work is concrete and the work queue is intentionally non-empty.

### Improvement 45: Recover invalid preferences when storage cleanup is partially blocked

Status: completed.

Changes:

- Reproduced a partial-storage failure where an invalid theme, language, currency, or sidebar value could be read safely
  for the current session but remain permanently persisted when `removeItem` was denied. Every refresh repeated the
  invalid-state recovery, and the stale value could continue propagating between tabs.
- Added a shared remove-or-replace operation. Invalid values are removed when possible; if removal alone is blocked,
  they are overwritten with the feature's safe default (`system`, `en`, `USD`, or expanded sidebar state). If both
  operations fail, the UI still uses the safe in-memory fallback.
- Restricted the persisted sidebar contract to JSON booleans. Malformed JSON and valid JSON of the wrong type now
  resolve to expanded state and are repaired outside the `useSyncExternalStore` snapshot read, preserving React's
  pure snapshot requirement.
- Changed theme, language, currency, and sidebar storage listeners to re-read current storage before updating state.
  A delayed event carrying an obsolete invalid `newValue` can no longer erase a newer valid choice.
- Expanded unit coverage for malformed and wrong-type sidebar values, removal-only failures, total cleanup failures,
  later valid updates, and stale storage events. Expanded the browser workflow to assert both visible defaults and the
  actual repaired values under normal cleanup, removal-only denial, and blocked preference writes.
- Diagnosed the initial browser failures as a reused stale Next.js development server. A fresh Playwright-managed
  server passed the complete preference workflow without executable-path overrides.

Files and areas:

- `src/lib/storage.ts` and `src/lib/storage.test.ts`
- theme and language/currency providers plus their focused tests
- sidebar preference parsing, repair, and component tests
- `e2e/preferences-storage.spec.ts`

Verification:

- The focused preference suites passed 32/32 tests; the real browser preference workflow passed 3/3 tests.
- `npm run verify` passed all 55 Vitest files and 498 tests, 15 routes, 197 precache assets, 722 internal references,
  and every route bundle budget.
- Strict TypeScript, ESLint, Prettier, and `git diff --check` passed.

Queue status: 6 active items remain across cross-tab storage clearing, Portfolio development translations, broader
formatting enforcement, bond sensitivity oracles, app-shell UI refinement, and compatible History comparison.

### Progress checkpoint: 15:40 +08:00

- Resumed-goal elapsed time: approximately 4 hours 28 minutes; cumulative logged active work: approximately 12 hours
  5 minutes. Work continues because the user has not requested a stop and the queue remains substantive.
- Completed improvement batches: 45. Preference recovery now covers valid storage, corrupt values, stale cross-tab
  events, partial cleanup denial, and total write denial at both component and browser levels.
- Current work: commit Improvement 45, then prevent real cross-tab `localStorage.clear()` events from leaving stale
  preferences or reviving queued history/favorite writes.
- Queue status: 6 active items remain, including the requested UI and useful-feature work.

### Improvement 46: Safe cross-tab full-storage clearing

Status: completed.

Changes:

- Reproduced the browser's distinct full-clear contract: `localStorage.clear()` notifies other documents with one
  `storage` event whose key is `null`. Existing listeners only accepted their concrete key, so live tabs retained stale
  theme, language, currency, sidebar, history, and favorite state.
- Added one shared event predicate that recognizes a target-key update or a full local-storage clear, accepts synthetic
  events without a `storageArea` for component tests, and explicitly rejects `sessionStorage` and unrelated storage
  areas. Theme, language, currency formatting/settings, and sidebar subscriptions now re-read their safe defaults on
  a real cross-tab clear.
- Added a hard external-clear path to History and favorites. It invalidates the current write revision, discards queued
  mutations, cancels retry timers, clears persistence errors and in-memory state, and removes any targeted value that a
  racing local write may have recreated.
- Guarded async initialization, refreshes, lock waiters, successful writes, and failure continuations with the external
  clear revision. An operation that was already waiting for a storage lock cannot repopulate data after the clear, and
  focus, online, timer, or manual retry signals have no stale work left to replay.
- Added a real three-page browser workflow. One page displayed a favorited History record, one displayed non-default
  preferences, and a third called `localStorage.clear()`; native browser events immediately emptied History and reset
  the open Settings UI without console or page errors.

Files and areas:

- `src/lib/storage.ts` and its tests
- Theme, language/currency, Settings, and AppLayout storage subscriptions plus focused tests
- `src/hooks/use-calculation-history.ts`, `src/hooks/use-history-favorites.ts`, and their state-machine tests
- `e2e/storage-clear-sync.spec.ts`

Verification:

- Seven focused storage/provider/history files passed 69/69 tests, including failed writes followed by clear and writes
  still waiting for the storage lock.
- The real multi-page Playwright workflow passed 1/1 from a fresh development server in 51.3 seconds.
- Strict TypeScript, full ESLint, targeted Prettier, and `git diff --check` passed.

Queue status: 5 active items remain across Portfolio diagnostics, broader formatting enforcement, bond sensitivity
oracles, app-shell UI refinement, and compatible History comparison.

### Progress checkpoint: 16:05 +08:00

- Resumed-goal elapsed time: approximately 4 hours 53 minutes; cumulative logged active work: approximately 12 hours
  30 minutes. The goal remains active and the implementation queue remains non-empty.
- Completed improvement batches: 46. Cross-tab storage clearing now has provider, queued-write, lock-race, retry, and
  real-browser coverage.
- Current work: commit Improvement 46, then integrate the completed bond oracles, Portfolio worker error contract, and
  full-tree formatting gate as separate improvements.
- Queue status: 5 active items remain, with app-shell semantics already assigned for implementation.

### Improvement 47: Independent bond price and sensitivity oracles

Status: completed.

Changes:

- Audited the fixed-coupon price, Macaulay duration, modified duration, and convexity implementations. Their nominal
  annual yield and coupon-frequency scaling are correct, but existing sensitivity tests only required finite results
  and could not detect a missing final coupon, wrong exponent, or an omitted frequency factor.
- Added a test-only closed-form annuity price oracle that is structurally independent from the production period loop.
  It uses `log1p` and `expm1` to remain stable near zero yield and has an exact zero-yield branch.
- Compared production prices across six regimes: par annual, premium semiannual, discount quarterly, negative-yield
  monthly, zero-coupon, and zero-yield bonds. The matrix includes 29 quarterly periods and checks relative error below
  `1e-12`.
- Sampled the independent price oracle at yield offsets of minus/plus 10 and 20 basis points. Five-point first and
  second derivatives verify modified duration, recover Macaulay duration through the periodic-yield identity, and
  verify convexity across five non-zero-yield regimes.
- Kept a separate queue item for the discovered UI contract gap: the core engine requires whole coupon periods and at
  most 600 periods, while the current input schema can accept unsupported combinations before results become
  unavailable. That product validation change is intentionally isolated from the formula-oracle batch.

Files and areas:

- `src/lib/finance-math.test.ts`

Verification:

- The focused finance-math suite passed 71/71 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: 5 active items remain across Portfolio diagnostics, formatting enforcement, bond input validation,
app-shell UI refinement, and compatible History comparison.

### Improvement 48: Preserve Portfolio domain errors through worker fallback

Status: completed.

Changes:

- Re-audited equal-correlation matrices for portfolios from two through twenty assets. The existing lower bound
  `-1 / (N - 1)`, page-level clamp, and calculation-engine guard correctly enforce positive semidefiniteness; the
  covariance oracle already covers negative, zero, positive, boundary, and high-asset-count regimes.
- Traced the direct-worker failure path for a three-asset payload with correlation `-0.8`. The worker reports the
  domain error, the hook terminates it, and the in-process fallback rejects the same invalid payload. No partial result
  is valid in this path, so the original correlation diagnosis must survive rather than becoming a generic fallback
  failure or leaving the simulation active.
- Added a hook contract test that drives that exact worker error. It asserts one termination, `isRunning=false`, a null
  result, the preserved correlation message in hook state, and one `onError` callback with the same message.
- Investigated the queued development-only seed translation warning. Both `portfolio.seed` keys exist in the typed
  schema and English/Chinese catalogs, the page call is a literal, and the focused catalog audit passes; no current
  warning path remains to change. Replaced that stale queue observation with the confirmed user-facing gap that the
  four editable default asset names remain English after Chinese hydration or reset.

Files and areas:

- `src/hooks/use-monte-carlo-simulation.test.tsx`
- Portfolio translation and correlation contract audit

Verification:

- The focused Monte Carlo worker hook suite passed 4/4 tests.
- The focused translation literal audit passed and confirmed both seed keys are cataloged.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: 5 active items remain across default Portfolio asset localization, formatting enforcement, bond input
validation, app-shell UI refinement, and compatible History comparison.

### Improvement 49: Full-tree formatting and staged-file enforcement

Status: completed.

Changes:

- Expanded `format` and `format:check` from the `src/` subtree to the complete application repository. Prettier now
  checks E2E tests, scripts, workflows, root configuration, public assets, and documentation while continuing to honor
  generated/dependency exclusions already defined by Git.
- Added a narrowly scoped Prettier ignore for `AGENTS.md` files. These operational instruction files are intentionally
  preserved verbatim; source, configuration, workflow, and product documentation remain covered.
- Expanded lint-staged so JavaScript, module scripts, TypeScript, and TSX at any depth receive ESLint fixes followed by
  Prettier. CSS, JSON/JSON5, YAML, Markdown, and MDX at any depth now receive Prettier rather than only `src/**/*.css`.
- Formatted the four drift candidates found by the full-tree audit. The workspace visual generator and TypeScript
  config had textual formatting changes; `.prettierrc` and the Vitest config only had working-tree line-ending drift,
  and their normalized blobs already matched the index.
- Exercised the new staged patterns on the preceding commits: E2E TypeScript and the improvement log were linted or
  formatted by the pre-commit hook, confirming the patterns apply beyond `src/` in the real commit path.

Files and areas:

- `package.json`
- `.prettierignore`
- `scripts/generate-workspace-visuals.mjs`
- `tsconfig.json`

Verification:

- `npm run format:check` passed across the full repository.
- Full ESLint, strict TypeScript, and `git diff --check` passed.
- The expanded lint-staged tasks completed successfully for staged source, E2E, and Markdown files.

Queue status: 4 active items remain across default Portfolio asset localization, bond input validation, app-shell UI
refinement, and compatible History comparison.

### Improvement 50: Correct Header navigation and breadcrumb semantics

Status: completed.

Changes:

- Audited the application Header across all routes. The visible Home-to-page breadcrumb was a plain `div`, while the
  theme and language utility controls were wrapped in an unnamed `nav`; assistive technology therefore received an
  unexplained navigation landmark but could not recognize the actual page hierarchy.
- Promoted the desktop breadcrumb to the Header's single navigation landmark and gave it a route-specific accessible
  name assembled from already localized Home and page titles. This avoids adding another generic landmark named like
  the primary calculator navigation.
- Marked the current breadcrumb item with `aria-current="page"` and hid the decorative chevron from accessibility
  APIs. Non-root routes retain a Home link; the root route now exposes Home as the current item without a redundant
  self-link or separator.
- Replaced the utility `nav` around theme and language controls with a regular `div`. The controls retain their own
  names and behavior without implying that they are a collection of navigation links.
- Added component contracts for a calculator route and the root route, including the unique landmark count/name,
  Home link, current-page semantics, decorative icon handling, and utility-control containment.

Files and areas:

- `src/components/layout/header.tsx`
- `src/components/layout/header.test.tsx`

Verification:

- The focused Header suite passed 2/2 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: 4 active items remain across default Portfolio asset localization, bond input validation, remaining
app-shell localization/information hierarchy, and the compatible History comparison feature.

### Improvement 51: Strict History comparison eligibility and delta contracts

Status: completed.

Changes:

- Designed the first History comparison as a comparison of two recorded outputs, not a claim that old scenarios can be
  reproduced with the current model. The v1 record schema has no original currency, model version, simulation count,
  or stable metric ID, so broad comparison would produce convincing but unsupported results.
- Defined nine compatibility contracts that can be identified unambiguously from current fields: TVM rate and period
  targets, CAPM, WACC, call/put implied volatility, inflation, real rate, and purchasing-power parity. Labels and
  timestamps never participate, so English/Chinese records remain compatible.
- Required exact current input-key sets, explicit expected result formats, absent custom result units, finite results,
  valid discriminators/enums, and canonicalizable numeric inputs. Extra or missing keys, malformed values, inferred
  legacy formats, and unknown variants are rejected rather than guessed.
- Classified currency results separately because the original currency is not stored, and Portfolio results separately
  because their simulation/model metadata is incomplete. Both remain intentionally unavailable to the MVP.
- Added ordered pair construction and signed comparison-minus-baseline deltas in absolute display units. Decimal and
  whole percentages become percentage-point changes; ratio, number, periods, and years retain their own units. No
  relative-percent claim is synthesized.
- Canonicalized grouped/numeric strings and enum representations for input tables, while omitting stable discriminators
  and the field solved by TVM. Numeric-equivalent inputs compare consistently without mutating stored records.

Files and areas:

- `src/lib/history-comparison.ts`
- `src/lib/history-comparison.test.ts`

Verification:

- The focused eligibility, compatibility, canonicalization, and delta suite passed 41/41 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: 4 active items remain across default Portfolio asset localization, bond validation messaging, remaining
app-shell refinement, and the now-specified two-record History comparison UI.

### Improvement 52: Actionable bond coupon-period validation

Status: completed.

Changes:

- Reproduced the user-facing gap: the shared bond schema already rejects terms that do not form whole coupon periods
  and combinations above the 600-period engine limit, but the page mapped every maturity issue to one broad range
  message. Users could not tell whether to change the term or the payment frequency.
- Added stable custom-issue reason metadata for the whole-period and period-limit refinements. The UI branches on Zod's
  custom issue code plus this machine-readable reason, never on the current English diagnostic string, and retains the
  generic maturity fallback for ordinary positive/range failures and future unknown reasons.
- Added focused English and Chinese messages. Fractional combinations explain the whole-coupon-period requirement;
  over-limit combinations name the 600-period calculation boundary.
- Expanded schema tests to assert both reason contracts, the exact 50-year monthly boundary at 600 periods, and a
  100-year quarterly combination that remains below the limit.
- Extended the calculator accessibility contract to confirm both reasons are attached to the maturity input through
  `aria-invalid` and its existing help/error description IDs, including a restored over-limit History payload.
- Added a browser workflow that enters a fractional semiannual term, switches to an over-limit monthly term, then
  corrects the value to the exact boundary and confirms the validation error clears and Fair Price returns.

Files and areas:

- `src/lib/validation.ts` and `src/lib/validation.test.ts`
- `src/app/bonds/page.tsx` and calculator accessibility coverage
- English/Chinese bond validation catalog entries
- `e2e/bonds-validation.spec.ts`

Verification:

- The focused validation, calculator accessibility, and catalog suites passed 38/38 tests.
- The real bond validation browser workflow passed 1/1 in 5.2 seconds without console or page errors.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: 3 active items remain across default Portfolio asset localization, remaining app-shell
localization/information hierarchy, and the strict two-record History comparison UI.

### Progress checkpoint: 16:35 +08:00

- Resumed-goal elapsed time: approximately 5 hours 23 minutes; cumulative logged active work: approximately 13 hours.
  Work continues because the user has not requested a stop and the feature/UI queue remains substantive.
- Completed improvement batches: 52. Recent work combines cross-tab data safety, independently verified financial
  sensitivities, wider quality gates, corrected shell semantics, and actionable boundary diagnostics.
- Current work: commit Improvement 52, then implement stable localized Portfolio defaults and the already validated
  compatible History comparison UI.
- Queue status: 3 active items remain, with additional UI and compatibility follow-ups identified during current audits.

### Improvement 53: Bounded legacy cash-flow History parsing

Status: completed.

Changes:

- Reproduced a synchronous restore freeze in legacy comma-separated cash-flow records. The parser tried every token end
  from every start, repeatedly allocated `slice().join()` strings, and recursively selected the fewest valid numeric
  tokens. A 1,000-token record took about 1.3 seconds in a direct module run; 5,000 tokens exceeded 30 seconds.
- Replaced exhaustive recursive partitioning with an iterative parser specialized to the accepted number grammar. It
  consumes the longest finite grouped-thousands token, advances without recursion, and enforces an explicit step budget
  proportional to stored input size and the fixed 120-flow application limit.
- Preserved the legacy minimum-token behavior for grouped amounts, signs, decimals, exponents, and boundary whitespace.
  Added a deterministic 500-case exhaustive reference oracle over short ambiguous records so the optimized grammar is
  checked against the former semantic contract rather than a handful of examples.
- Aligned current JSON and legacy records at the parser boundary: both validate the complete stored record and then
  return at most `MAX_CASH_FLOWS`. A malformed value after the first 120 entries still rejects the whole record instead
  of silently accepting a valid prefix.
- Added exact 120-entry and 121-entry tests, multi-group thousands coverage, malformed-tail coverage, and a roughly
  20KB adversarial legacy string that would exercise the previous recursive blow-up.

Files and areas:

- `src/lib/cash-flow-history.ts`
- `src/lib/cash-flow-history.test.ts`

Verification:

- The focused cash-flow History suite passed 7/7 tests; its final test body, including the deterministic oracle and
  long malformed input, completed in approximately 120ms in the isolated agent run.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: 3 active items remain across default Portfolio asset localization, remaining app-shell refinement, and
the strict two-record History comparison UI; dead dependency cleanup is also in verification.

### Improvement 54: Stable localized Portfolio default assets

Status: completed.

Changes:

- Replaced the four English-only default asset labels with allowlisted semantic `nameKey` identities plus stable English
  fallback names. Defaults now render as US Tech/Bonds/Gold/Emerging Markets in English and localized asset classes in
  Chinese without making translated display text part of persistent identity.
- Split raw and resolved asset roles. URL state and History store the language-neutral fallback plus `nameKey`; form
  values, accessible labels, worker payloads, report display inputs, exports, and allocation labels resolve the name in
  the current language.
- Made the simulation input signature locale-neutral through `nameKey ?? customName`. Switching language updates visible
  asset and allocation labels but does not hide a valid completed simulation as though the economic inputs changed.
  Editing a custom name still invalidates the old result as expected.
- A user name edit explicitly removes `nameKey`, even if the text happens to equal a default translation. Later language
  changes therefore preserve user intent. Reset recreates keyed defaults and immediately resolves them in the current
  language.
- Hardened restored asset normalization: known keys survive; unknown keys safely degrade to the sanitized literal
  fallback; old records with an English-looking custom name are never guessed into a default identity; empty or invalid
  records remain rejected.
- Kept user-facing JSON exports self-explanatory by emitting resolved names, while raw report inputs and History retain
  the keyed structure needed for future restoration. Added a share URL length assertion below the existing 4KB limit.
- Added a real hydrated browser workflow covering English defaults, live Chinese localization, a custom Chinese edit,
  switching back to English without overwrite, and Reset restoring keyed English defaults.

Files and areas:

- `src/lib/portfolio-state.ts` and `src/lib/portfolio-state.test.ts`
- `src/app/portfolio/page.tsx` and its new focused component test
- English/Chinese Portfolio default-asset catalog entries
- `e2e/portfolio-asset-localization.spec.ts`

Verification:

- Focused Portfolio state/page tests and existing calculator/catalog regressions passed 31/31 tests.
- The real Portfolio localization browser workflow passed 1/1 in 45.4 seconds without console or page errors.
- Strict TypeScript, targeted ESLint, Prettier, independent subagent review, and `git diff --check` passed.

Queue status: 2 active product/UI items remain across app-shell localization/information hierarchy and the strict
two-record History comparison UI; dead dependency cleanup and legacy History formatting are active engineering items.

### Progress checkpoint: 17:08 +08:00

- Resumed-goal elapsed time: approximately 5 hours 56 minutes; cumulative logged active work: approximately 13 hours
  33 minutes. The goal remains active until the user explicitly stops it.
- Completed improvement batches: 54. The latest user-visible change localizes Portfolio defaults without making
  language a hidden simulation input or weakening old URL/History compatibility.
- Current work: commit Improvement 54, integrate the validated History comparison dialog/page workflow, and finish the
  independent dead-dependency and legacy display-format batches.
- Queue status: product, UI, compatibility, and maintenance work all remain assigned; the queue is intentionally non-empty.

### Improvement 55: Locale-independent legacy History result formatting

Status: completed.

Changes:

- Reproduced incorrect display for valid legacy records that predate explicit `resultFormat`. Formatting fell back to
  English label fragments: `TVM -> NPER` did not contain "period" and rendered as currency; Chinese inflation/real-rate
  labels rendered as currency; and English PPP labels containing "Rate" rendered as a percentage.
- Added input-first inference from stable raw discriminators before the existing label heuristic. TVM `target` now
  distinguishes decimal rate, periods, and currency outputs; Macro `calculator` distinguishes percent, ratio, and
  currency families; and implied-option `call`/`put` records resolve to decimal percentages.
- Kept explicit stored metadata at highest priority. A current `resultFormat` always wins even when raw inputs imply a
  different family, while unknown future discriminators continue to the backward-compatible label/default path.
- Added English/Chinese, missing-label, deliberately misleading-label, explicit-override, and unknown-discriminator
  coverage so locale changes cannot alter the inferred unit of the same old record.

Files and areas:

- `src/lib/history-format.ts`
- `src/lib/history-format.test.ts`

Verification:

- The focused History formatting suite passed 8/8 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: 2 active product/UI items remain across the strict two-record History comparison UI and app-shell
localization/semantics; dead dependency cleanup and Monte Carlo error precedence are active maintenance batches.

### Improvement 56: Accessible two-record History comparison workflow

Status: completed.

Changes:

- Added a dedicated comparison mode alongside batch deletion. The modes are mutually exclusive, search or category
  changes clear the active comparison, and History removals invalidate selected object snapshots instead of silently
  comparing stale records.
- Limited selection to the strict comparison contracts established in Improvement 51. The first eligible record locks
  the metric family; currency, Portfolio/model, legacy/unsupported, already-full, and cross-metric alternatives remain
  visible with specific disabled explanations exposed through `aria-describedby` as well as tooltips.
- Added an explicit two-record dialog that identifies the metric, baseline and comparison timestamps/results, reports
  `comparison - baseline` in absolute units, highlights changed canonical inputs, and states that saved outputs are
  displayed without current-model recalculation. Percentage deltas are correctly labelled as percentage points.
- Made dialog visibility derive from the exact pair snapshot captured by the Compare command. Closing the dialog or an
  external History mutation therefore cannot cause it to reopen automatically while selection mode remains active.
- Added complete English and Chinese copy, responsive result panels and an overflow-safe input table. The entry command
  is disabled when the current filtered view contains no compatible pair, while delete/export/favorite/restore behavior
  remains unchanged.
- Added page integration tests, focused dialog tests, and a real browser workflow covering compatible and incompatible
  choices, accessible disabled reasons, recorded-only copy, changed inputs, mode cancellation, and axe analysis.

Files and areas:

- `src/app/history/page.tsx` and its focused component tests
- `src/components/history-comparison-dialog.tsx` and its focused tests
- English/Chinese History comparison catalog entries
- `e2e/history-comparison.spec.ts`

Verification:

- The strict comparison contracts, History page integration, and dialog suites passed 51/51 tests.
- The real History comparison browser workflow and axe scan passed 1/1 in 33.9 seconds.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: 4 active items remain across app-shell localization/mobile semantics, dead form-dependency cleanup,
Monte Carlo fallback error precedence, and finite chart data for extreme option inputs; further UI/product auditing
continues in parallel so the queue remains non-empty.

### Improvement 57: Remove the orphaned form abstraction and runtime dependency

Status: completed.

Changes:

- Repeated the full static import audit after earlier dead-source cleanup and confirmed the checked-in shadcn
  `form.tsx` primitive had no route, component, test, configuration, dynamic-import, or documentation consumer.
- Removed that isolated primitive and the resulting unused `react-hook-form` production dependency from both package
  manifests. This avoids shipping and maintaining a form state library while the application uses its existing
  calculator-specific controlled state and validation contracts.
- Updated the current engineering review to replace its now-stale reason for retaining the dependency. Historical log
  entries remain unchanged because they accurately describe the dependency boundary at the time of those batches.

Files and areas:

- `package.json` and `package-lock.json`
- Removed `src/components/ui/form.tsx`
- `ENGINEERING_REVIEW.md`

Verification:

- Full-repository import search found no remaining source consumer of the primitive or package.
- `npm ls react-hook-form --all` reports an empty tree and `npm audit --omit=dev` reports zero known vulnerabilities.
- Strict TypeScript, the full Vitest suite, Prettier, and `git diff --check` passed.

Queue status: 3 active items remain across app-shell localization/mobile semantics, Monte Carlo fallback error
precedence, and finite chart data for extreme option inputs; additional product and robustness audits remain active.

### Improvement 58: Preserve actionable Monte Carlo fallback errors

Status: completed.

Changes:

- Fixed the synchronous Worker failure path used when browser Worker construction or the initial `postMessage` throws.
  If the in-process fallback also rejects, the hook now reports that final computation/domain error instead of masking
  it with the earlier Worker infrastructure error.
- Aligned this path with the existing asynchronous `worker.onerror` fallback behavior while retaining the original
  Worker error as a safe fallback for non-`Error` rejections.
- Added independent regressions for both Worker construction failure and postMessage failure using an invalid
  three-asset correlation. Both paths now expose the actionable correlation-range message through hook state and the
  `onError` callback exactly once; the postMessage path still terminates its partially initialized Worker.

Files and areas:

- `src/hooks/use-monte-carlo-simulation.ts`
- `src/hooks/use-monte-carlo-simulation.test.tsx`

Verification:

- The focused Worker lifecycle, fallback, stale-run, and error-precedence suite passed 6/6 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.
- The full suite remained green at 59 test files and 578 tests with this change present.

Queue status: 2 active items remain across app-shell localization/mobile semantics and finite chart data for extreme
option inputs; broader UI and robustness auditing continues so the next queue is already being replenished.

### Improvement 59: Keep option payoff charts finite at numeric extremes

Status: completed.

Changes:

- Hardened the option payoff domain against overflow when a valid finite spot or strike approaches
  `Number.MAX_VALUE`. Spot expansion and padded upper bounds now saturate at the largest finite number instead of
  producing an infinite chart axis.
- Reordered linear interpolation from `(range * index) / sampleCount` to `range * (index / sampleCount)`. The
  normalized factor is bounded before multiplication, so every generated sample remains finite when the domain span
  itself is near the JavaScript numeric limit.
- Preserved exact spot and strike anchors, sorted uniqueness, monotonic intrinsic call/put values, and the established
  ordinary-input chart contract. A regression locks the existing `[2.5, 1047.5]` domain and 43 points for the normal
  100/1000 case so hardening cannot silently reshape common charts.
- Added extreme cases for a maximum spot, maximum strike, and both maximum together. Every domain endpoint, sample,
  and payoff must remain finite, ordered, and directionally monotonic.

Files and areas:

- `src/lib/chart-data.ts`
- `src/lib/chart-data.test.ts`

Verification:

- The focused calculator chart-data suite passed 4/4 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.
- The full suite remained green at 59 test files and 578 tests with this change present.

Queue status: app-shell localization/mobile semantics is actively being implemented, while new finance correctness,
tooling, dependency, UI, and robustness audits are replenishing the next prioritized work items.

### Improvement 60: Synchronize the public capability overview

Status: completed.

Changes:

- Updated the supporting-page overview to include the shipped strict two-record History comparison workflow rather
  than presenting History as browse/delete/export only.
- Documented the comparison safety contract: only proven compatible stored metadata is accepted, deltas use absolute
  units, canonical inputs are shown, and recorded outputs are not misrepresented as current-model recalculations.
- Added the newly hardened Monte Carlo fallback error precedence and finite extreme option-chart behavior to the
  reliability overview so operational guarantees match the current implementation and tests.
- Removed the stale React Hook Form stack claim after Improvement 57 deleted its only orphaned primitive and package;
  the README now accurately describes Zod schemas with calculator-specific controlled React state.

Files and areas:

- `README.md`
- `IMPROVEMENT_LOG.md`

Verification:

- Prettier and `git diff --check` passed for both Markdown files.
- A current-document search confirms README no longer advertises the removed `react-hook-form` dependency.

Queue status: app-shell localization/mobile semantics, extreme inflation-rate stability, and an independent tooling
improvement are active in parallel; History comparison workflow follow-ups remain queued for product prioritization.

### Improvement 61: Machine-readable History CSV columns

Status: completed.

Changes:

- Extended the History CSV export without removing or renaming its existing localized `page`, formatted `result`,
  serialized `inputs`, label, and local timestamp columns.
- Added stable record identity and source fields: `id`, language-independent `pageId`, numeric `rawResult`, stored
  `resultFormat`, stored `resultUnit`, and ISO-8601 `timestampIso`. Downstream audits and spreadsheet workflows can now
  sort, join, calculate, and process exports without reverse-parsing translated or rounded display strings.
- Kept legacy metadata explicit: records that predate result format/unit fields export empty stored-metadata cells
  rather than inventing a contract that was not persisted.
- Added a page-level export regression that verifies localized and raw fields are emitted together with exact values,
  including decimal percentage storage versus its formatted percentage display.

Files and areas:

- `src/app/history/page.tsx`
- `src/app/history/page.test.tsx`

Verification:

- The focused History page suite passed 8/8 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed with all parallel batches present.

Queue status: app-shell localization/mobile semantics, extreme inflation-rate stability, and an independent tooling
improvement remain active in parallel; comparison baseline swapping and fuller workspace backup are queued product
follow-ups.

### Improvement 62: Stable inflation annualization across extreme price scales

Status: completed.

Changes:

- Reproduced two failures in `inflationRate` for valid positive finite prices: dividing `Number.MAX_VALUE` by
  `Number.MIN_VALUE` overflowed and returned `NaN`, while the reciprocal ratio underflowed to zero and incorrectly
  returned an exact `-100%` annual rate even over a 100-year horizon.
- Reworked annualization in the logarithmic domain. Ordinary ratios use `log1p((end - start) / start)` for precision
  near equal prices; overflowed, underflowed, or rounded-to-minus-one relative changes use the difference of finite
  endpoint logarithms. `expm1` then recovers the annual rate without cancellation around zero.
- Preserved invalid-input and unrepresentable-output behavior while keeping the standard 100-to-150 over ten years
  result unchanged.
- Added extreme upward/downward 100-year regressions with finite expected values and a reciprocal annual-factor
  property, so neither direction can regress independently.

Files and areas:

- `src/lib/finance-math.ts`
- `src/lib/finance-math.test.ts`

Verification:

- The complete finance-math suite passed 72/72 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: app-shell localization/mobile semantics, Monte Carlo trust-boundary limits, and an independent tooling
improvement are active in parallel; comparison baseline swapping and fuller workspace backup remain queued.

### Progress checkpoint: 18:11 +08:00

- Resumed-goal elapsed time: approximately 6 hours 59 minutes; cumulative logged active work: approximately 14 hours
  36 minutes. The goal remains active until the user explicitly stops it.
- Completed improvement batches: 62. Recent work hardened extreme inflation annualization, made History CSV exports
  machine-readable, synchronized public capability documentation, and kept option chart data finite at numeric limits.
- Current work: finish the app-shell localization and mobile-dialog semantics batch, then integrate the independently
  verified Monte Carlo trust-boundary limits and select the next tooling or product improvement.
- Queue status: core correctness, UI accessibility, tooling, History backup/comparison follow-ups, and operational
  robustness remain represented; the queue is intentionally non-empty.

### Improvement 63: Localized mobile navigation semantics and workspace identity

Status: completed.

Changes:

- Replaced the desktop/mobile Sidebar's hard-coded English `Financial workspace` subtitle with a typed English/Chinese
  translation, so changing language updates the complete app-shell identity rather than only calculator links.
- Replaced the mobile Sheet's action-oriented trigger label and search placeholder as its hidden dialog metadata.
  Purpose-specific localized title and description now identify the surface as the full calculator menu and explain
  that users can search or browse the directory.
- Added component coverage that opens the controlled drawer in both languages and verifies its accessible name,
  description, workspace subtitle, navigation landmark, close command, and separation from the menu trigger label.
- Expanded the real mobile browser accessibility workflow to run axe with the English and Chinese drawers open, verify
  both localized metadata sets, close explicitly in English, and navigate through a Chinese calculator link while
  confirming the drawer leaves the accessibility tree.
- Increased only this multi-state axe workflow's test budget and cold-route navigation allowance. Three axe scans had
  consumed the default 30-second budget while Next.js was compiling the destination; the application had already
  closed the drawer correctly, but the test allowed only five remaining seconds for the first route compilation.
- Updated the public reliability overview to describe the localized, purpose-specific mobile dialog contract.

Files and areas:

- `src/components/layout/sidebar.tsx`
- `src/components/layout/mobile-sidebar.tsx` and its new focused test
- English/Chinese Sidebar catalog entries
- `e2e/accessibility.spec.ts`
- `README.md`

Verification:

- Focused MobileSidebar and translation-catalog suites passed 5/5 tests.
- The mobile English/Chinese drawer, navigation, and axe browser workflow passed 1/1 in 13.5 seconds on a reused
  development server.
- Strict TypeScript, targeted ESLint, Prettier, and `git diff --check` passed.

Queue status: Monte Carlo trust-boundary limits and an independent tooling improvement remain active in parallel;
comparison baseline swapping, complete workspace backup, and further UI refinement remain queued.

### Improvement 64: Bound Monte Carlo work at every execution boundary

Status: completed.

Changes:

- Reproduced an unbounded-work path below the validated Portfolio page: a direct hook/Worker payload with an infinite
  simulation count never terminated, and arbitrarily large finite counts or more than 20 assets could bypass the UI
  limits and consume uncontrolled CPU/memory.
- Added one shared simulation-target contract that validates the 1-to-20 asset boundary, rejects non-finite counts,
  floors finite fractional counts, clamps work to the established 5,000-simulation maximum, and still emits the
  required equal-weight plus every single-asset deterministic baseline when a smaller count is requested.
- Applied the contract before Worker construction/postMessage so invalid work cannot be structured-cloned or started,
  then retained the same validation inside both the asynchronous Worker and in-process fallback as defense in depth.
  Huge finite hook requests are normalized before crossing the thread boundary.
- Preserved the existing empty-asset result, seeded sampling, progress, cancellation, fallback, and summary semantics.
- Added hook regressions proving Infinity/NaN and oversized asset arrays create no Worker, huge finite requests post the
  exact 5,000 cap, and empty assets still complete. Direct Worker tests invoke `self.onmessage` to prove Infinity/NaN
  return one error, 21 assets fail before baseline allocation, and `Number.MAX_VALUE` completes with exactly 5,000
  bounded results.

Files and areas:

- `src/lib/portfolio-math.ts` and its focused tests
- `src/hooks/use-monte-carlo-simulation.ts` and its focused tests
- `src/workers/monte-carlo.worker.ts` and its new direct Worker test

Verification:

- Portfolio math, hook lifecycle/fallback, and direct Worker suites passed 30/30 tests across 3 files.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed after the parallel UI batch reached a
  type-consistent state.

Queue status: History baseline swapping, Playwright server lifecycle hardening, and stale PWA-test marker recovery are
active in parallel; History loading stability and complete workspace backup remain queued UI/product improvements.

### Improvement 65: Deterministic Playwright dev-server teardown on Windows

Status: completed.

Changes:

- Reproduced a tooling hang where a focused browser test reported `ok`, but Playwright's `npm run dev` web-server
  wrapper left the Windows child process tree alive until an outer 186-second timeout. This obscured a passing test and
  made rapid focused E2E iteration unreliable.
- Changed the standard Playwright configuration to invoke Next's CLI directly through Node. Playwright now owns the
  actual development-server parent rather than an intermediate `npm.cmd` wrapper, while retaining the same Webpack
  mode, port, startup timeout, CI behavior, and local reuse contract.
- Added a pure configuration regression that asserts the exact direct-Node command, rejects reintroduction of an npm
  wrapper, and locks the URL/timeout/reuse settings.
- Independently stopped the manually managed development server, confirmed port 3000 was unused, then ran a real
  Playwright-managed browser workflow. The test completed and the command exited normally; a post-run socket check
  confirmed the port was released.

Files and areas:

- `playwright.config.ts`
- `src/lib/playwright-config.test.ts`

Verification:

- The Playwright configuration and browser-resolver suites passed 14/14 tests.
- A real bond validation browser workflow passed 1/1; the full command exited 0 in 43.4 seconds and port 3000 had no
  listener afterward.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: History baseline swapping and stale PWA-test marker recovery are active in parallel; History loading
stability, complete workspace backup, and further UI/product auditing remain queued.

### Improvement 66: Recover PWA E2E startup after interrupted offline tests

Status: completed.

Changes:

- Reproduced a 180-second startup failure unique to interrupted PWA runs. The offline workflow intentionally creates
  `out/.pwa-e2e-offline` so the static server drops sockets, but an interrupted run could leave that marker behind.
  On the next run, Playwright's readiness probe was disconnected before the spec's own `beforeAll` cleanup could run.
- Refactored the PWA server into an exported, testable `startPwaE2eServer` function while preserving direct CLI
  startup, base-path rewriting, static serving/clean URL behavior, offline socket drops, and SIGINT/SIGTERM shutdown.
- Removed a stale offline marker before calling `listen()`. A cleanup failure now fails startup immediately with the
  real filesystem error instead of presenting as a generic readiness timeout.
- Added an isolated temporary-directory test that creates a stale marker, starts on an OS-assigned port, verifies the
  marker is gone before the first HTTP request, confirms the server responds, checks the resolved listening URL, and
  closes the server plus temporary files after every run.

Files and areas:

- `scripts/serve-pwa-e2e.mjs`
- `src/lib/pwa-e2e-server.test.ts`

Verification:

- The focused PWA E2E server lifecycle suite passed 1/1 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: History baseline swapping and clipboard fallback cleanup are active in parallel; History loading
stability, complete workspace backup, and further UI/product auditing remain queued.

### Improvement 67: Exception-safe legacy clipboard fallback cleanup

Status: completed.

Changes:

- Closed a cleanup gap in the legacy copy fallback used after modern Clipboard permission/API failures. Temporary
  textarea focus and selection happened before the protected block, so an embedded or restricted browser throwing
  during either step could leak the hidden node and discard the earlier modern Clipboard failure context.
- Moved focus, selection, and `execCommand("copy")` into one try/catch/finally lifecycle. Any legacy setup/copy error is
  now combined with the modern rejection in the existing `AggregateError`, and the temporary textarea is removed on
  every path while best-effort focus restoration still runs.
- Contained focus-restoration exceptions inside `finally`. A browser throwing while returning focus to the prior
  control can no longer turn an otherwise successful copy into a user-visible failure or replace the real copy error.
- Added regressions for selection failure after a denied modern write and for focus restoration failure after a
  successful legacy copy, including node cleanup, error ordering, execCommand suppression, and success preservation.

Files and areas:

- `src/lib/clipboard.ts`
- `src/lib/clipboard.test.ts`

Verification:

- The focused Clipboard suite passed 4/4 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: History baseline swapping remains active; History loading stability, complete workspace backup, and the
next core/tooling correctness batches remain queued or under audit.

### Improvement 68: Swap History comparison baseline in place

Status: completed.

Changes:

- Added a compact `ArrowLeftRight` command to the comparison dialog with explicit English/Chinese accessible labels and
  tooltips. Users can now choose either saved record as the baseline without closing the dialog, cancelling selection,
  or relying on the original click order.
- Atomically reversed both the active comparison selection and the dialog's opening snapshot. The controlled dialog
  therefore stays open while results, timestamps, baseline/comparison input columns, changed-row highlighting, and the
  `comparison - baseline` delta direction all update together.
- Preserved the safety contract: swapping cannot broaden eligibility or change the metric; closing retains the two
  selected records and their incompatibility explanations; removing a selected record externally still closes the
  dialog and leaves only the surviving valid selection.
- Expanded component/page regressions to cover timestamps, input order, positive-to-negative delta reversal, dialog
  continuity, close/reopen state, and external invalidation. The browser workflow swaps in English, closes, changes to
  Chinese, reopens the retained pair, swaps back, and audits the final dialog with axe.

Files and areas:

- `src/components/history-comparison-dialog.tsx` and its focused tests
- `src/app/history/page.tsx` and its focused tests
- English/Chinese History comparison copy
- `e2e/history-comparison.spec.ts`

Verification:

- History comparison contracts, page, dialog, and catalog suites passed 57/57 tests; the directly changed page/dialog
  suites account for 16/16 of those tests.
- The real bilingual swap/close/reopen workflow and axe scan passed 1/1. Its Playwright test body completed normally;
  a separately tracked Windows dev-server teardown issue required terminating the outer runner afterward.
- Strict TypeScript, targeted ESLint, Prettier, and `git diff --check` passed.

Queue status: a robust Playwright child-process wrapper, bare-CR Markdown containment, and extreme purchasing-power/CPI
stability are active in parallel; History loading stability and complete workspace backup remain queued.

### Improvement 69: Contain bare carriage returns in shared Markdown

Status: completed.

Changes:

- Closed a Markdown structure-escape gap in user-facing shared reports. CommonMark treats a bare carriage return as a
  line ending, but the sanitizer only converted LF and CRLF; a stored/user input containing only `\r` could therefore
  leave its current heading or table cell and visually forge a new Markdown heading/row.
- Normalized CRLF, bare CR, and LF to `<br>` in the common text escaper before table-specific pipe escaping. All line
  ending forms now remain visibly separated inside the intended heading/cell without leaving raw control characters.
- Added direct mixed-line-ending coverage plus a generated report containing a forged heading and forged table row.
  The regression asserts no raw CR survives and both payloads remain inside their current Markdown blocks.

Files and areas:

- `src/lib/share-markdown.ts`
- `src/lib/share-markdown.test.ts`

Verification:

- The focused Markdown sharing suite passed 4/4 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: a robust Playwright child-process wrapper and extreme purchasing-power/CPI stability remain active;
History loading stability, complete workspace backup, and further UI/product work remain queued.

### Improvement 70: Scale-stable purchasing power and CPI adjustment

Status: completed.

Changes:

- Reproduced valid finite macro calculations whose mathematical result is finite but whose intermediate arithmetic is
  not: `MAX_VALUE / 2^1024` collapsed through an infinite power factor, `MIN_VALUE / 0.5^1075` divided by zero, and
  `MIN_VALUE * (1 / MIN_VALUE)` multiplied by an infinite CPI ratio.
- Kept the existing direct purchasing-power calculation for ordinary/nonzero finite results, then added a signed
  log-magnitude fallback only when the power/division path loses scale. Negative amounts retain their sign; invalid
  rates/years and genuinely unrepresentable results retain the established `NaN` behavior.
- Made CPI adjustment try direct multiplication, then a reordered `(amount / fromCPI) * toCPI` path, and finally a
  log-domain reconstruction. Zero and validation semantics remain explicit, while finite results survive either ratio
  overflow or amount underflow.
- Added exact/close regressions recovering approximately 1, 2, and 1 for the three extreme identities, plus ordinary
  purchasing-power and CPI cases so the fast path and visible calculator results stay unchanged.

Files and areas:

- `src/lib/finance-math.ts`
- `src/lib/finance-math.test.ts`

Verification:

- The complete finance-math suite passed 73/73 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: a robust Playwright child-process wrapper, object-URL download cleanup, and complete workspace backup are
active in parallel; History loading stability and further UI/product work remain queued.

### Improvement 71: Revoke export Blob URLs after DOM setup failures

Status: completed.

Changes:

- Closed a browser resource leak in CSV/JSON downloads. Once `URL.createObjectURL` succeeded, anchor creation,
  configuration, and DOM insertion still happened before the existing `try/finally`; a CSP, embedded document, or DOM
  exception during that setup could permanently retain the Blob URL.
- Moved the complete anchor lifecycle after URL creation into one protected block. The link is nullable and removed on
  every partial/successful setup path, while URL revocation retains the existing zero-delay scheduling needed after a
  successful browser download click.
- Preserved exception propagation so the export hook continues to show its actionable failure toast and keeps the
  command retryable rather than reporting a false success.
- Added a DOM insertion failure regression proving no download anchor remains, the original exception propagates, and
  the exact created Blob URL is revoked when the cleanup timer runs.

Files and areas:

- `src/lib/data-export.ts`
- `src/lib/data-export.test.ts`

Verification:

- The focused structured data export suite passed 7/7 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: a robust Playwright child-process wrapper and complete workspace backup remain active; History loading
stability and further UI/product/core work remain queued or under audit.

### Improvement 72: Stable responsive History loading skeleton

Status: completed.

Changes:

- Replaced the client-storage initialization screen's single large `Loading...` header panel and otherwise empty
  viewport with a responsive skeleton that mirrors the final History toolbar, two page actions, search/selection row,
  and three bounded record rows. Mobile and desktop first paint now reserve useful structure before localStorage state
  is ready instead of jumping from a sparse screen to the full workflow.
- Kept the real localized History heading and visible loading description, and added a dedicated screen-reader status
  while marking the page busy. Decorative action/list placeholders are hidden from the accessibility tree so they
  cannot be mistaken for disabled controls or records.
- Used the existing shared Skeleton/Card primitives and stable widths/minimum row heights; the skeleton introduces no
  new animation library, translation copy, storage behavior, or interactive state.
- Made initialization controllable in the focused page harness and added a regression for busy/status semantics,
  heading continuity, exactly three structural rows, and absence of live export controls before initialization.

Files and areas:

- `src/app/history/page.tsx`
- `src/app/history/page.test.tsx`

Verification:

- The focused History page suite passed 9/9 tests.
- Strict TypeScript, focused ESLint, Prettier, and `git diff --check` passed.

Queue status: a robust Playwright child-process wrapper, transactional print preparation, and complete workspace backup
are active in parallel; further UI/product/core auditing remains queued.
