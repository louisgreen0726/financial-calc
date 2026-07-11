import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Macroeconomics and FX",
  description: "Calculate inflation, purchasing power, real rates, CPI adjustments, and PPP.",
};

export default function MacroLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
