"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Calculator, Keyboard, BookOpen, Mail, ExternalLink, ChevronRight } from "lucide-react";

export default function HelpPage() {
  const faqs = [
    {
      q: "How does calculation history work?",
      a: "Calculation history is stored locally in your browser. Each time you perform a calculation, it's saved with timestamp and inputs. You can access history from the bottom-right corner of any calculator page, or from the dedicated History page.",
    },
    {
      q: "How do I export my calculations?",
      a: "Click the Export menu button to export in CSV, JSON, or PDF format. The CSV and JSON options will download your data immediately. PDF export captures the calculation results as a formatted document.",
    },
    {
      q: "How do I change between light and dark mode?",
      a: "Click the theme toggle button in the header. You can choose Light, Dark, or follow your system preference.",
    },
    {
      q: "How do I switch languages?",
      a: "Click the language button in the header to toggle between English and Chinese (中文).",
    },
    {
      q: "How do I use this on mobile?",
      a: "The app is fully responsive. On mobile devices, use the hamburger menu to access the sidebar navigation, and the bottom tab bar for quick access to Home, Calculator, History, Settings, and Help.",
    },
    {
      q: "Is my data stored on servers?",
      a: "No. All calculation history is stored locally in your browser's localStorage. No data is sent to any server. You can export or clear your history at any time from the Settings page.",
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <HelpCircle className="h-8 w-8" />
          Help & Support
        </h1>
        <p className="text-muted-foreground mt-2">Learn how to use FinCalc Pro</p>
      </div>

      {/* Quick Start */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>Get started with financial calculations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary font-bold shrink-0">1</div>
              <div>
                <h4 className="font-semibold">Choose a Calculator</h4>
                <p className="text-sm text-muted-foreground">
                  Select from TVM (Time Value of Money), Cash Flow, Equity Valuation, Portfolio Optimization, Bonds,
                  Options, Risk Metrics, Loans, or Macroeconomics.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary font-bold shrink-0">2</div>
              <div>
                <h4 className="font-semibold">Enter Your Parameters</h4>
                <p className="text-sm text-muted-foreground">
                  Fill in the required financial parameters like interest rate, periods, cash flows, etc.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary font-bold shrink-0">3</div>
              <div>
                <h4 className="font-semibold">Calculate & View Results</h4>
                <p className="text-sm text-muted-foreground">
                  Click Calculate to see results. Export in CSV, JSON, or PDF formats.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculators Overview */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Available Calculators
          </CardTitle>
          <CardDescription>Overview of each financial tool</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">TVM Calculator</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Time Value of Money - Calculate PV, FV, PMT, NPER, and interest rate.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">Cash Flow Analysis</h4>
              <p className="text-sm text-muted-foreground mt-1">
                NPV, IRR, Payback Period, and ROI calculations for investment projects.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">Stock Valuation</h4>
              <p className="text-sm text-muted-foreground mt-1">
                DDM (Dividend Discount Model), CAPM, WACC, and financial ratios.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">Portfolio Optimization</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Monte Carlo simulation for efficient frontier and optimal portfolios.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">Bonds & Fixed Income</h4>
              <p className="text-sm text-muted-foreground mt-1">
                YTM, Duration, Convexity, and bond pricing calculations.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">Options Pricing</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Black-Scholes option pricing with Greeks (Delta, Gamma, Theta, Vega, Rho).
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">Risk Metrics</h4>
              <p className="text-sm text-muted-foreground mt-1">
                VaR (Value at Risk) and CVaR (Conditional VaR) calculations.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold">Loan Calculator</h4>
              <p className="text-sm text-muted-foreground mt-1">
                EMI calculation with amortization schedules (CPM and CAM methods).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card">
                <h4 className="font-semibold flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  {faq.q}
                </h4>
                <p className="text-sm text-muted-foreground mt-2 ml-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span>Show keyboard shortcuts</span>
              <kbd className="px-2 py-1 rounded bg-background text-sm font-mono">?</kbd>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span>Navigate to calculator</span>
              <div className="flex gap-1">
                <kbd className="px-2 py-1 rounded bg-background text-sm font-mono">1</kbd>
                <kbd className="px-2 py-1 rounded bg-background text-sm font-mono">2</kbd>
                <kbd className="px-2 py-1 rounded bg-background text-sm font-mono">...</kbd>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact & Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            For questions, bug reports, or feature requests, please visit our GitHub repository.
          </p>
          <a
            href="https://github.com/louisgreen0726/financial-calc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            github.com/louisgreen0726/financial-calc
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
