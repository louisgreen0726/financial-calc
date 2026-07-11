import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure appearance, language, currency, and locally stored calculation data.",
};

export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
