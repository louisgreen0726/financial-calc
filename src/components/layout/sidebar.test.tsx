import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Sidebar } from "@/components/layout/sidebar";

const translations: Record<string, string> = {
  "common.primaryNavigation": "Primary navigation",
  "history.noResults": "No matching calculators",
  "sidebar.edition": "Professional Edition",
  "sidebar.search": "Search calculators",
  "sidebar.version": "v0.5.0",
  "sidebar.workspace": "Financial workspace",
  "nav.core.title": "Core Financials",
  "nav.core.tvm.title": "TVM Calculator",
  "nav.core.tvm.desc": "Time Value of Money",
  "nav.core.cashFlow.title": "Cash Flow Analysis",
  "nav.core.cashFlow.desc": "NPV, IRR, and payback period",
  "nav.investing.title": "Investing",
  "nav.investing.equity.title": "Stock Valuation",
  "nav.investing.equity.desc": "DDM, CAPM, and WACC models",
  "nav.investing.portfolio.title": "Portfolio Optimization",
  "nav.investing.portfolio.desc": "Monte Carlo risk-return sampling",
  "nav.investing.bonds.title": "Bonds & Fixed Income",
  "nav.investing.bonds.desc": "Pricing, duration, and convexity",
  "nav.derivatives.title": "Derivatives & Risk",
  "nav.derivatives.options.title": "Options Pricing",
  "nav.derivatives.options.desc": "BSM pricing and implied volatility",
  "nav.derivatives.risk.title": "Risk Management",
  "nav.derivatives.risk.desc": "VaR and CVaR distribution view",
  "nav.banking.title": "Banking & Macro",
  "nav.banking.loans.title": "Loans & Mortgages",
  "nav.banking.loans.desc": "CPM/CAM amortization schedules",
  "nav.banking.macro.title": "Macro & FX",
  "nav.banking.macro.desc": "Inflation and purchasing power",
  "nav.more.title": "More",
  "history.title": "History",
  "nav.more.history.desc": "View calculation history",
  "settings.title": "Settings",
  "nav.more.settings.desc": "App preferences and data",
  "help.title": "Help",
  "nav.more.help.desc": "Guide and support",
};

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (key: string) => translations[key] ?? key }),
}));

describe("Sidebar search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds calculators by localized description terms", () => {
    render(<Sidebar />);

    fireEvent.change(screen.getByRole("textbox", { name: "Search calculators" }), {
      target: { value: "wacc valuation" },
    });

    expect(screen.getByRole("link", { name: "Stock Valuation" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Portfolio Optimization" })).not.toBeInTheDocument();
    expect(screen.queryByText("No matching calculators")).not.toBeInTheDocument();
  });

  it("uses a section name to reveal the tools in that section", () => {
    render(<Sidebar />);

    fireEvent.change(screen.getByRole("textbox", { name: "Search calculators" }), {
      target: { value: "investing" },
    });

    expect(screen.getByRole("link", { name: "Stock Valuation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Portfolio Optimization" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bonds & Fixed Income" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "TVM Calculator" })).not.toBeInTheDocument();
  });

  it("requires every search term and exposes the existing empty state", () => {
    render(<Sidebar />);

    const search = screen.getByRole("textbox", { name: "Search calculators" });
    fireEvent.change(search, { target: { value: "risk monte" } });
    expect(screen.getByRole("link", { name: "Portfolio Optimization" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Risk Management" })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "mortgage convexity" } });
    expect(screen.getByText("No matching calculators")).toBeInTheDocument();
  });
});
