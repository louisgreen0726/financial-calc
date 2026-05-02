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
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";

  // Find current page title from NAV_CONFIG
  const currentItem = NAV_CONFIG.flatMap((s) => s.items).find(
    (item) => (item.href.replace(/\/$/, "") || "/") === normalizedPathname
  );
  const pageTitle = currentItem
    ? t(currentItem.titleKey)
    : normalizedPathname === "/"
      ? t("common.home") || "Home"
      : pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard";

  return (
    <header
      className={cn(
        "sticky top-2 z-50 flex h-14 w-full min-w-0 items-center justify-between gap-2 px-3 transition-all duration-300 sm:px-4 lg:px-6",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <MobileSidebar />
        <div className="hidden min-w-0 items-center gap-2 md:flex">
          <span className="shrink-0 text-sm font-medium text-muted-foreground/70">{t("common.home") || "Home"}</span>
          {normalizedPathname !== "/" ? (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
              <span className="truncate text-sm font-semibold tracking-normal text-foreground/90">{pageTitle}</span>
            </>
          ) : null}
        </div>
      </div>

      <nav className="flex shrink-0 items-center gap-1.5">
        <ModeToggle />
        <LanguageSwitcher />
      </nav>
    </header>
  );
});
