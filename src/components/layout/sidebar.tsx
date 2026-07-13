"use client";

import React, { useMemo, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NAV_CONFIG } from "@/lib/nav-config";
import { useLanguage } from "@/lib/i18n";
import { Calculator, ChevronDown, ChevronRight, Search } from "lucide-react";

type SidebarProps = React.HTMLAttributes<HTMLDivElement> & {
  onNavigate?: () => void;
  searchId?: string;
  collapsed?: boolean;
};

export const Sidebar = React.memo(function Sidebar({
  className,
  onNavigate,
  searchId = "calculator-search",
  collapsed = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";

  const [query, setQuery] = useState("");

  // Per-section collapse state (default: expanded)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const acc: Record<string, boolean> = {};
    NAV_CONFIG.forEach((sec) => {
      acc[sec.titleKey] = true;
    });
    return acc;
  });

  const toggleSection = (titleKey: string) => {
    setExpanded((p) => ({ ...p, [titleKey]: !p[titleKey] }));
  };

  const sections = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return NAV_CONFIG;

    return NAV_CONFIG.map((sec) => {
      const sectionLabel = t(sec.titleKey);
      const items = sec.items.filter((it) => {
        const searchText = `${sectionLabel} ${t(it.titleKey)} ${t(it.descKey)}`.toLowerCase();
        return terms.every((term) => searchText.includes(term));
      });
      if (items.length === 0) return null;
      return { ...sec, items } as typeof sec;
    }).filter((s) => s !== null) as typeof NAV_CONFIG;
  }, [query, t]);

  return (
    <div
      data-pdf-exclude="true"
      data-collapsed={collapsed}
      className={cn("no-print flex h-full min-h-0 flex-col overflow-hidden bg-transparent", className)}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div
          className={cn(
            "brand-header flex h-16 shrink-0 items-center border-b",
            collapsed ? "justify-center px-0" : "px-4"
          )}
        >
          <Link
            href="/"
            prefetch={false}
            className={cn("flex min-w-0 items-center gap-3", collapsed && "flex-1 justify-center")}
            onClick={onNavigate}
            aria-label={collapsed ? "FinCalc Pro" : undefined}
            title={collapsed ? "FinCalc Pro" : undefined}
          >
            <span
              className={cn(
                "brand-mark flex shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground",
                collapsed ? "size-8" : "size-9"
              )}
            >
              <Calculator className="h-5 w-5" />
            </span>
            <span className={cn("min-w-0 flex-1", collapsed && "hidden")}>
              <span className="block truncate text-base font-semibold leading-5">FinCalc Pro</span>
              <span className="block text-xs text-muted-foreground">{t("sidebar.workspace")}</span>
            </span>
          </Link>
        </div>

        <div className={cn("shrink-0 px-3 pb-3 pt-4", collapsed && "hidden")}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={searchId}
              name={searchId}
              aria-label={t("sidebar.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("sidebar.search")}
              className="sidebar-search h-9 w-full bg-background pl-9 pr-3 text-sm"
            />
          </div>
        </div>

        <nav
          aria-label={t("common.primaryNavigation")}
          className={cn("min-h-0 flex-1", collapsed ? "px-2 pt-3" : "px-2")}
        >
          <ScrollArea className="h-full">
            <div className={cn("pb-5", collapsed ? "space-y-2" : "space-y-4")}>
              {sections.map((section) => {
                const isSearching = query.trim().length > 0;
                const isExpanded = isSearching || (expanded[section.titleKey] ?? true);
                const sectionId = `${searchId}-section-${section.titleKey.replace(/\W+/g, "-")}`;

                return (
                  <section
                    key={section.titleKey}
                    className={cn(
                      "space-y-1",
                      collapsed && "border-t border-border/60 pt-2 first:border-t-0 first:pt-0"
                    )}
                    data-tone={section.tone}
                  >
                    {!collapsed ? (
                      <button
                        type="button"
                        className="sidebar-section-trigger flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        aria-expanded={isExpanded}
                        aria-controls={sectionId}
                        onClick={() => toggleSection(section.titleKey)}
                      >
                        <span>{t(section.titleKey)}</span>
                        <span aria-hidden="true">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                      </button>
                    ) : null}
                    {collapsed || isExpanded ? (
                      <div id={sectionId} className={cn("space-y-0.5", collapsed && "flex flex-col items-center")}>
                        {section.items.map((item) => {
                          const isActive = (item.href.replace(/\/$/, "") || "/") === normalizedPathname;
                          const itemLabel = t(item.titleKey);
                          return (
                            <Button
                              key={item.href}
                              asChild
                              variant="ghost"
                              className={cn(
                                "h-9 rounded-md text-sm",
                                collapsed ? "w-10 justify-center px-0" : "w-full justify-start px-2.5",
                                isActive
                                  ? "sidebar-link-active font-semibold text-foreground"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              <Link
                                href={item.href}
                                prefetch={false}
                                className="flex min-w-0 items-center"
                                onClick={onNavigate}
                                aria-current={isActive ? "page" : undefined}
                                aria-label={collapsed ? itemLabel : undefined}
                                title={collapsed ? itemLabel : undefined}
                              >
                                <span
                                  className={cn(
                                    "sidebar-item-icon",
                                    collapsed && "mr-0",
                                    isActive && "sidebar-item-icon-active"
                                  )}
                                >
                                  <item.icon className="h-4 w-4" />
                                </span>
                                <span className={cn("truncate", collapsed && "sr-only")}>{itemLabel}</span>
                              </Link>
                            </Button>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>
                );
              })}
              {sections.length === 0 ? (
                <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  {t("history.noResults")}
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </nav>

        <div className={cn("sidebar-footer shrink-0 border-t px-4 py-3", collapsed && "hidden")}>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate">{t("sidebar.edition")}</span>
            <span className="shrink-0 font-mono">{t("sidebar.version")}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
