import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout";
import { LanguageProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const withBasePath = (path: string) => `${basePath}${path}`;
const workspaceVisualStyles = `:root{--workspace-visual-light:url("${withBasePath(
  "/visuals/workspace-light.webp"
)}");--workspace-visual-dark:url("${withBasePath("/visuals/workspace-dark.webp")}")}`;

export const metadata: Metadata = {
  title: {
    default: "FinCalc Pro | Professional Financial Calculator",
    template: "%s | FinCalc Pro",
  },
  description: "Advanced financial modeling and valuation tools.",
  manifest: withBasePath("/manifest.json"),
  icons: {
    icon: withBasePath("/favicon.ico"),
    apple: withBasePath("/icon-192.png"),
  },
  openGraph: {
    title: "FinCalc Pro",
    description: "Advanced financial modeling and valuation tools.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinCalc Pro",
    description: "Advanced financial modeling and valuation tools.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Static-export boundary note:
    // - This root layout is a server component and cannot read client-side language/theme state.
    // - The initial HTML is rendered with lang="en" as a safe default.
    // - LanguageProvider updates document.documentElement.lang on the client after hydration.
    // - Any browser-only behavior (theme, local/session storage, service worker) must stay behind client boundaries.
    <html lang="en" suppressHydrationWarning>
      <head>
        <style data-workspace-visuals>{workspaceVisualStyles}</style>
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            <ErrorBoundary>
              <AppLayout>{children}</AppLayout>
            </ErrorBoundary>
            <Toaster position="bottom-right" />
            <ServiceWorkerRegistration />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
