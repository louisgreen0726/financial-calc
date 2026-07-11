import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Options Pricing",
  description: "Price options and review Black-Scholes Greeks and payoff behavior.",
};

export default function OptionsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
