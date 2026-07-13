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
- Each tab tracks its controller identity. A first worker claim stays silent, the tab that requests activation reloads
  after confirmation, and other tabs replace their now-stale waiting-worker action with a direct reload under the same
  toast ID when the controller changes externally.
- The same production workflow now runs against both root hosting and a real `/calc` deployment. The base-path case
  requires an exact `/calc/` worker scope, base-prefixed worker/controller URLs, and base-prefixed precache requests
  before exercising the same offline known/unknown routes and update activation.
- This browser topology found that a static host's absolute clean-URL redirect can silently strip the deployment
  prefix from explicit `index.html` precache requests and abort installation. The deterministic test host serves
  exported `.html` files directly while retaining directory-index behavior for navigation; production hosts must
  likewise preserve the configured prefix in every redirect.

### PWA Follow-up: Bounded Cache Failure Recovery

- Install previously stored every route HTML twice: once under its emitted `index.html` path and once under a clean
  navigation alias. Offline fallback already maps navigation paths to emitted files, so the 15 aliases added no
  capability. Removing them saves about 970,939 bytes and 15 CacheStorage entries per current build, and about twice
  that transient storage during an upgrade while old and new versions coexist.
- Runtime caches are capped at 40 entries, but the worker used to write entry 41 before trimming. At quota, the write
  could fail before cleanup and reject an otherwise successful resource request. New entries now reserve space first;
  a `QuotaExceededError` trims to half capacity and retries once.
- Cache reads, opens, and writes are best effort around successful network responses. A second quota failure or a
  disabled CacheStorage implementation is warned once per operation/cache and returns the network response instead of
  converting online navigation into a stale fallback, 404, or failed subresource.
- A failed essential precache install deletes its partial version cache. Activation uses failure-isolated stale-cache
  deletion and still claims clients if one old cache is busy. VM tests inject quota, open, write, cleanup, and deletion
  failures; production root and `/calc` browser suites prove emitted-path offline navigation, 404 status, CSP, and
  user-controlled updates remain intact without clean-path aliases.

### Accessibility Follow-up: Automated WCAG Baseline

- Axe Playwright scans now cover all 13 user-facing routes against WCAG 2.0/2.1/2.2 A and AA rules plus automated
  best practices. Additional states cover invalid field errors, the Share Results dialog, a populated History panel,
  and the mobile Options navigation/form layout.
- The new gate identified and fixed page structure that manual component tests did not expose: desktop sidebar text
  outside landmarks, two keyboard-inaccessible scroll regions, and skipped heading levels throughout Help content.
- The sidebar is now a named complementary landmark. Sensitivity heatmaps and the paginated Loan amortization table
  expose named, focusable regions for keyboard scrolling, and Help follows a continuous `h1 -> h2 -> h3` hierarchy.

### Formula Follow-up: Option Property Matrix

- A deterministic 10-contract matrix now exercises Black-Scholes-Merton and implied volatility across moneyness,
  sub-unit and large notionals, short and 30-year maturities, negative rates, negative/high dividends, and volatility
  from 5% to 250%.
- The suite checks discounted put-call parity and no-arbitrage bounds, spot/volatility monotonicity, scale
  homogeneity, all call-put Greek identities, finite-difference sensitivities, 20 implied-volatility round trips, and
  the exact 0%/500% solver boundaries.
- These 55 properties complement point benchmarks: they are fixed and reproducible, but broad enough to catch
  sign, discount-factor, scaling, and solver-bracketing regressions that isolated examples can miss.

### Formula Follow-up: Independent Reference Vectors

- Formula tests previously used local point expectations and internal mathematical properties; broad consistency did
  not provide independent provenance. A pinned fixture now carries published NumPy Financial vectors for PV, FV,
  PMT, NPER, RATE, NPV, and IRR plus three prices from OpenGamma Strata's precomputed Black-Scholes matrix.
- Every source is fixed to a 40-character upstream commit with its repository URL and license. The fixture README
  documents the Strata cost-of-carry mapping and prohibits regenerating expectations from this project's engine.
