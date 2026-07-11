import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cash Flow Analysis",
  description: "Analyze cash flows with NPV, IRR, and payback period calculations.",
};

export default function CashFlowLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
