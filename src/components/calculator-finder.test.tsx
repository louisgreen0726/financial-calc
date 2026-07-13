import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CalculatorFinder } from "@/components/calculator-finder";

const translations: Record<string, string> = {
  "common.close": "Close",
  "history.noResults": "No matching calculators",
  "sidebar.mobileDescription": "Search or browse the full calculator directory.",
  "sidebar.search": "Search calculators",
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

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({ t: (key: string) => translations[key] ?? key }),
}));

describe("CalculatorFinder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens an accessible dialog and focuses the search field", async () => {
    render(<CalculatorFinder />);

    const trigger = screen.getByRole("button", { name: "Search calculators" });
    expect(trigger).toHaveAttribute("title", "Search calculators");
    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Search calculators" });
    expect(dialog).toHaveAccessibleDescription("Search or browse the full calculator directory.");
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
    await waitFor(() => expect(within(dialog).getByRole("searchbox", { name: "Search calculators" })).toHaveFocus());
  });

  it("groups localized links with their titles and descriptions", async () => {
    render(<CalculatorFinder />);
    fireEvent.click(screen.getByRole("button", { name: "Search calculators" }));

    const dialog = await screen.findByRole("dialog", { name: "Search calculators" });
    expect(within(dialog).getByRole("heading", { name: "Investing" })).toBeInTheDocument();
    const portfolioLink = within(dialog).getByRole("link", { name: /Portfolio Optimization/ });
    expect(portfolioLink).toHaveAttribute("href", "/portfolio");
    expect(portfolioLink).toHaveTextContent("Monte Carlo risk-return sampling");

    portfolioLink.focus();
    expect(portfolioLink).toHaveFocus();
  });

  it("requires every localized search term to match the same result", async () => {
    render(<CalculatorFinder />);
    fireEvent.click(screen.getByRole("button", { name: "Search calculators" }));

    const search = await screen.findByRole("searchbox", { name: "Search calculators" });
    fireEvent.change(search, { target: { value: "investing monte" } });

    expect(screen.getByRole("link", { name: /Portfolio Optimization/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Stock Valuation/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Risk Management/ })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "mortgage convexity" } });
    expect(screen.getByRole("status")).toHaveTextContent("No matching calculators");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("closes on Escape and restores focus to its trigger", async () => {
    render(<CalculatorFinder />);
    const trigger = screen.getByRole("button", { name: "Search calculators" });
    fireEvent.click(trigger);
    const search = await screen.findByRole("searchbox", { name: "Search calculators" });
    await waitFor(() => expect(search).toHaveFocus());

    fireEvent.keyDown(search, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Search calculators" })).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("closes after following a focusable result route", async () => {
    render(<CalculatorFinder />);
    fireEvent.click(screen.getByRole("button", { name: "Search calculators" }));

    const portfolioLink = await screen.findByRole("link", { name: /Portfolio Optimization/ });
    expect(portfolioLink).toHaveAttribute("href", "/portfolio");
    portfolioLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(portfolioLink);

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Search calculators" })).not.toBeInTheDocument());
  });
});
