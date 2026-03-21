"use client";

import { usePathname } from "next/navigation";
import { MobileSidebar } from "./mobile-sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { useLanguage } from "@/lib/i18n";
import { NAV_CONFIG } from "@/lib/nav-config";
import { ChevronRight } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Find current page title from NAV_CONFIG
  const currentItem = NAV_CONFIG.flatMap((s) => s.items).find((item) => item.href === pathname);
  const pageTitle = currentItem
    ? t(currentItem.titleKey)
    : pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 md:px-8">
        <MobileSidebar />
        <div className="mr-4 hidden md:flex items-center gap-1.5">
          <span className="font-semibold text-sm text-muted-foreground">{t("common.home")}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="font-semibold text-sm text-foreground">{pageTitle}</span>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none"></div>
          <nav className="flex items-center gap-2">
            <ModeToggle />
            <LanguageSwitcher />
          </nav>
        </div>
      </div>
    </header>
  );
}
