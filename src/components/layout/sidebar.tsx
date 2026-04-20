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
    <div
      className={cn(
        "h-full flex flex-col bg-card/60 backdrop-blur-2xl border border-white/10 shadow-2xl relative",
        className
      )}
    >
      <div className="space-y-4 py-4 h-full flex flex-col relative z-10 min-h-0">
        {/* Logo area with floating glassmorphism */}
        <div className="mx-4 mt-2 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative p-3 rounded-2xl bg-background/80 backdrop-blur-sm border border-white/10 shadow-sm flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 w-full">
              <div className="p-2 bg-gradient-to-br from-primary to-blue-600 rounded-xl shadow-inner group-hover:scale-105 transition-transform duration-300">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold tracking-tight box-decoration-clone font-display">FinCalc</span>
                <span className="text-[10px] mt-1 font-semibold uppercase tracking-widest text-primary/80">Pro</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Search / Filter input */}
        <div className="px-4 pb-1 pt-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <Input
              aria-label={t("sidebar.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("sidebar.search")}
              className="w-full bg-background/50 backdrop-blur-md border-white/10 pl-9 pr-4 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/50 focus:border-primary/50 transition-all h-9 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-6 px-2 pb-6 mt-2">
            <AnimatePresence initial={false}>
              {sections.map((section) => {
                const isExpanded = expanded[section.titleKey] ?? true;

                return (
                  <section key={section.titleKey} className="space-y-2">
                    <div
                      className="flex items-center justify-between px-2 py-1.5 cursor-pointer group"
                      onClick={() => toggleSection(section.titleKey)}
                    >
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground transition-colors mix-blend-luminosity">
                        {t(section.titleKey)}
                      </h3>
                      <span className="ml-2 text-muted-foreground/40 group-hover:text-foreground transition-colors">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="space-y-1">
                            {section.items.map((item) => {
                              const isActive = pathname === item.href;
                              return (
                                <Button
                                  key={item.href}
                                  asChild
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start px-3 py-2.5 h-10 rounded-xl font-medium transition-all duration-300 relative overflow-hidden group",
                                    isActive
                                      ? "text-foreground shadow-sm bg-background/50 border border-white/5"
                                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                                  )}
                                >
                                  <Link href={item.href} className="flex items-center w-full relative z-10">
                                    <item.icon
                                      className={cn(
                                        "mr-3 h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                                        isActive ? "text-primary" : "text-muted-foreground/70"
                                      )}
                                    />
                                    <span className={cn(isActive ? "text-foreground font-semibold" : "font-medium")}>
                                      {t(item.titleKey)}
                                    </span>

                                    {/* Active State Background Gradient Indicator */}
                                    {isActive && (
                                      <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-100 pointer-events-none -z-10"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                      />
                                    )}

                                    {/* Active State Left Bar */}
                                    {isActive && (
                                      <motion.div
                                        layoutId="sidebar-active-bar"
                                        className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                      />
                                    )}
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

        <div className="px-6 py-4 mt-auto">
          <div className="p-3 rounded-xl bg-background/30 backdrop-blur-md border border-white/5 flex flex-col items-center justify-center gap-1">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
              {t("sidebar.edition") || "Pro Edition"}
            </p>
            <p className="text-xs font-mono text-muted-foreground/30">{t("sidebar.version") || "v0.1.0"}</p>
          </div>
        </div>
      </div>
    </div>
  );
});
