# Financial Command Center

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Cloudflare_Pages-orange?style=flat-square&logo=cloudflarepages)](https://financial-calc.pages.dev/)
[![Tests](https://img.shields.io/badge/Tests-53+-success?style=flat-square&logo=vitest)](.)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

**🌐 Language / 语言**: [English](#financial-command-center) | [中文](README_zh.md)

**专业级金融建模、估值与风险分析平台 | Professional-grade financial modeling, valuation, and risk analysis tools**

A comprehensive, bilingual (English/Chinese) financial calculator web application featuring 10 specialized modules with 35+ financial formulas. Built with modern web technologies for precision, performance, and exceptional user experience.

---

## Features

### 10 Calculator Modules

#### 1. Time Value of Money (TVM) - 货币时间价值
- Present Value (PV), Future Value (FV), Payment (PMT), Rate, and Periods calculations
- Ordinary annuity and annuity due support
- Real-time parameter validation

#### 2. Cash Flow Analysis - 现金流分析
- Net Present Value (NPV) calculations
- Internal Rate of Return (IRR)
- Payback period analysis
- Interactive cash flow visualization

#### 3. Stock Valuation - 股票估值
- **CAPM** (Capital Asset Pricing Model): Expected return calculations
- **WACC** (Weighted Average Cost of Capital): Comprehensive cost of capital analysis
- **DDM** (Dividend Discount Model): Gordon Growth Model for stable growth companies

#### 4. Portfolio Optimization - 投资组合优化
- Modern Portfolio Theory (MPT) implementation
- Monte Carlo simulation for efficient frontier
- Sharpe Ratio optimization
- Maximum Sharpe and minimum volatility portfolio identification

#### 5. Bonds & Fixed Income - 债券与固定收益
- Bond price valuation (fair price, discount/premium detection)
- Yield to Maturity (YTM) calculations
- Macaulay Duration and Modified Duration
- Convexity analysis
- Price-Yield curve visualization
- Multiple payment frequencies (Annual, Semi-annual, Quarterly, Monthly)

#### 6. Options Pricing - 期权定价
- Black-Scholes-Merton (BSM) model for European options
- Call and Put option pricing
- Complete Greeks analysis:
  - Delta (Δ): Price sensitivity
  - Gamma (Γ): Delta sensitivity
  - Theta (Θ): Time decay
  - Vega (ν): Volatility sensitivity
  - Rho (ρ): Interest rate sensitivity
- Payoff diagram visualization

#### 7. Risk Management - 风险管理
- Value at Risk (VaR) calculations
- Conditional VaR (CVaR) / Expected Shortfall
- Monte Carlo simulation support
- Return distribution visualization

#### 8. Loans & Mortgages - 贷款与按揭
- Two repayment methods:
  - **CPM** (Constant Payment Mortgage): Fixed monthly payments
  - **CAM** (Constant Amortization Mortgage): Fixed principal payments
- Complete amortization schedules
- Total interest and cost breakdown
- Balance projection charts

#### 9. Macroeconomics & FX - 宏观经济与外汇
- **Inflation Rate**: Compound annual inflation calculations
- **Purchasing Power**: Inflation impact on money value
- **Real Interest Rate**: Fisher Equation implementation
- **CPI Adjustment**: Consumer Price Index-based adjustments
- **PPP Exchange Rate**: Purchasing Power Parity calculations

#### 10. Derivatives & Risk - 衍生品与风险
- Advanced risk metrics
- Monte Carlo simulation capabilities

---

## Technology Stack

### Core Framework
- **Next.js 16** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript 5** - Type-safe development with strict mode

### Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - Modern, accessible UI components
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icon library

### Calculations & Charts
- **Math.js** - Advanced mathematical operations
- **Recharts** - Responsive charting library

### Form Handling & Validation
- **React Hook Form** - Performant form management
- **Zod** - TypeScript-first schema validation

### Development Tools
- **ESLint** - Code linting with Next.js config
- **Prettier** - Code formatting
- **Vitest** - Unit testing framework
- **Husky** - Git hooks for quality control

---

## Quick Start

🚀 **Live Demo**: [https://financial-calc.pages.dev/](https://financial-calc.pages.dev/)

### Prerequisites
- Node.js >= 20
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd financial-calc

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build for Production

```bash
# Create production build
npm run build

# Serve production build
npm start
```

---

## Project Structure

```
financial-calc/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── globals.css         # Global styles + theme variables
│   │   ├── page.tsx            # Home page / Dashboard
│   │   ├── tvm/                # TVM Calculator
│   │   ├── cash-flow/          # Cash Flow Analysis
│   │   ├── equity/             # Stock Valuation
│   │   ├── bonds/              # Bond Calculator
│   │   ├── portfolio/          # Portfolio Optimization
│   │   ├── options/            # Options Pricing
│   │   ├── risk/               # Risk Management
│   │   ├── loans/              # Loan Calculator
│   │   └── macro/              # Macroeconomics
│   ├── components/
│   │   ├── ui/                 # Shadcn UI components (auto-generated)
│   │   └── layout/             # App layout components
│   │       ├── app-layout.tsx
│   │       ├── sidebar.tsx
│   │       └── header.tsx
│   └── lib/
│       ├── finance-math.ts     # Core financial formulas (35+)
│       ├── finance-math.test.ts # Unit tests (53+)
│       ├── i18n.tsx            # Internationalization (EN/ZH)
│       ├── nav-config.ts       # Navigation configuration
│       ├── utils.ts            # Utility functions
│       └── validation.ts       # Zod validation schemas
├── public/                     # Static assets
├── package.json
├── next.config.ts              # Next.js configuration (static export)
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Vitest configuration
├── eslint.config.mjs           # ESLint configuration
└── README.md                   # This file
```

---

## Available API / Functions

### Core Financial Library (`finance-math.ts`)

#### Time Value of Money
```typescript
Finance.pv(rate, nper, pmt, fv?, type?)        // Present Value
Finance.fv(rate, nper, pmt, pv, type?)        // Future Value
Finance.pmt(rate, nper, pv, fv?, type?)       // Payment
Finance.nper(rate, pmt, pv, fv?, type?)       // Number of Periods
Finance.rate(nper, pmt, pv, fv?, type?, guess?) // Interest Rate
```

#### Cash Flow Analysis
```typescript
Finance.npv(rate, values)                     // Net Present Value
Finance.irr(values, guess?)                   // Internal Rate of Return
Finance.effectiveRate(nominalRate, periodsPerYear) // Effective Annual Rate
```

#### Bond Calculations
```typescript
Finance.bondPrice(faceValue, couponRate, years, ytm, frequency?) // Bond Price
Finance.bondDuration(faceValue, couponRate, years, ytm, frequency?) // Duration
Finance.bondYield(price, faceValue, couponRate, years, frequency?) // Yield to Maturity
Finance.bondConvexity(faceValue, couponRate, years, ytm, frequency?) // Convexity
```

#### Options Pricing (Black-Scholes)
```typescript
Finance.blackScholes(S, K, T, r, sigma, type) // Option Price
Finance.greeks(S, K, T, r, sigma, type)       // All Greeks (Delta, Gamma, Theta, Vega, Rho)
```

#### Portfolio Theory
```typescript
Finance.portfolioReturn(weights, returns)     // Weighted Portfolio Return
Finance.portfolioRisk(weights, covMatrix)     // Portfolio Standard Deviation
Finance.sharpeRatio(portfolioReturn, rf, portfolioRisk) // Sharpe Ratio
```

#### Risk Management
```typescript
Finance.variance(values)                      // Statistical Variance
Finance.stdDev(values)                        // Standard Deviation
Finance.correlation(x, y)                     // Pearson Correlation
```

#### Loan Calculations
```typescript
Finance.amortizationSchedule(principal, rate, nper, method?) // Amortization Table
Finance.totalInterest(schedule)               // Total Interest Paid
Finance.remainingBalance(schedule, period)    // Balance at Period
```

#### Equity Valuation
```typescript
Finance.capm(rf, beta, rm)                    // CAPM Expected Return
Finance.wacc(equityValue, debtValue, costEquity, costDebt, taxRate) // WACC
Finance.ddm(d1, requiredReturn, growthRate)   // Dividend Discount Model
```

#### Macroeconomics
```typescript
Finance.inflationRate(startPrice, endPrice, years)      // Inflation Rate
Finance.purchasingPower(amount, inflationRate, years)   // Future Purchasing Power
Finance.realInterestRate(nominalRate, inflationRate)    // Real Rate (Fisher)
Finance.cpiAdjustment(amount, fromCPI, toCPI)           // CPI Adjustment
Finance.pppExchangeRate(domesticPrice, foreignPrice)    // PPP Rate
```

### Utility Functions (`utils.ts`)

```typescript
formatCurrency(value, currency?)              // Format as currency
formatNumber(value, decimals?, prefix?)       // Format with separators
cn(...inputs)                                 // Conditional class names (clsx + tailwind-merge)
```

### Internationalization (`i18n.tsx`)

```typescript
const { t, language, setLanguage } = useLanguage()
t("nav.core.title")                           // Access translations
t("tvm.fv")                                   // Nested keys supported
```

**Supported Languages:** English (`en`), Chinese (`zh`)

---

## Testing

This project includes comprehensive unit tests for all financial calculations.

### Run Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run src/lib/finance-math.test.ts

# Run tests matching pattern
npx vitest run -t "pv function"
```

### Test Coverage

- **53+ unit tests** covering all financial formulas
- **Edge case handling** (zero rates, negative values, NaN inputs)
- **Precision validation** (typically 2 decimal places)
- **Error handling** (invalid inputs, boundary conditions)

### Example Test

```typescript
import { describe, it, expect } from "vitest"
import { Finance } from "@/lib/finance-math"

describe("Finance", () => {
  describe("pv", () => {
    it("calculates present value with positive rate", () => {
      const result = Finance.pv(0.05, 10, 0, 1000)
      expect(result).toBeCloseTo(-613.91, 2)
    })
  })
})
```

---

## Development Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build (static export to out/)
npm run start            # Serve production build

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run format:check     # Check formatting
npx tsc --noEmit         # Type-check without emitting

# Testing
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode

# Git Hooks
npm run prepare          # Install Husky hooks
```

---

## Key Features

### Bilingual Support (English/中文)
- Complete UI localization
- All financial terminology translated
- Language preference persisted in localStorage
- Seamless language switching

### Real-time Validation
- Input validation with Zod schemas
- Error messages in both languages
- Visual feedback for invalid inputs
- Boundary condition checking

### Performance Optimizations
- Static site export for fast loading
- Web Workers for heavy calculations (Monte Carlo)
- Memoized calculations with `useMemo`
- Optimized re-renders with React 19

### Modern UI/UX
- Dark/Light theme support with next-themes
- Responsive design for all screen sizes
- Smooth animations with Framer Motion
- Accessible components (ARIA labels, keyboard navigation)
- Professional color scheme (Emerald primary)

### Type Safety
- Strict TypeScript configuration
- No `any` types
- Comprehensive type definitions
- Runtime validation with Zod

---

## Browser Compatibility

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Authors

**Created by: Antigravity × OpenCode**

This project was built with the help of [Google Antigravity](https://antigravity.google).

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

### Libraries & Tools
- [Next.js](https://nextjs.org/) - React framework
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Math.js](https://mathjs.org/) - Mathematics library
- [Recharts](https://recharts.org/) - Charting library
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Lucide](https://lucide.dev/) - Icon library
- [Vitest](https://vitest.dev/) - Testing framework
- [Zod](https://zod.dev/) - Schema validation

### Financial References
- Standard financial formulas from academic finance literature
- Black-Scholes model implementation
- Modern Portfolio Theory (Markowitz)
- Capital Asset Pricing Model (CAPM)

### Special Thanks
- The open-source community for maintaining these excellent libraries
- Financial mathematics textbooks and academic resources
- Contributors and testers who helped improve the application

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code follows the existing style and passes all tests.

---

## Support

For questions, issues, or feature requests, please open an issue on the GitHub repository.

---

<p align="center">
  <strong>Financial Command Center</strong><br>
  Professional-grade financial modeling made simple.
</p>

<p align="center">
  <a href="http://localhost:3000">Get Started →</a>
</p>