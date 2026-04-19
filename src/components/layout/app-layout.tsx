"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "@/components/mobile-nav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative flex selection:bg-primary/30 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="bg-glow-orb bg-glow-orb-1" />
      <div className="bg-glow-orb bg-glow-orb-2" />

      {/* Skip to Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg"
      >
        Skip to content
      </a>

      {/* Desktop Sidebar Container (gives padding for floating effect) */}
      <div className="hidden lg:flex w-72 xl:w-80 flex-col fixed inset-y-0 left-0 p-4 z-[80]">
        <Sidebar className="rounded-2xl shadow-2xl border-white/10" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 xl:pl-80 flex flex-col min-h-screen relative z-10">
        <div className="px-3 sm:px-4 md:px-6 xl:px-8 pt-3 md:pt-4">
          <Header className="rounded-2xl shadow-sm border border-white/10 backdrop-blur-3xl bg-card/60" />
        </div>
        <main
          id="main-content"
          className="flex-1 px-3 pb-28 pt-4 sm:px-4 md:px-6 md:pb-24 xl:px-8 xl:pb-8 overflow-y-auto w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden z-[90]">
        <MobileNav />
      </div>
    </div>
  );
}
