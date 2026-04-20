# COMPONENTS GUIDE

## OVERVIEW
`src/components/` contains the app shell, shared feature widgets, client-only integrations, and shadcn/ui primitives.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| App shell | `layout/app-layout.tsx`, `layout/header.tsx`, `layout/sidebar.tsx` | Global chrome and navigation |
| Theme boundary | `theme-provider.tsx` | Thin wrapper over `next-themes` |
| Error handling | `error-boundary.tsx` | Shared runtime fallback UI |
| Service worker bootstrap | `service-worker-registration.tsx` | Client-only registration of `public/sw.js` |
| Motion/page transitions | `motion-wrappers.tsx` | Shared animation layer |
| History/export/share UI | `history-panel.tsx`, `export-menu.tsx`, `share-dialog.tsx` | Cross-route workflow components |
| Primitive UI kit | `ui/` | shadcn-generated components |

## CONVENTIONS
- Keep shared components route-agnostic unless the file is clearly feature-specific.
- Client-only browser integrations must start with a client boundary (`"use client"`) where needed.
- Use `@/components/...` and `@/components/ui/...` imports.
- Prefer existing primitives in `ui/` over hand-rolled duplicates.
- Shell/layout changes should preserve `src/app/layout.tsx` provider order and static-export constraints.

## ANTI-PATTERNS
- Do not move browser APIs into server components.
- Do not treat `src/components/ui/` as freeform redesign territory; it is generator-owned baseline code.
- Do not duplicate shell/navigation logic across pages when `AppLayout`, `Header`, or `Sidebar` already cover it.
- Do not replace manual SW registration with hidden framework magic in this app.

## UNIQUE STYLES
- UI primitives use `data-slot` patterns and shared `cn()` class composition.
- The shell favors config-driven navigation plus responsive desktop/mobile chrome.
- Several shared widgets have paired tests (`*.test.tsx`) directly beside the component.

## TESTING NOTES
- When changing shared interaction components, run the relevant colocated Vitest tests if present, then the full suite if impact is broad.
