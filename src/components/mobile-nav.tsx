"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2x2, ChevronRight } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { MOBILE_PRIMARY_NAV, NAV_CONFIG } from "@/lib/nav-config";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const sections = useMemo(
    () =>
      NAV_CONFIG.map((section) => ({
        ...section,
        items: section.items.filter((item) => item.href !== "/history" && item.href !== "/settings"),
      })).filter((section) => section.items.length > 0),
    []
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 lg:hidden">
      <div className="grid h-17 grid-cols-5 gap-1 px-1 py-1">
        {MOBILE_PRIMARY_NAV.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-all sm:text-[11px]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                  isActive ? "bg-primary/12 shadow-[0_0_0_1px_hsl(var(--primary)_/_18%)]" : "bg-transparent"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="max-w-full truncate px-1 leading-none">{t(labelKey) || labelKey}</span>
            </Link>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="h-full min-w-0 rounded-2xl px-1 py-2 text-muted-foreground hover:text-foreground"
              aria-label={t("common.more") || "More"}
            >
              <span className="flex flex-col items-center gap-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-transparent">
                  <Grid2x2 className="h-5 w-5" />
                </span>
                <span className="text-[10px] sm:text-[11px] leading-none">{t("common.more") || "More"}</span>
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl border-t border-white/10 px-0 pb-6">
            <SheetHeader className="px-4 pb-2 pt-5 text-left">
              <SheetTitle>{t("common.more") || "More modules"}</SheetTitle>
              <SheetDescription>{t("home.subtitle")}</SheetDescription>
            </SheetHeader>
            <div className="max-h-[min(70vh,36rem)] overflow-y-auto px-4">
              <div className="space-y-5">
                {sections.map((section) => (
                  <section key={section.titleKey} className="space-y-2">
                    <h3 className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                      {t(section.titleKey)}
                    </h3>
                    <div className="space-y-2">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-2xl border border-white/10 bg-background/60 px-4 py-3 transition-all",
                              isActive ? "border-primary/30 bg-primary/8 text-primary" : "hover:bg-muted/50"
                            )}
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              <item.icon className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{t(item.titleKey)}</span>
                              <span className="block truncate text-xs text-muted-foreground">{t(item.descKey)}</span>
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
