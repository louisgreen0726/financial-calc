import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help and Support",
  description: "Learn how to use FinCalc Pro and find answers to common questions.",
};

export default function HelpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
