# Continuous Improvement Log

Session start: 2026-07-13 03:06 +08:00

Active branch: `codex/continuous-improvements`

Minimum session target: 10 hours; continue until the user explicitly stops the goal.

## Active Improvement Queue

- [x] Complete the implied-volatility workflow: market-price validation, history/share/export, i18n, and E2E.
- [ ] Add option-price and implied-volatility property coverage across a deterministic contract matrix.
- [ ] Audit production bundle sizes and reduce avoidable client-side JavaScript or eager imports.
- [ ] Add automated PWA/offline navigation and update-flow browser coverage.
- [ ] Add automated accessibility checks for calculator forms, dialogs, navigation, and result announcements.
- [ ] Review all calculator pages for validation/schema drift and inconsistent supported domains.
- [ ] Profile large loan schedules, portfolio simulations, history filtering, and report exports.
- [ ] Review dependency upgrades and remove confirmed dead code without destabilizing generated UI primitives.
- [ ] Validate static deployment headers, base-path output, precache completeness, and cache invalidation in automation.
- [ ] Expand user-facing documentation with model assumptions, limitations, and worked examples.

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
