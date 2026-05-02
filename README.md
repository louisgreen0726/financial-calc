# Financial Calc

English | [中文](README_zh.md)

> [!IMPORTANT]
> **This project was generated entirely with AI using OpenCode.**
> It should be understood as an AI-generated software project rather than a hand-built production system authored line-by-line by a human developer.

> [!NOTE]
> The current codebase, documentation, UX refinements, validation flows, and deployment-oriented adjustments were produced through AI-driven iteration inside OpenCode.
> If you plan to use this repository in production, you should still perform your own code review, verification, security review, and business-domain validation.

Financial Calc is a bilingual, static-export-friendly financial calculator built with Next.js 16, React 19, and TypeScript.

It combines practical calculator workflows with a more polished app shell: mobile-first navigation, responsive disclosures for dense analysis screens, calculation history and restore flows, share/export actions, and offline-friendly service worker wiring.

## Current Project Status

The project is already usable as a multi-module financial analysis app, not just a component demo. The current focus areas that are already implemented include:

- responsive calculator UX across desktop and mobile
- bilingual English / Chinese interface
- explicit validation feedback on key calculator pages
- calculation history with cross-page restore
- CSV / JSON / PDF export
- shareable state on supported flows
- Monte Carlo portfolio simulation via worker + client fallback
- static-export deployment with manual service worker registration

## AI Generation Disclosure

- The repository was built through OpenCode-driven AI generation and iterative AI-assisted refinement.
- Architecture, UI structure, validation flows, documentation, and many implementation details were generated and revised by AI rather than authored manually from scratch.
- The project is useful as a working application, learning reference, and experimentation base, but it should still be reviewed with normal engineering standards before serious production use.

## Included Modules

### Core calculators

- **TVM** — PV / FV / PMT / NPER / RATE
- **Cash Flow** — NPV / IRR / payback period
- **Equity** — CAPM / WACC / DDM
- **Bonds** — price / duration / convexity / yield curve / sensitivity view
- **Portfolio** — Monte Carlo frontier simulation
- **Options** — Black-Scholes pricing + Greeks
- **Risk** — VaR / CVaR distribution view
- **Loans** — CPM / CAM amortization
- **Macro** — inflation / purchasing power / real rate / CPI / PPP

### Supporting pages

- **History** — saved calculation browsing and restore
- **Settings** — language, theme, display currency, and data-management controls
- **Help** — user guidance and supporting app information

## What Has Recently Improved

- mobile bottom navigation and app chrome were reworked for better access to all modules
- dense calculator pages now use more progressive disclosure on smaller screens
- equity, bonds, cash-flow, portfolio, and TVM flows now have stronger validation and clearer invalid-result states
- portfolio asset editing is more usable on mobile
- service worker behavior and registration flow were tightened for static deployment
- finance and service-worker related tests were expanded

## Tech Stack

- **Framework**: Next.js 16 App Router (`output: "export"`)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui, Radix UI
- **Charts / Motion**: Recharts, Framer Motion
- **Validation / Forms**: Zod, React Hook Form utilities where needed
- **Testing**: Vitest, Testing Library, jsdom
- **Offline / Export**: manual service worker, html2canvas, jsPDF

## Getting Started

### Requirements

- Node.js >= 20
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Useful Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run test
npm run build
npm run preview
npm run format
npm run format:check
```

## Recommended Verification Order

Before pushing changes, the current recommended verification path is:

```bash
npx tsc --noEmit
npm run test
npm run build
```

If you changed formatting-sensitive files, also run:

```bash
npm run format:check
```

## Build and Deployment Notes

- `next.config.ts` uses `output: "export"`
- static routes are emitted with trailing slashes for cleaner static-hosting behavior
- production output is generated into `out/`
- the app is intended for static hosting
- `npm run preview` / `npm start` serves the generated `out/` folder; `next start` is intentionally not used for this export-only app
- there is **no server-side API runtime assumption** for production use
- service worker behavior is manually wired through:
  - `public/sw.js`
  - `src/components/service-worker-registration.tsx`
- PWA behavior relies on the manual integration path; `next-pwa` is intentionally not installed

## Project Structure

```text
financial-calc/
├─ public/                # Static assets, manifest, service worker
├─ src/
│  ├─ app/                # App Router routes
│  ├─ components/         # Shared UI and feature components
│  ├─ hooks/              # State, history, export, URL, simulation hooks
│  ├─ lib/                # Finance math, validation, i18n, storage, utils
│  ├─ test/               # Test setup utilities
│  └─ workers/            # Monte Carlo worker
├─ README.md
├─ README_zh.md
└─ package.json
```

## Quality Notes

- the app currently passes typecheck, test, lint, format, and build verification
- production dependency audit currently reports no vulnerabilities

## License

MIT
