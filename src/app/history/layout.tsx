import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculation History",
  description: "Review, restore, filter, and export calculations stored in this browser.",
};

export default function HistoryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
