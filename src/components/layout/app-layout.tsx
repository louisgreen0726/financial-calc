"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "@/components/mobile-nav";
import { useLanguage } from "@/lib/i18n";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { t } = useLanguage();

  return (
    <div className="app-shell relative flex min-h-screen overflow-x-clip selection:bg-primary/30">
      {/* Skip to Content Link */}
      <a
        href="#main-content"
        data-pdf-exclude="true"
        className="no-print sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg"
      >
        {t("common.skipToContent")}
      </a>

      {/* Desktop Sidebar Container (gives padding for floating effect) */}
      <div
        data-pdf-exclude="true"
        className="no-print fixed inset-y-0 left-0 z-[80] hidden w-72 flex-col p-4 lg:flex xl:w-80"
      >
        <Sidebar className="rounded-2xl shadow-2xl border-white/10" />
      </div>

      {/* Main Content Area */}
      <div
        data-app-content="true"
        className="relative z-10 flex min-h-screen min-w-0 flex-1 flex-col lg:pl-72 xl:pl-80"
      >
        <div data-pdf-exclude="true" className="no-print px-3 pt-3 sm:px-4 md:px-6 md:pt-4 xl:px-8">
          <Header className="rounded-2xl shadow-sm border border-white/10 backdrop-blur-3xl bg-card/60" />
        </div>
        <main
          id="main-content"
          data-print-content="true"
          className="mx-auto flex-1 w-full max-w-7xl min-w-0 overflow-y-auto px-3 pb-28 pt-4 sm:px-4 md:px-6 md:pb-24 xl:px-8 xl:pb-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div data-pdf-exclude="true" className="no-print lg:hidden z-[90]">
        <MobileNav />
      </div>
    </div>
  );
}
