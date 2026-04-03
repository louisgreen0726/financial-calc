import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
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

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinCalc Pro | Professional Financial Calculator",
  description: "Advanced financial modeling and valuation tools.",
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
    // Note: Server components cannot access client i18n hooks to set dynamic language.
    // The current language is managed on the client by the i18n hook in src/lib/i18n.tsx.
    // If you need a dynamic lang attribute server-side, pass the lang value from a LanguageProvider
    // or expose via a server-side prop. See i18n.tsx for the client-side update mechanics.
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            <ErrorBoundary>
              <AppLayout>{children}</AppLayout>
            </ErrorBoundary>
            <Toaster position="bottom-right" />
          </LanguageProvider>
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
