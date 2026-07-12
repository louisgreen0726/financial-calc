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

### Performance Follow-up: Initial Route JavaScript

- The shared History panel no longer pulls `framer-motion` into every calculator that renders it. Existing CSS
  animation utilities preserve the panel entrance without a shared runtime dependency; the Options route's raw
  initial JavaScript fell by 124,780 bytes (8.4%), with comparable reductions across six other calculators.
- `npm run bundle:check` now measures the unique initial scripts referenced by every exported HTML route, including
  flat and directory error-page exports and base-path-prefixed assets. Explicit gzip ceilings fail `npm run verify`
  before route growth becomes an unnoticed regression.
- The current largest initial payload is Portfolio at 450,961 / 500,000 gzip bytes. Options is 418,482 / 470,000;
  lighter informational and settings routes remain below 300,000 bytes.

### PWA Follow-up: Real Offline Navigation and Updates

- A production-only Playwright workflow now installs the emitted service worker, confirms that it controls the page
  and populated its versioned static cache, disconnects the backing static server, and opens an unvisited calculator
  entirely from precache. Unknown offline routes render the cached 404 document with HTTP 404 status.
- Browser testing exposed that Chromium can reject a cached document response when it retains the asset URL used to
  populate it. Offline navigation fallbacks now reconstruct a fresh document response with the same body, headers,
  and status; network `Response.error()` values also take the cache path instead of becoming failed navigations.
- The workflow installs a second worker, verifies that the localized update prompt waits for user action, sends
  `SKIP_WAITING`, observes the new controller, and confirms the application-triggered reload.
- The same production workflow now runs against both root hosting and a real `/calc` deployment. The base-path case
  requires an exact `/calc/` worker scope, base-prefixed worker/controller URLs, and base-prefixed precache requests
  before exercising the same offline known/unknown routes and update activation.
- This browser topology found that a static host's absolute clean-URL redirect can silently strip the deployment
  prefix from explicit `index.html` precache requests and abort installation. The deterministic test host serves
  exported `.html` files directly while retaining directory-index behavior for navigation; production hosts must
  likewise preserve the configured prefix in every redirect.

### Accessibility Follow-up: Automated WCAG Baseline

- Axe Playwright scans now cover all 13 user-facing routes against WCAG 2.0/2.1/2.2 A and AA rules plus automated
  best practices. Additional states cover invalid field errors, the Share Results dialog, a populated History panel,
  and the mobile Options navigation/form layout.
- The new gate identified and fixed page structure that manual component tests did not expose: desktop sidebar text
  outside landmarks, two keyboard-inaccessible scroll regions, and skipped heading levels throughout Help content.
- The sidebar is now a named complementary landmark. Sensitivity heatmaps and the Loan amortization table expose
  named, focusable regions for keyboard scrolling, and Help follows a continuous `h1 -> h2 -> h3` hierarchy.

### Formula Follow-up: Option Property Matrix

- A deterministic 10-contract matrix now exercises Black-Scholes-Merton and implied volatility across moneyness,
  sub-unit and large notionals, short and 30-year maturities, negative rates, negative/high dividends, and volatility
  from 5% to 250%.
- The suite checks discounted put-call parity and no-arbitrage bounds, spot/volatility monotonicity, scale
  homogeneity, all call-put Greek identities, finite-difference sensitivities, 20 implied-volatility round trips, and
  the exact 0%/500% solver boundaries.
- These 55 properties complement point benchmarks: they are fixed and reproducible, but broad enough to catch
  sign, discount-factor, scaling, and solver-bracketing regressions that isolated examples can miss.

### Validation Follow-up: Restored Portfolio and Loan Domains

- The Portfolio risk-free rate previously had three contracts: the engine accepted any finite value, the schema
  allowed 0% to 100%, and the slider exposed only 0% to 10%. Shared -10% to 10% bounds now support negative-rate
  scenarios while keeping the schema, slider, and restore logic identical.
- Portfolio URL/history restoration now rejects malformed, non-finite, and out-of-range risk-free rates and
  correlations instead of assigning them to controlled sliders. Browser coverage verifies accepted negative values
  and rejection of oversized values.
- Loan terms are validated in whole months, but the browser previously advertised one-year steps. The term control
  now exposes one-month increments and the exact one-month to 50-year engine range; the rate control exposes its
  schema's 100% maximum.

### Performance Follow-up: Portfolio Variance Hot Path

