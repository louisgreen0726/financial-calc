# HOOKS GUIDE

## OVERVIEW
`src/hooks/` holds client-side state and workflow hooks for history, export, locale formatting, service worker status, URL state, validation, and Monte Carlo execution.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| History persistence | `use-calculation-history.ts`, `use-history-recorder.ts` | Couples page state to storage/history UX |
| Export flows | `use-export.ts` | Cross-feature export orchestration |
| URL/state sync | `use-url-state.ts` | Route state hydration/share support |
| Validation | `use-validation.ts`, `use-validation.test.tsx` | Client input rules and UX feedback |
| Local storage wrapper | `use-local-storage.ts` | Hook-level persistence abstraction |
| Monte Carlo orchestration | `use-monte-carlo-simulation.ts` | Worker lifecycle + fallback path |
| SW integration | `use-service-worker.ts` | Client-side PWA status hooks |

## CONVENTIONS
- Hooks here are client-only by nature; keep browser APIs inside guarded client flows.
- Prefer composing existing lib helpers (`storage.ts`, validation helpers) over re-encoding logic in hooks.
- Keep hook APIs focused on state/workflow, not presentational markup.
- Use colocated tests for behavior-heavy hooks when adding branches or failure paths.

## ANTI-PATTERNS
- Do not embed raw financial formulas in hooks; call `@/lib/finance-math`.
- Do not let worker or storage failures crash the UI; preserve the existing graceful fallback style.
- Do not create one-off page hooks when a shared hook can absorb the concern cleanly.
- Do not access browser APIs without `"use client"` context and SSR guards.

## UNIQUE STYLES
- Hooks often return operational state plus imperative helpers (`run`, `cancel`, `clear`, `addToHistory`).
- Monte Carlo flow prefers worker execution but intentionally falls back to in-process computation.
- Persistence-oriented hooks mirror the app’s silent-fallback storage helpers rather than surfacing noisy exceptions.

## TESTING NOTES
- Validation changes should hit `use-validation.test.tsx`.
- For simulation changes, inspect both the hook and `src/workers/monte-carlo.worker.ts` together.
