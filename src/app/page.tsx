"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NAV_CONFIG } from "@/lib/nav-config";
import { ArrowRight, Clock } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { formatCurrency } from "@/lib/utils";
import { MotionPage, StaggeredList, MotionListItem, MotionCard } from "@/components/motion-wrappers";
import { motion } from "framer-motion";

export default function Home() {
  const allNavItems = useMemo(() => NAV_CONFIG.flatMap((section) => section.items), []);
  const { t } = useLanguage();
  const { history } = useCalculationHistory({ page: "home" });

  const getPageConfig = (pageStr: string) => {
    return allNavItems.find((item) => item.href.includes(pageStr));
  };

  return (
    <MotionPage className="space-y-10">
      {/* Hero Section */}
      <div className="space-y-6 py-10 md:py-16 text-center md:text-left relative z-10">
        <motion.h1
          className="text-5xl md:text-7xl font-display font-extrabold tracking-[-0.04em] text-gradient mx-auto md:mx-0 w-fit leading-tight drop-shadow-sm pb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {t("home.title")}
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl font-medium text-muted-foreground/80 max-w-2xl mx-auto md:mx-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        >
          {t("home.subtitle")}
        </motion.p>
      </div>

      {/* Main Calculators Grid */}
      <StaggeredList className="grid gap-5 md:gap-6 relative z-10">
        {allNavItems.map((item, i) => (
          <MotionListItem key={item.href} index={i} className="list-none group block h-full">
            <Link href={item.href} className="group flex-1">
              <MotionCard className="h-full glass-card rounded-2xl hover:bg-background/80 hover:shadow-[0_12px_40px_-15px_hsl(var(--primary)_/_30%)] hover:-translate-y-1 transition-all duration-300 relative overflow-visible transform-gpu">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl" />
                <CardHeader className="pb-2 px-5 pt-5">
                  <CardTitle className="flex items-center gap-3 font-display text-lg md:text-base">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_15px_hsl(var(--primary)_/_50%)] transition-all duration-300 shrink-0">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="truncate">{t(item.titleKey)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 px-5 pb-5">
                  <CardDescription className="text-sm font-medium text-muted-foreground/80 leading-relaxed line-clamp-2">
                    {t(item.descKey)}
                  </CardDescription>
                  <div className="flex items-center text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0">
                    {t("home.openModule") || "Open Module"} <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </MotionCard>
            </Link>
          </MotionListItem>
        ))}
      </StaggeredList>

      {/* Recent Activity */}
      {history.length > 0 && (
        <motion.div
          className="space-y-6 pt-12 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-display">Recent Calculations</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {history.slice(0, 4).map((item) => {
              const navItem = getPageConfig(item.page);
              return (
                <Link key={item.id} href={`/${item.page}`} className="group">
                  <Card className="h-full glass-card rounded-xl hover:-translate-y-[2px] transition-all duration-200 overflow-hidden">
                    <CardHeader className="p-4 pb-2 border-b border-border/50 bg-muted/20">
                      <CardTitle className="text-sm font-semibold flex items-center justify-between text-muted-foreground gap-2">
                        <span className="truncate">{navItem ? t(navItem.titleKey) : item.page}</span>
                        <span className="text-[10px] font-mono opacity-60 bg-background px-2 py-0.5 rounded-md shrink-0">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-3 flex flex-col justify-center min-h-[80px]">
                      <div className="text-xl md:text-2xl font-display font-bold text-foreground truncate">
                        {item.result > 1000 || item.result < -1000 || item.page === "bonds"
                          ? formatCurrency(item.result)
                          : item.result.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </div>
                      {item.label && (
                        <p className="text-xs text-primary font-medium mt-1 uppercase tracking-wider truncate">
                          {item.label}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </MotionPage>
  );
}
