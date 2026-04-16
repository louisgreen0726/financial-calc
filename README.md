# Financial Calc

English | [中文](README_zh.md)

A bilingual financial calculator built with Next.js 16, React 19, and TypeScript.

It includes practical tools for time value of money, cash flow analysis, equity valuation, bonds, portfolio simulation, options pricing, risk metrics, loans, and macro / FX calculations.

## Highlights

- 9 calculator modules
- English / Chinese UI
- Static-export friendly Next.js app
- Calculation history with restore
- CSV / JSON / PDF export
- Shareable URL state on selected pages
- Unit and interaction tests with Vitest

## Modules

- TVM: PV / FV / PMT / NPER / RATE
- Cash Flow: NPV / IRR / payback period
- Equity: CAPM / WACC / DDM
- Bonds: price / duration / convexity / yield curve
- Portfolio: Monte Carlo frontier simulation
- Options: Black-Scholes + Greeks
- Risk: VaR / CVaR distribution view
- Loans: CPM / CAM amortization
- Macro: inflation / purchasing power / real rate / CPI / PPP

## Tech Stack

- Next.js 16 (App Router, static export)
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui
- Recharts
- Framer Motion
- Vitest + Testing Library

## Getting Started

Requirements:

- Node.js >= 20
- npm

Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm run test
npx tsc --noEmit
npm run format
```

## Build Notes

- `next.config.ts` uses `output: "export"`.
- Production build output is generated into `out/`.
- This project is designed to be deployed as a static site.
- PWA behavior is handled manually via `public/sw.js` and `src/components/service-worker-registration.tsx`.

## Project Structure

```text
financial-calc/
├─ public/                # Static assets and service worker
├─ src/
│  ├─ app/                # App Router pages
│  ├─ components/         # UI and shared components
│  ├─ hooks/              # Custom hooks
│  ├─ lib/                # Core math, storage, i18n, utils
│  └─ workers/            # Monte Carlo worker
├─ README.md
├─ README_zh.md
└─ package.json
```

## Verification

Current recommended checks before pushing:

```bash
npx tsc --noEmit
npm run test
npm run build
```

## License

MIT
