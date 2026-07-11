import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock Valuation",
  description: "Evaluate stocks with CAPM, WACC, and dividend discount models.",
};

export default function EquityLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
