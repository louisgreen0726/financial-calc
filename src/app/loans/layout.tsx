import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loans and Mortgages",
  description: "Compare loan repayment methods and inspect amortization schedules.",
};

export default function LoansLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
