"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { MOBILE_PRIMARY_NAV } from "@/lib/nav-config";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 lg:hidden">
      <div className="grid h-16 grid-cols-2 gap-2 px-3 py-2">
        {MOBILE_PRIMARY_NAV.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-row items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition-all sm:text-sm",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                  isActive ? "bg-primary/12 shadow-[0_0_0_1px_hsl(var(--primary)_/_18%)]" : "bg-transparent"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="max-w-full truncate leading-none">{t(labelKey) || labelKey}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
