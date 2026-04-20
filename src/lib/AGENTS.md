# LIBRARY GUIDE

## OVERVIEW
`src/lib/` holds shared business logic, validation, storage, i18n, navigation config, and formatting utilities.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Financial formulas | `finance-math.ts` | Core engine; highest correctness risk |
| Formula tests | `finance-math.test.ts` | Start here after formula edits |
| Localization/provider logic | `i18n.tsx` | Large file; read targeted sections |
| Navigation model | `nav-config.ts` | Landing page + shell structure |
| Persistence helpers | `storage.ts`, `storage.test.ts` | Client-safe local/session storage |
| Shared class/format helpers | `utils.ts`, `constants.ts` | `cn`, locale-aware formatting, shared constants |
| Export/sanitization | `pdf-export.ts`, `sanitize.ts` | Output and safety helpers |
| Input validation | `validation.ts`, `input-utils.ts` | Shared parsing/validation rules |

## CONVENTIONS
- Keep `src/lib/` mostly framework-light; route/page concerns stay outside.
- Reuse `Finance` methods instead of re-implementing formulas inside pages or components.
- Put new reusable helpers here only if they are cross-route and not UI-specific.
- Use `@/lib/...` imports from consumers.
- Add or update colocated tests when changing math, storage, or parsing behavior.

## ANTI-PATTERNS
- Do not duplicate financial formulas in route pages or hooks.
- Do not bypass `storage.ts` helpers with raw `localStorage`/`sessionStorage` in shared flows.
- Do not bulk-edit `i18n.tsx` blindly; inspect the needed section only.
- Do not mix presentation concerns into pure utilities.

## UNIQUE STYLES
- `Finance` is a namespace-style object rather than many scattered exported functions.
- Locale-aware formatting helpers derive language from persisted app state.
- Storage helpers intentionally return safe fallbacks instead of throwing.

## TESTING NOTES
- For formula changes, start with `npx vitest run src/lib/finance-math.test.ts`.
- Broader verification: `npx tsc --noEmit`, `npm run test`, `npm run build`.
