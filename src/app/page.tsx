"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NAV_CONFIG } from "@/lib/nav-config";
import { ArrowRight, Calculator, Clock, FolderOpen, LayoutGrid, PieChart } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { formatHistoryResult } from "@/lib/history-format";
import { PENDING_RESTORE_KEY } from "@/lib/constants";
import { safeSetSessionJSON } from "@/lib/storage";
import { MotionPage } from "@/components/motion-wrappers";
import { WorkspaceHomeSection } from "@/components/workspace-home-section";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Home() {
  const allNavItems = useMemo(() => NAV_CONFIG.flatMap((section) => section.items), []);
  const { t, language } = useLanguage();
  const { history } = useCalculationHistory({ page: "home" });
  const latestHistoryItem = history[0];
  const historyFormatOptions = useMemo(
    () => ({
      locale: language,
      notAvailable: t("common.notAvailable"),
      periodsUnit: t("history.periodsUnit"),
      yearsUnit: t("history.yearsUnit"),
    }),
    [language, t]
  );

  const getPageConfig = (pageStr: string) => {
    return allNavItems.find((item) => item.href.includes(pageStr));
  };

  const prepareRestore = (item: typeof latestHistoryItem) => {
    if (!item) {
      return false;
    }

    const persisted = safeSetSessionJSON(PENDING_RESTORE_KEY, {
      page: item.page,
      inputs: item.inputs,
      timestamp: Date.now(),
    });
    if (!persisted) {
      toast.error(t("common.storageOperationFailed"));
    }
    return persisted;
  };

  return (
    <MotionPage className="page-stack" data-tone="teal">
      <div className="home-cover">
        <div className="home-cover-content">
          <div className="flex min-w-0 items-start gap-4">
            <span className="home-page-icon" aria-hidden="true">
              <LayoutGrid className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="page-title">{t("home.title")}</h1>
              <p className="page-description">{t("home.subtitle")}</p>
            </div>
          </div>
          <div className="home-cover-actions">
            <Button asChild>
              <Link href="/tvm" prefetch={false}>
                <Calculator className="h-4 w-4" />
                {t("nav.core.tvm.title")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/portfolio" prefetch={false}>
                <PieChart className="h-4 w-4" />
                {t("nav.investing.portfolio.title")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {latestHistoryItem ? (
        <WorkspaceHomeSection title={t("home.continueTitle")} description={t("home.continueDesc")}>
          <div className="resume-card flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {getPageConfig(latestHistoryItem.page)
                  ? t(getPageConfig(latestHistoryItem.page)!.titleKey)
                  : latestHistoryItem.page}
              </p>
              <p className="break-words text-xl font-semibold sm:text-2xl">
                {formatHistoryResult(latestHistoryItem, historyFormatOptions)}
              </p>
              {latestHistoryItem.label ? (
                <p className="text-sm font-medium text-primary">{latestHistoryItem.label}</p>
              ) : null}
            </div>
            <Button asChild>
              <Link
                href={`/${latestHistoryItem.page}`}
                prefetch={false}
                onClick={(event) => {
                  if (!prepareRestore(latestHistoryItem)) event.preventDefault();
                }}
              >
                {t("home.continueAction")}
              </Link>
            </Button>
          </div>
        </WorkspaceHomeSection>
      ) : null}

      <section className="space-y-6">
        <div className="workspace-section-heading">
          <div>
            <h2>{t("home.directoryTitle")}</h2>
            <p>{t("home.directoryDesc")}</p>
          </div>
          <span className="workspace-section-count" aria-hidden="true">
            {allNavItems.length}
          </span>
        </div>

        <div className="home-groups-grid">
          {NAV_CONFIG.map((section) => (
            <section key={section.titleKey} className="tool-group" data-tone={section.tone}>
              <div className="tool-group-heading">
                <span className="tool-group-icon" aria-hidden="true">
                  <FolderOpen className="h-4 w-4" />
                </span>
                <h3>{t(section.titleKey)}</h3>
                <span className="tool-group-count" aria-hidden="true">
                  {section.items.length}
                </span>
              </div>

              <ul className="tool-list">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="tool-row group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <span className="tool-row-icon" aria-hidden="true">
                        <item.icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="tool-row-title">{t(item.titleKey)}</span>
                        <span className="tool-row-description">{t(item.descKey)}</span>
                      </span>
                      <ArrowRight className="tool-row-arrow" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section className="space-y-4">
          <div className="workspace-section-heading">
            <div className="flex items-center gap-2.5">
              <span className="workspace-heading-icon" aria-hidden="true">
                <Clock className="h-4 w-4" />
              </span>
              <h2>{t("history.recent")}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {history.slice(0, 4).map((item) => {
              const navItem = getPageConfig(item.page);
              return (
                <Link
                  key={item.id}
                  href={`/${item.page}`}
                  prefetch={false}
                  className="group"
                  onClick={(event) => {
                    if (!prepareRestore(item)) event.preventDefault();
                  }}
                >
                  <Card className="activity-card h-full overflow-hidden">
                    <CardHeader className="border-b bg-muted/30 p-4 pb-3">
                      <CardTitle
                        as="h3"
                        className="text-sm font-semibold flex items-center justify-between text-muted-foreground gap-2"
                      >
                        <span className="truncate">{navItem ? t(navItem.titleKey) : item.page}</span>
                        <span className="shrink-0 rounded bg-background px-2 py-0.5 font-mono text-[10px]">
                          {new Date(item.timestamp).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US")}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex min-h-20 flex-col justify-center p-4 pt-3">
                      <div className="truncate text-xl font-semibold text-foreground">
                        {formatHistoryResult(item, historyFormatOptions)}
                      </div>
                      {item.label && <p className="mt-1 truncate text-xs font-medium text-primary">{item.label}</p>}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </MotionPage>
  );
}