- The first external run found a `1.4924e-5` ATM option difference caused by the existing standard-normal CDF
  approximation. A piecewise high-precision rational/tail implementation now matches the selected Strata matrix to
  `1e-10` absolute tolerance and has direct checks through `+/-8` standard deviations.
- These references still do not constitute regulated-model certification. They add an independent regression layer;
  institution-specific conventions, rounding, and approved-system comparison remain required for production use.

### Risk Follow-up: Pure VaR and Expected Shortfall Contract

- Parametric-normal VaR/CVaR previously lived inside the Risk page's React `useMemo`, mixing domain calculations with
  parsing and presentation. The pure engine now owns annual-to-horizon scaling, inverse-normal quantiles, VaR, and
  closed-form normal Expected Shortfall with explicit amount/fraction fields.
- Domain checks reject non-finite inputs, invalid confidence, negative volatility, non-integer/non-positive horizons,
  and invalid trading-year conventions before any metric is returned. Zero volatility is a supported zero-loss case.
- NIST standard-normal critical values anchor one-day 95% and 99% references; tests additionally enforce
  `sqrt(days/252)` scaling and `CVaR > VaR` for positive volatility. A browser case locks the page's 99% dollar and
  percentage output, protecting the UI's percent-to-decimal conversion.
- This remains a zero-drift, normally distributed, constant-volatility model. The Help disclosure correctly requires
  backtesting and stress/scenario analysis for fat tails, serial dependence, volatility shifts, and liquidity gaps.

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
- A maximum 600-period loan schedule averages 0.016 ms in the engine, but rendering every row created about 2,400
  accessible nodes for the default 360-period case. The live table now renders at most 100 rows with bounded page
  controls; CSV/JSON retain the complete array, and the shared print coordinator expands all rows for print layout and
  restores the selected page afterward. History remains capped at 50 records per page.

### Maintenance Follow-up: Dependencies and Dead Source

- Static import and Knip review removed the unused `@hookform/resolvers` dependency and four orphan modules: an old
  sensitivity component, an unused auto-calculation hook, a disconnected chart theme, and a duplicate TypeScript
  design-token set. The cleanup removes 359 source lines without changing emitted route bundles.
- A follow-up import audit found that the only remaining `react-hook-form` consumer was the unreferenced generated
  `form.tsx` primitive itself. Both the unused primitive and its production dependency have now been removed; the
  remaining checked-in shadcn primitives retain only packages that they import directly.
