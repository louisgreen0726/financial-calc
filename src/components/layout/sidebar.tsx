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
import { Calculator, ChevronDown, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export const Sidebar = React.memo(function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Search query state
  const [query, setQuery] = useState("");

  // Per-section collapse state (default: expanded)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const acc: Record<string, boolean> = {};
    NAV_CONFIG.forEach((sec) => {
      acc[sec.titleKey] = true; // start expanded
    });
    return acc;
  });

  const toggleSection = (titleKey: string) => {
    setExpanded((p) => ({ ...p, [titleKey]: !p[titleKey] }));
  };

  // Derived sections respecting search query
  const sections = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return NAV_CONFIG;
    // filter items by translated title text
    return NAV_CONFIG.map((sec) => {
      const items = sec.items.filter((it) => {
        const name = t(it.titleKey) ?? it.titleKey;
        return name.toLowerCase().includes(q);
      });
      if (items.length === 0) return null;
      return { ...sec, items } as typeof sec;
    }).filter((s) => s !== null) as typeof NAV_CONFIG;
  }, [query, t]);

  return (
    <div className={cn("pb-12 h-screen border-r bg-card/60 backdrop-blur-xl", className)}>
      <div className="space-y-4 py-4 h-full flex flex-col">
        {/* Logo area with gradient bg, larger icon, improved typography */}
        <div className="px-3 py-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 mx-2 shadow-sm">
          <Link href="/" className="flex items-center pl-2 pr-3 py-2 text-white gap-3">
            <Calculator className="h-8 w-8" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight">FinCalc</span>
              <span className="text-sm opacity-95">Pro</span>
            </div>
          </Link>
        </div>

        {/* Search / Filter input */}
        <div className="px-3 pb-1 pt-1">
          <div className="relative">
            <Input
              aria-label="Search navigation"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("sidebar.search") ?? "Search..."}
              className="w-full bg-background/50 shadow-none border-border"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-4 px-3">
            <AnimatePresence initial={false}>
              {sections.map((section) => {
                const sectionColor = section.color ?? "text-emerald-500";
                const borderColorClass = sectionColor.replace("text-", "border-");
                const colorForBg = sectionColor.replace("text-", "");
                const activeBgClass = `bg-${colorForBg}/20`;
                const isExpanded = expanded[section.titleKey] ?? true;
                return (
                  <section key={section.titleKey} className="space-y-2">
                    <div
                      className="flex items-center justify-between px-1 py-2 cursor-pointer"
                      onClick={() => toggleSection(section.titleKey)}
                    >
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {t(section.titleKey)}
                      </h3>
                      <span className="ml-2 text-muted-foreground">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="space-y-1 pl-2 pr-2 pb-2">
                            {section.items.map((item) => {
                              const isActive = pathname === item.href;
                              return (
                                <Button
                                  key={item.href}
                                  asChild
                                  variant={isActive ? "secondary" : "ghost"}
                                  className={cn(
                                    "w-full justify-start pl-3 pr-3 py-2 rounded-none font-medium",
                                    isActive
                                      ? `border-l-2 ${borderColorClass} ${activeBgClass} text-foreground`
                                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                  )}
                                >
                                  <Link href={item.href} className="flex items-center w-full">
                                    <item.icon
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        isActive ? "text-foreground" : "text-muted",
                                        sectionColor
                                      )}
                                    />
                                    <span className={cn(isActive ? "text-foreground" : "text-foreground/80")}>
                                      {t(item.titleKey)}
                                    </span>
                                  </Link>
                                </Button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <div className="px-7 py-4 text-xs text-muted-foreground border-t">
          <p>{t("sidebar.edition")}</p>
          <p className="opacity-50">{t("sidebar.version")}</p>
        </div>
      </div>
    </div>
  );
});
