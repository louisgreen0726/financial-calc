"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { MOBILE_PRIMARY_NAV } from "@/lib/nav-config";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";

  return (
    <nav
      aria-label={t("common.primaryNavigation")}
      data-pdf-exclude="true"
      className="mobile-nav-bar no-print fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 rounded-xl border bg-card/95 supports-[backdrop-filter]:backdrop-blur-md lg:hidden"
    >
      <div className="grid h-16 grid-cols-4 gap-1 px-2 py-2">
        {MOBILE_PRIMARY_NAV.map(({ href, icon: Icon, labelKey }) => {
          const isActive = (href.replace(/\/$/, "") || "/") === normalizedPathname;
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-1 text-[11px] font-medium sm:text-xs",
                isActive
                  ? "bg-accent text-accent-foreground after:absolute after:inset-x-3 after:top-0 after:h-0.5 after:bg-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={t(labelKey) || labelKey}
            >
              <span
                className={cn("flex h-7 w-8 items-center justify-center", isActive ? "text-primary" : "bg-transparent")}
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