- Lucide completed its 1.x migration with React 19, full browser, and route-budget verification. ESLint 10 remains
  blocked because the latest `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, and `eslint-plugin-react` releases only
  declare ESLint 9 compatibility; forcing that invalid peer tree was rejected. `@types/node` stays aligned with the
  Node 20 runtime, and TypeScript 7 remains outside `typescript-eslint`'s `<6.1.0` peer range.

### Workflow Follow-up: Reversible Calculator Defaults

- Only TVM previously exposed a clear command, and it emptied fields rather than consistently restoring defaults.
  Every calculator now uses one bilingual Reset defaults action in the page header. Resets affect current calculator
  inputs and derived results only; history, favorites, currency, language, and theme remain untouched.
- The shared action removes only its calculator-prefixed query parameters and preserves base paths, hashes, and
  unrelated parameters. It emits a location notification understood by both URL-state implementations, avoiding stale
  state or competing router writes.
- Each page returns an Undo closure that captures its complete relevant state. Portfolio includes simulation points,
  extrema, and result signatures and disables reset while a worker run is active; TVM includes derived steps/results;
  multi-model Equity and Macro include active tabs and interaction state.
- Browser coverage starts all nine calculators from shared URLs, resets to defaults, verifies unrelated query survival,
  and invokes Undo to restore both input values and prefixed URL state. A `/calc` component contract protects base-path
  preservation.

### Persistence Follow-up: History Backup Restore

- Settings could download raw history storage but offered no restore path, and legacy/malformed storage could be
  exported without normalization. Export now emits a repaired v1 envelope; import accepts that envelope and legacy
  arrays under a 2 MB / 5,000-candidate boundary.
- The import planner applies the same field, finite-number, page, expiry, clock-skew, and per-page caps as runtime
  storage. It reports added, updated, duplicate, skipped, and final counts, keeps the newest record per ID, and is
  idempotent when a backup is selected repeatedly.
- Preview does not become a stale write: confirmation takes the original source back into the cross-tab storage lock,
  re-reads current history, recomputes the merge, and only then writes a versioned envelope. Unknown future versions
  are preserved rather than overwritten.
- Browser coverage verifies the file API, preview, persistence, repeat deduplication, malformed-file rejection, and
  accessible dialog state. This History-only workflow remains available for portable record merges and does not provide
  cloud synchronization; full local workspace transfer is a separate, explicitly confirmed workflow.
- Cross-page restores consume their session payload before invoking page state. If `removeItem` is unavailable, a JSON
  `null` sentinel provides an equivalent cleanup; if all cleanup writes fail, a module-session signature prevents
  callback changes and Next.js remounts from replaying the payload. A localized warning accurately notes that a full
  browser refresh may attempt the restore again.
- Page-category filters resolve against the current grouped history before rendering. If deletion, expiry, or cross-tab
  synchronization removes the active category, the same render shows All selected and the remaining records without a
  cascading state-normalization render. Empty Favorites remains an intentional selected view rather than falling back.

### Persistence Follow-up: Complete Workspace Backup

- Settings now exports a separate `financial-calc-workspace` v1 envelope containing normalized current History,
  favorites that still reference those records, and the effective language, theme, currency, and sidebar-collapse
  preferences. Generation counters, pending session restores, and the unused settings/drafts keys are intentionally not
  transferred.
- The pure parser enforces the outer kind/version, a 2.1 MB byte ceiling, the existing 5,000-history-candidate limit,
  a matching favorite-count limit, bounded favorite IDs, exact preference keys, supported enums, ISO export time, and
  a real boolean sidebar value. History candidates still pass through the established expiry, page, input, finite-value,
  deduplication, and per-page repair contracts. Workspace JSON is downloaded compactly so its actual file size matches
  that ceiling; ordinary calculation/report JSON keeps the existing readable indentation.
- Selecting a file computes a no-write preview. Confirmation re-reads current History under its storage lock and merges
  records; favorites are then unioned under their own lock and filtered against a fresh authoritative History snapshot.
  Language, theme, currency, and sidebar choices replace current preferences only after this confirmation, with the
  existing same-page/cross-tab events applied for each successful write.
- Browser storage cannot atomically commit six independent localStorage keys. Restore therefore avoids a rollback that
  could erase concurrent edits, retains every successful section, and reports the exact failed sections instead of
  claiming all-or-nothing success. Unknown History schemas are preserved, and a schema/record change between preview or
  the two key locks cannot write orphaned favorites.
- Pure and Settings tests cover malformed/version/size/count boundaries, normalization, History merge, favorite union,
  first-render preference export, confirmation, provider/storage failures, and cross-lock replacement. The Playwright
  workflow downloads the real JSON, changes all persisted state, uploads the same file, and checks the restored UI,
  storage contract, excluded keys, console, and Axe baseline.

### Restore Follow-up: URL Cardinality and Format Boundaries

- Generated share links were capped at 4,000 characters, but inbound parameters had no equivalent pre-parse bound.
  JSON string arrays could also contain arbitrary cardinality. Shared restore now rejects oversized values before
  numeric/string assignment or `JSON.parse` and caps JSON/legacy arrays at the 120-flow application limit.
- A `json:` value with valid JSON of the wrong shape previously fell through to the legacy pipe parser and became a
  string array. The explicit format prefix now fails closed for malformed JSON, objects, mixed arrays, and null.
- Restore assignment uses own data properties, so special keys do not invoke `Object.prototype` setters. Internal
  defaults do not currently contain attacker-controlled keys, but the shared helper now preserves that invariant for
  future consumers.
- Property coverage round-trips representative state for all nine calculators and 500 seeded delimiter/escaping
  arrays, while browser coverage proves malformed and oversized Cash Flow links remain bounded. Versioned history
  tests also cover every calculator page ID.
- URL-backed forms keep a latest-requested state snapshot between asynchronous Next.js router commits. Consecutive
  field edits and a full-state restore followed immediately by an edit merge against that snapshot; an observed URL
  change still replaces it so browser navigation and external links remain authoritative.

### CI Follow-up: Parallel Gates and Artifact Reuse

- The original workflow serialized formatting, type checking, linting, unit tests, four production builds, three browser
  suites, and audit in one job. A local warm-dependency profile measured about 70 seconds before browser work, with
  builds accounting for 28.4 seconds each and unit/lint gates accounting for another 34.4 seconds.
- Quality checks, development-server browser workflows, and root/base-path production verification now run as
  independent jobs. The production matrix builds each topology once and verifies static references, PWA metadata,
  security headers, route budgets, installation, offline navigation, and update activation against that exact output.
- Explicit `PWA_SKIP_BUILD=1` artifact reuse is covered by a config test; local PWA commands still build by default.
  Root-path PWA verification against a prebuilt artifact fell from the previously recorded 38.2 seconds to 9.8 seconds.
- The translation literal-call audit reads its sorted source set concurrently and parses complete parent-free
  TypeScript ASTs in deterministic order. This removes sequential I/O sensitivity under full-suite worker contention
  without weakening source coverage, raising the timeout, or replacing syntax-aware analysis with regular expressions.
- Both Playwright config families share a tested browser resolver. Explicit paths fail fast, an installed pinned
  browser remains the default, CI never substitutes system software, and only local runs without the bundle use a
  deterministic stable Chrome-then-Edge fallback across supported desktop platforms.
- Next.js compilation caches are isolated by deployment target and lockfile/source hashes. Playwright screenshots and
  traces are now uploaded on failure with seven-day retention instead of remaining inaccessible on an ephemeral runner.

### CSP Follow-up: Static Per-Document Content Hashes

- The exported site contained 48 globally unique inline script bodies. A single hash allowlist required about 2,615
  characters, exceeding Cloudflare Pages' documented 2,000-character `_headers` line limit. Route-specific header
  rules would not reliably protect an arbitrary request URL served with the static 404 document.
- Every HTML document contains exactly six inline scripts, so the build now injects a roughly 370-character
  `script-src` meta policy with exact SHA-256 hashes before any script. This document policy intersects with the host
  header CSP and therefore removes the effective script `unsafe-inline` allowance without relying on route matching.
- Blob permission is scoped to `worker-src`; the stricter document policy does not allow blob-backed scripts.
- A fixed nonce would be public and reusable in a static export; a secure per-response nonce requires a runtime server
  that this deployment model intentionally does not have. Build-time content hashes are the appropriate static model.
- Static validation recomputes every hash and rejects missing, duplicate, late, stale, or element-level
  `unsafe-inline` meta policies. Browser coverage injects unlisted script and style elements, requires CSP violations,
  and then exercises normal hydration and PWA flows.
- The export now has 35 static style blocks: 19 framework/component blocks plus one base-path-aware workspace-visual
  configuration in each of 16 documents. Each is covered by its document's exact `style-src-elem` hashes. Sonner also
  inserts an empty style element and then a deterministic package CSS string during client startup; the generator
  extracts and hashes those exact sources so dependency updates cannot silently leave a stale constant.
- Exported style attributes fell from 121 to 80. Workspace URL variables moved from body attributes into the hashed
  configuration block, bond heatmap colors became nine static light/dark levels, and fixed Sonner theme variables moved
  into the stylesheet. Remaining attributes are runtime-mutated Radix, chart, and layout values. The document policy
  isolates their compatibility exception to `style-src-attr 'unsafe-inline'`; scripts and unlisted style elements do
  not inherit it. No inline event-handler attributes were found.

### Risk Follow-up: Deterministic Stress Scenarios

- Normal VaR/CVaR previously stood alone even though the model guide warned that normal tails can materially understate
  stress losses. The page now shows separate 5%, 10%, and 20% aggregate-value declines with deterministic loss,
  remaining value, and loss-to-VaR comparisons.
- Scenario math is independent of volatility, horizon, and confidence and assigns no occurrence probability. Labels and
  bilingual disclosure avoid historical-event names or predictive framing that would imply asset-specific calibration.
- Stress results are included in result sharing plus structured CSV/JSON/PDF output while the primary history record
  remains VaR. The model guide states that scenarios do not reprice holdings or model nonlinear exposure, correlation
  breakdown, margin, liquidity, market impact, or recovery.
- A mobile visual review found that the table's min-content width expanded the parent grid beyond 390px. Explicit
  `min-w-0` constraints now keep document overflow at zero while preserving a local table scroller, enforced in
  Playwright.
- Eight simultaneous local Axe workers exhausted the 30-second test budget without reporting violations. Local browser
  tests now cap at two workers; all 23 workflows pass, while CI retains its existing deterministic single worker.

### Unit and Report Follow-up: Display Labels Without Raw-Data Loss

- All eleven result-action call sites were audited across nine calculators. Human reports previously exposed internal
  keys and ambiguous values such as `type: 0`, `confidence: 0.99`, or `rate: 5`, even when the UI showed localized
  enum choices or explicit percent/year/trading-day units.
- Result actions now require an input-label map whenever inputs are supplied. Optional display inputs translate enum and
  confidence values, while the original state remains separate. This requirement is a TypeScript union, so future
  report call sites cannot silently omit labels.
- Export schema v2 carries localized `report.inputs`, canonical `report.rawInputs`, display-rounded `report.results`,
  and raw-precision `data`. CSV mirrors both `input.*` and `rawInput.*` columns. This preserves machine consumers while
  making copied text, Markdown, CSV context, and JSON reports understandable to users.
- A catalog contract checks percentage and time-unit markers on all relevant bilingual input labels. It found and fixed
  the Portfolio risk-free-rate label, which displayed a percent value but named only “Risk-Free Rate”.
- Implied volatility was shown as 20.00% in the page but exported/shared as 20.0000%. Human report precision now matches
  the visible two-decimal result; JSON `data.impliedVolatility` continues to carry the raw decimal value.

### Interaction Follow-up: Share and Export Failure Recovery

- The shared clipboard helper previously stopped after a denied `navigator.clipboard.writeText()` call even though its
  legacy copy path could still work. Permission or implementation failures now fall back to `execCommand("copy")`,
  always remove the temporary textarea, and restore the element that held focus before the fallback.
- Native sharing now distinguishes the expected `AbortError` cancellation from permission, payload, and platform
  failures. Cancellation remains silent; other failures are logged and show a bilingual message that directs users to
  the still-available link and text copy actions.
- CSV and JSON download exceptions already stayed inside the export hook, and print state already used `finally`.
  Focused tests now prove repeated object-URL failures remain retryable, while a browser workflow covers denied share
  and clipboard permissions, successful clipboard fallback, two CSV retries, and a missing print target without a
  stuck disabled Export control.

### Deployment Follow-up: Static Artifact Contract

- A build succeeding did not previously prove that precache entries, route HTML, internal asset references, base-path
  prefixes, PWA metadata, and host cache policies still agreed. `npm run static:check` now validates that complete
  emitted contract rather than relying on manual inspection.
- Precache metadata is evaluated in an isolated, time-bounded VM and tied to `.next/BUILD_ID`. Declared assets and
  routes must exist, exported route indexes and precache routes must match in both directions, mutable worker metadata
  must stay out of precache, and duplicate entries fail the gate.
- Every exported document's internal `href` and `src` must resolve to an emitted file or route. A dedicated CI build
  with `NEXT_PUBLIC_BASE_PATH=/calc` additionally ensures absolute references remain under `/calc` while the PWA
  manifest keeps its install identity, start URL, and scope relative. Manifest validation also requires supported
  install metadata, exported 192/512 PNG targets, and scope-contained HTML start/shortcut routes; ordinary files and
  base-path escapes cannot pass as navigation targets.
- `public/_headers` remains the canonical root template, while the build rewrites every path selector into the final
  `out/_headers` deployment scope. The checker requires the scoped global CSP/referrer/MIME/framing/permissions block,
  HTML/service-worker metadata revalidation, and immutable hashed assets; a `/calc` artifact containing any known
  unscoped root rule now fails automation.

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

### Internationalization Follow-up: Key and Route Integrity

- English and Chinese objects already shared a structural TypeScript type, but translation lookup still accepted any
  string. A misspelled `t("...")` call therefore compiled and rendered its internal key to users. `t`, navigation
  configuration, and dynamic Help FAQ keys now use the generated 537-member `TranslationKey` union.
- Runtime-oriented tests flatten both catalogs, require identical non-empty leaf sets, and use the TypeScript parser
  to resolve more than 250 distinct literal lookup calls with source locations. This complements compiler checks for
  dynamic typed containers and catches JavaScript/source-scanning gaps.
- Route coverage now derives checked-in `src/app/*/page.tsx` routes and compares them with root plus `NAV_ITEMS`.
  Every user route must be represented exactly once and every desktop/mobile label and description must resolve in
  both languages.

### Prioritized Adjustment List

#### P0

No P0 findings were identified.

#### P1 - fixed

- Numeric input integrity: the shared parser previously removed commas, spaces, and underscores wherever they
  appeared. Malformed values such as `1,2,3` or `1 2` could therefore be silently changed into a different amount.
  Separators must now form consistent three-digit groups; malformed and mixed grouping is rejected.
- Black-Scholes no-arbitrage bounds: the normal-CDF approximation could produce a slightly negative price for an
  extreme deep-out-of-the-money contract. Stochastic prices are now constrained to the theoretical call/put lower
  and upper bounds, with an extreme negative-rate regression test. Log-moneyness is computed as `log(S) - log(K)` so
  positive finite values remain usable when `S / K` underflows or overflows. Gamma is evaluated in the log domain,
  retaining representable tail sensitivities even when the normal density and direct denominator each underflow.

#### P2 - fixed

- TVM validation contract: the math engine and shared rate domain support rates above `-100%`, but the page rejected
  every negative rate. The UI, localized validation, range hint, and schema now share the same exclusive lower bound.
- Cross-tab settings: language, theme, currency formatting, and the Settings currency selection react to browser
  `storage` events. Persisted values outside the supported theme/language/currency sets are removed and fall back to
  system, English, and USD rather than remaining as permanent corrupt state. Theme and language setters also expose
  failed writes to every Settings/header entry point, so the in-session choice remains active while a localized toast
  explains that it may be lost after refresh. The desktop sidebar follows the same contract: a blocked collapse-state
  write uses an explicit session override, remains retryable, and yields to the next successful local or cross-tab
  preference update. Separate storage-operation copy is used when currency changes, cross-page restores, history clear,
  or imports do not complete (or a multi-key clear may only partially complete), so feedback never claims an unapplied
  operation is active.
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

- Financial calculation boundaries and numeric stability: TVM, RATE/IRR/NPV, bond, WACC/DDM, Black-Scholes, risk, PPP,
  and amortization paths now reject invalid domains and non-finite results. TVM cash-flow fields correctly accept
  negative values. NPV and IRR short-circuit exact-zero discounted terms so zero-padding cannot introduce `NaN` near
  singular rates, while unrepresentable nonzero terms remain rejected. Integer-period RATE equations with more than
  one polynomial sign change now surface a conditional multiple-root warning without changing the solver's compatible
  default result or implying that every mathematical root is economically useful.
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
- `out/_headers` uses a common deployment-file convention, not a cross-host standard. Hosts that do not support that
  file must reproduce its generated, base-path-scoped response policies in their own configuration. The generated HTML
  independently restricts inline scripts and style elements by hash, while dynamic style attributes remain a
  documented compatibility boundary for component and chart rendering.
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
