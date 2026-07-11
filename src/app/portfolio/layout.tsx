import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Optimization",
  description: "Simulate portfolios and compare sampled risk, return, and Sharpe ratios.",
};

export default function PortfolioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
