import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bonds and Fixed Income",
  description: "Calculate bond price, duration, convexity, and yield sensitivity.",
};

export default function BondsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
