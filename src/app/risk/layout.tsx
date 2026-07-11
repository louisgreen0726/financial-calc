import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Management",
  description: "Estimate value at risk, conditional value at risk, and loss distributions.",
};

export default function RiskLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
