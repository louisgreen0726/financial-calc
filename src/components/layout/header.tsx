"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MobileSidebar } from "./mobile-sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { useLanguage } from "@/lib/i18n";
import { NAV_CONFIG } from "@/lib/nav-config";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export const Header = React.memo(function Header({ className }: HeaderProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Find current page title from NAV_CONFIG
  const currentItem = NAV_CONFIG.flatMap((s) => s.items).find((item) => item.href === pathname);
  const pageTitle = currentItem
    ? t(currentItem.titleKey)
    : pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard";

  return (
    <header
      className={cn(
        "sticky top-2 z-50 w-full flex items-center justify-between px-4 lg:px-6 h-14 transition-all duration-300",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <MobileSidebar />
        <div className="hidden md:flex items-center gap-2">
          <span className="font-medium text-sm text-muted-foreground/70">{t("common.home") || "Home"}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          <span className="font-semibold text-sm text-foreground/90 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 tracking-tight">
            {pageTitle}
          </span>
        </div>
      </div>

      <nav className="flex items-center gap-1.5">
        <ModeToggle />
        <LanguageSwitcher />
      </nav>
    </header>
  );
});
