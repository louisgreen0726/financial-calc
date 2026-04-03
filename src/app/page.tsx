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

export default function Home() {
  const allNavItems = useMemo(() => NAV_CONFIG.flatMap((section) => section.items), []);
  const { t } = useLanguage();
  const { history } = useCalculationHistory({ page: "home" });

  const getPageConfig = (pageStr: string) => {
    return allNavItems.find((item) => item.href.includes(pageStr));
  };

  return (
    <MotionPage className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent w-fit">
          {t("home.title")}
        </h1>
        <p className="text-xl text-muted-foreground">{t("home.subtitle")}</p>
      </div>

      <StaggeredList className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allNavItems.map((item, i) => (
          <MotionListItem key={item.href} index={i} className="list-none group block h-full">
            <Link href={item.href} className="group flex-1">
              <MotionCard className="h-full transition-all hover:border-primary/50 hover:shadow-md hover:bg-muted/10 bg-card text-card-foreground border rounded-xl overflow-hidden shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <item.icon className="h-5 w-5" />
                    </div>
                    {t(item.titleKey)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm">{t(item.descKey)}</CardDescription>
                  <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                    {t("home.openModule")} <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </CardContent>
              </MotionCard>
            </Link>
          </MotionListItem>
        ))}
      </StaggeredList>

      {history.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-2xl font-bold tracking-tight">Recent Calculations</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {history.slice(0, 4).map((item) => {
              const navItem = getPageConfig(item.page);
              return (
                <Link key={item.id} href={`/${item.page}`} className="group">
                  <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md hover:bg-muted/10">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
                        {navItem ? t(navItem.titleKey) : item.page}
                        <span className="text-xs">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-xl font-bold">
                        {item.result > 1000 || item.result < -1000 || item.page === "bonds"
                          ? formatCurrency(item.result)
                          : item.result.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </div>
                      {item.label && <p className="text-xs text-muted-foreground mt-1">{item.label}</p>}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </MotionPage>
  );
}
