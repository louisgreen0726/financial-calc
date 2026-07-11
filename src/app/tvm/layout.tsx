import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Time Value of Money",
  description: "Calculate present value, future value, payments, rates, and periods.",
};

export default function TvmLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