- The equal-correlation portfolio model previously evaluated every asset pair for every sampled point. The exact
  variance identity now accumulates weighted risk and squared weighted risk in one pass, reducing the shared worker
  and fallback path from O(n^2) to O(n).
- A 20-asset, 5,000-point, 31-round alternating benchmark improved from 4.7835 ms to 0.5344 ms median (8.95x). A
  quadratic reference matrix covers 426 weight/correlation combinations to protect numerical equivalence.
- Other bounded paths did not justify riskier changes: a maximum 600-period loan schedule averaged 0.016 ms in the
  engine, History is capped at 50 records per page, and report printing uses bounded DOM preparation plus native
  browser pagination.

### Maintenance Follow-up: Dependencies and Dead Source

- Static import and Knip review removed the unused `@hookform/resolvers` dependency and four orphan modules: an old
  sensitivity component, an unused auto-calculation hook, a disconnected chart theme, and a duplicate TypeScript
  design-token set. The cleanup removes 359 source lines without changing emitted route bundles.
- `react-hook-form` and several currently unused Radix packages remain intentionally because checked-in
  shadcn-generated primitives import them. Removing those packages would leave the local component library unable to
  typecheck even though current routes do not instantiate every primitive.
- Available direct upgrades are all major migrations (`@types/node` 26, ESLint 10, Lucide 1.x, TypeScript 7). With no
  audit findings, they should be handled as compatibility projects rather than mixed into low-risk cleanup.

### Deployment Follow-up: Static Artifact Contract

- A build succeeding did not previously prove that precache entries, route HTML, internal asset references, base-path
  prefixes, PWA metadata, and host cache policies still agreed. `npm run static:check` now validates that complete
  emitted contract rather than relying on manual inspection.
- Precache metadata is evaluated in an isolated, time-bounded VM and tied to `.next/BUILD_ID`. Declared assets and
  routes must exist, exported route indexes and precache routes must match in both directions, mutable worker metadata
  must stay out of precache, and duplicate entries fail the gate.
- Every exported document's internal `href` and `src` must resolve to an emitted file or route. A dedicated CI build
  with `NEXT_PUBLIC_BASE_PATH=/calc` additionally ensures absolute references remain under `/calc` while the PWA
  manifest keeps its install identity, start URL, and scope relative.
- The emitted `_headers` deployment template is checked for the required CSP, referrer, MIME sniffing, framing, and
  permissions protections plus revalidation of HTML/service-worker metadata and immutable caching of hashed assets.
  Host-specific base-path prefixing remains an explicit deployment responsibility.

### Documentation Follow-up: Model Boundaries

- The Help page previously described what each calculator did but not the rate/timing conventions, statistical
  assumptions, sensitivity, or excluded effects needed to interpret an output. Users could easily compare a periodic
  TVM rate with an annual quote, treat a sampled equal-correlation portfolio as a full optimizer, or read normal VaR
  as a stress-loss bound.
- A bilingual guide now documents six model families with separate assumptions, reproducible numeric examples, and
  limitations. It covers cash-flow signs and period zero, IRR root ambiguity, lender rounding, flat-YTM bond cash
  flows, perpetual-growth DDM, BSM exercise/dynamics and Greek units, long-only equal-correlation sampling, normal
  zero-drift VaR/CVaR, exact Fisher rates, and PPP quote direction.
- The decision notice makes the operational boundary explicit: outputs are deterministic estimates from user inputs,
  not quotes, forecasts, accounting/tax conclusions, or advice. Material decisions still need independent financial
  and domain review.
- Guide data lives in a Help-only typed module. Moving it out of the shared i18n dictionary eliminated an observed
  approximately 4.7 KB gzip increase from every route; only `/help` carries the roughly 6.3 KB documentation cost.

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
- The unit/integration suite covers 40 files and 347 tests, including the numeric parser, TVM negative-rate contract,
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
- A separate production Playwright workflow verifies PWA installation, precache contents, offline known/unknown
  navigation, correct 404 status, user-controlled worker activation, controller replacement, and reload behavior.
- Fifteen Axe Playwright checks enforce the route and interaction accessibility baseline in the standard browser
  workflow, which now includes 18 tests with the option and Portfolio workflows before the separate PWA test runs.
- Per-route gzip budgets cover all 15 static routes and are part of the default verification command.
- `npm audit` reported zero known vulnerabilities across 767 installed production, development, optional, and peer
  dependencies.
