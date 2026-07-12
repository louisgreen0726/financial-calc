# Engineering Review

Review date: 2026-07-13

## Scope

This review covered the static Next.js application, shared financial formulas, client persistence, exports, PWA/static deployment, accessibility, responsive UI, dependencies, and production artifacts.

## 2026-07-13 Follow-up Review

The follow-up started from a clean `main` worktree, reproduced the complete local quality gate, re-read the formula,
validation, persistence, sharing/export, worker, PWA, layout, and deployment boundaries, and then added property and
browser-level checks beyond the existing suite.

### Feature Extension: Continuous Dividend Yield

- The Options calculator now implements the dividend-adjusted Black-Scholes-Merton model for European calls and
  puts. The new continuously compounded yield defaults to zero, preserving old links, history, and API calls.
- Dividend discounting is applied consistently to stochastic pricing, deterministic zero-volatility pricing,
  no-arbitrage bounds, Delta, Gamma, Theta, and Vega. Rho continues to measure the risk-free-rate sensitivity.
- Validation, accessible errors, share URLs, legacy history restoration, CSV/JSON/PDF report inputs, navigation,
  help text, and English/Chinese labels all include the new assumption.

### Feature Extension: Implied Volatility

- The finance engine now solves call and put implied volatility with a bounded bisection method over the application's
  supported `0%` to `500%` volatility domain. It rejects expired contracts, non-finite inputs, no-arbitrage violations,
  and prices that require unsupported volatility instead of returning a misleading estimate.
- The Options page provides a separate market workflow that reuses contract assumptions without depending on the
  pricing-volatility input. Market price, option type, result, history, sharing, reports, accessible errors, and legacy
  restore defaults are connected end to end.
- Unit tests cover dividend-aware call/put round trips, zero-volatility boundaries, impossible prices, and schema
  independence. Playwright verifies the `q=2%`, market price `9.227` to `20.00%` browser workflow and share URL.

### Prioritized Adjustment List

#### P0

No P0 findings were identified.

#### P1 - fixed

- Numeric input integrity: the shared parser previously removed commas, spaces, and underscores wherever they
  appeared. Malformed values such as `1,2,3` or `1 2` could therefore be silently changed into a different amount.
  Separators must now form consistent three-digit groups; malformed and mixed grouping is rejected.
- Black-Scholes no-arbitrage bounds: the normal-CDF approximation could produce a slightly negative price for an
  extreme deep-out-of-the-money contract. Stochastic prices are now constrained to the theoretical call/put lower
  and upper bounds, with an extreme negative-rate regression test.

#### P2 - fixed

- TVM validation contract: the math engine and shared rate domain support rates above `-100%`, but the page rejected
  every negative rate. The UI, localized validation, range hint, and schema now share the same exclusive lower bound.
- Cross-tab settings: language and theme providers now react to browser `storage` events, matching the existing
  cross-tab behavior for currency, history, favorites, and sidebar preferences.
- Export/share hardening: truncated download names are normalized again after the length limit so they do not end in
  a Windows-invalid dot or space; copied Markdown now neutralizes link and inline-formatting syntax in user text.
- Mobile result visibility: the page-history control no longer overlaps the fixed bottom navigation or result summary.
  It becomes a compact accessible icon on mobile, preserves its full label on desktop, and result summaries include
  bottom scroll margin for fixed navigation.
- Continuous verification: `typecheck` and `verify` scripts plus a least-privilege GitHub Actions workflow now enforce
  formatting, TypeScript, ESLint, Vitest, static export, Playwright browser workflows, and a high-severity production
  dependency audit. Browser failures retain screenshots and traces for diagnosis.

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
- Financial formulas are unit- and property-tested but are not independently certified for regulated or fiduciary use.
  Production use still requires domain-expert validation against the institution's conventions, rounding rules, and
  approved reference systems.

## Verification Evidence

- Formatting, strict TypeScript, ESLint, Vitest, production build, `npm audit`, and `git diff --check` were run after the fixes.
- The unit/integration suite covers 36 files and 282 tests, including the numeric parser, TVM negative-rate contract,
  dividend-adjusted Black-Scholes-Merton pricing and Greeks, cross-tab settings, export naming, Markdown safety, and
  implied-volatility solver, mobile history-control regressions, and related workflows. Two additional Playwright
  tests cover desktop and mobile browser behavior.
- Default static build exported 15 application routes and generated a precache manifest with 195 assets; route assets and precache entries were checked for missing files.
- A `NEXT_PUBLIC_BASE_PATH=/calc` build completed successfully and all exported HTML asset references used the `/calc` prefix.
- Browser checks covered desktop and 390px layouts across home, TVM, Cash Flow, Portfolio, Loans, History, and Settings.
  All routes returned 200 with no horizontal overflow or console errors; negative-rate TVM produced a finite result,
  and rectangle-level checks confirmed zero overlap among the result, history control, and mobile navigation.
- The committed Playwright suite verifies dividend-aware prices, legacy defaults, share-link round trips, Chinese
  localization, six-input mobile layout, horizontal overflow, console errors, and fixed-navigation overlap in CI.
- `npm audit` reported zero known vulnerabilities across 767 installed production, development, optional, and peer
  dependencies.
