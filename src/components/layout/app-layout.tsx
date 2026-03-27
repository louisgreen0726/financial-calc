"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative flex">
      {/* Skip to Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-lg"
      >
        Skip to content
      </a>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-72 flex-col fixed inset-y-0 z-[80]">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-72 flex flex-col min-h-screen">
        <Header />
        <main
          id="main-content"
          className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 ease-in-out"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
