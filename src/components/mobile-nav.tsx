"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calculator, History, HelpCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

const NAV_ITEMS = [
  { href: "/", icon: Home, labelKey: "common.home" },
  { href: "/tvm", icon: Calculator, labelKey: "nav.core.tvm.title" },
  { href: "/history", icon: History, labelKey: "history.title" },
  { href: "/settings", icon: Settings, labelKey: "settings.title" },
  { href: "/help", icon: HelpCircle, labelKey: "help.title" },
];

/**
 * Bottom tab bar for mobile — shown below md breakpoint.
 * Fixed position, 5 tabs with active indicator.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 relative">
        {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full min-w-[44px] min-h-[44px] transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
              )}
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium truncate px-1">{t(labelKey) || labelKey}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
