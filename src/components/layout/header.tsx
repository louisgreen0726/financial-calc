"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileSidebar } from "./mobile-sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { useLanguage } from "@/lib/i18n";
import { NAV_CONFIG } from "@/lib/nav-config";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export const Header = React.memo(function Header({ className }: HeaderProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";

  // Find current page title from NAV_CONFIG
  const currentSection = NAV_CONFIG.find((section) =>
    section.items.some((item) => (item.href.replace(/\/$/, "") || "/") === normalizedPathname)
  );
  const currentItem = currentSection?.items.find(
    (item) => (item.href.replace(/\/$/, "") || "/") === normalizedPathname
  );
  const pageTitle = currentItem
    ? t(currentItem.titleKey)
    : normalizedPathname === "/"
      ? t("common.home")
      : pathname.split("/").pop()?.replace(/-/g, " ") || t("common.dashboard");

  return (
    <header
      data-pdf-exclude="true"
      className={cn(
        "app-header no-print sticky top-0 z-50 flex h-14 w-full min-w-0 items-center justify-between gap-3 border-b bg-background/95 px-4 supports-[backdrop-filter]:backdrop-blur-md sm:h-16 sm:px-5 md:px-6 lg:px-8",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <MobileSidebar />
        <div className="flex min-w-0 items-center gap-2.5" data-tone={currentSection?.tone ?? "teal"}>
          <span className="header-context-icon hidden sm:flex" aria-hidden="true">
            {currentItem ? <currentItem.icon className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </span>
          <div className="hidden min-w-0 items-center gap-2 sm:flex">
            <Link
              href="/"
              prefetch={false}
              className="shrink-0 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {t("common.home")}
            </Link>
            {normalizedPathname !== "/" ? (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
                <span className="truncate text-sm font-semibold text-foreground">{pageTitle}</span>
              </>
            ) : null}
          </div>
          <span className="max-w-32 truncate text-sm font-semibold sm:hidden">{pageTitle}</span>
        </div>
      </div>

      <nav className="flex shrink-0 items-center gap-1 border-l pl-2 sm:pl-3">
        <ModeToggle />
        <LanguageSwitcher />
      </nav>
    </header>
  );
});
