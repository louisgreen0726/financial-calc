"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { useCalculationHistory, CalculationHistoryItem } from "@/hooks/use-calculation-history";
import { NAV_CONFIG } from "@/lib/nav-config";
import { formatHistoryResult } from "@/lib/history-format";
import { PENDING_RESTORE_KEY } from "@/lib/constants";
import { safeSetSessionJSON } from "@/lib/storage";
import {
  Clock,
  Trash2,
  RotateCcw,
  Search,
  Star,
  FileSpreadsheet,
  X,
  CheckSquare,
  Square,
  GitCompareArrows,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useExport } from "@/hooks/use-export";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useHistoryFavorites } from "@/hooks/use-history-favorites";
import { HistoryComparisonDialog } from "@/components/history-comparison-dialog";
import {
  areHistoryItemsComparable,
  getHistoryComparisonEligibility,
  type HistoryComparisonIneligibilityReason,
  type HistoryComparisonMetric,
} from "@/lib/history-comparison";

type SelectionMode = "delete" | "compare" | null;
type Translate = (key: TranslationKey) => string;

const COMPARISON_INPUT_LABEL_KEYS: Record<HistoryComparisonMetric, Record<string, TranslationKey>> = {
  "tvm:rate": {
    nper: "tvm.nper",
    pmt: "tvm.pmt",
    pv: "tvm.pv",
    fv: "tvm.fv",
    type: "tvm.paymentMode",
  },
  "tvm:nper": {
    rate: "tvm.rate",
    pmt: "tvm.pmt",
    pv: "tvm.pv",
    fv: "tvm.fv",
    type: "tvm.paymentMode",
  },
  "equity:capm": {
    rf: "equity.capm.rf",
    beta: "equity.capm.beta",
    rm: "equity.capm.rm",
  },
  "equity:wacc": {
    equity: "equity.wacc.eqVal",
    debt: "equity.wacc.debtVal",
    costEquity: "equity.wacc.costEq",
    costDebt: "equity.wacc.costDebt",
    taxRate: "equity.wacc.tax",
  },
  "options:implied-volatility:call": {
    spot: "options.spot",
    strike: "options.strike",
    time: "options.time",
    rate: "options.rate",
    dividendYield: "options.dividendYield",
    marketPrice: "options.marketPrice",
  },
  "options:implied-volatility:put": {
    spot: "options.spot",
    strike: "options.strike",
    time: "options.time",
    rate: "options.rate",
    dividendYield: "options.dividendYield",
    marketPrice: "options.marketPrice",
  },
  "macro:inflation": {
    startPrice: "macro.inflation.startPrice",
    endPrice: "macro.inflation.endPrice",
    years: "macro.inflation.years",
  },
  "macro:real-rate": {
    nominalRate: "macro.realRate.nominal",
    inflation: "macro.realRate.inflation",
  },
  "macro:ppp": {
    domesticPrice: "macro.ppp.domestic",
    foreignPrice: "macro.ppp.foreign",
  },
};

const COMPARISON_REASON_KEYS: Record<HistoryComparisonIneligibilityReason, TranslationKey> = {
  "currency-metadata-missing": "history.notComparableCurrency",
  "model-metadata-missing": "history.notComparableModel",
  "legacy-or-unsupported": "history.notComparableLegacy",
};

function getComparisonMetricLabel(metric: HistoryComparisonMetric, t: Translate) {
  switch (metric) {
    case "tvm:rate":
      return t("tvm.resultDesc.rate");
    case "tvm:nper":
      return t("tvm.resultDesc.nper");
    case "equity:capm":
      return t("equity.capm.tab");
    case "equity:wacc":
      return t("equity.wacc.result");
    case "options:implied-volatility:call":
      return `${t("options.impliedVolatility")} (${t("options.call")})`;
    case "options:implied-volatility:put":
      return `${t("options.impliedVolatility")} (${t("options.put")})`;
    case "macro:inflation":
      return t("macro.inflation.rate");
    case "macro:real-rate":
      return t("macro.realRate.real");
    case "macro:ppp":
      return t("macro.ppp.rate");
  }
}

export default function HistoryPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const {
    history,
    removeFromHistory,
    removeManyFromHistory,
    clearAllHistory,
    retryPersistence,
    isInitialized,
    persistenceStatus,
    persistenceError,
    hasPendingPersistence,
  } = useCalculationHistory({ page: "all" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [comparisonSelection, setComparisonSelection] = useState<CalculationHistoryItem[]>([]);
  const [comparisonDialogSelection, setComparisonDialogSelection] = useState<CalculationHistoryItem[] | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const batchMode = selectionMode === "delete";
  const comparisonMode = selectionMode === "compare";

  const { exportToCSV } = useExport({ filename: "calculation-history" });
  const historyFormatOptions = useMemo(
    () => ({
      locale: language,
      notAvailable: t("common.notAvailable"),
      periodsUnit: t("history.periodsUnit"),
      yearsUnit: t("history.yearsUnit"),
    }),
    [language, t]
  );

  // Get page title mapping
  const pageTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    NAV_CONFIG.forEach((section) => {
      section.items.forEach((item) => {
        const key = item.href.replace(/^\/|\/$/g, "");
        map[key] = t(item.titleKey);
      });
    });
    return map;
  }, [t]);

  const validHistoryIds = useMemo(() => new Set(history.map((item) => item.id)), [history]);
  const {
    favorites: visibleFavorites,
    toggleFavorite,
    removeFavorites,
    clearFavorites,
    retryPersistence: retryFavoritePersistence,
    persistenceStatus: favoritePersistenceStatus,
    persistenceError: favoritePersistenceError,
    hasPendingPersistence: hasPendingFavoritePersistence,
  } = useHistoryFavorites(validHistoryIds);

  // Group history by page
  const groupedHistory = useMemo(() => {
    const groups: Record<string, CalculationHistoryItem[]> = {};
    history.forEach((item) => {
      if (!groups[item.page]) groups[item.page] = [];
      groups[item.page].push(item);
    });
    return groups;
  }, [history]);

  const effectiveActiveTab =
    activeTab === "all" || activeTab === "favorites" || groupedHistory[activeTab] ? activeTab : "all";

  // Filter by tab
  const filteredHistory = useMemo(() => {
    if (effectiveActiveTab === "all") return history;
    if (effectiveActiveTab === "favorites") return history.filter((item) => visibleFavorites.has(item.id));
    return groupedHistory[effectiveActiveTab] || [];
  }, [effectiveActiveTab, history, visibleFavorites, groupedHistory]);

  // Filter by search
  const searchedHistory = useMemo(() => {
    if (!searchQuery.trim()) return filteredHistory;
    const q = searchQuery.toLowerCase();
    return filteredHistory.filter(
      (item) =>
        formatHistoryResult(item, historyFormatOptions).toLowerCase().includes(q) ||
        Object.values(item.inputs).some((v) => String(v).toLowerCase().includes(q)) ||
        (item.label && item.label.toLowerCase().includes(q)) ||
        (pageTitleMap[item.page] && pageTitleMap[item.page].toLowerCase().includes(q))
    );
  }, [filteredHistory, historyFormatOptions, searchQuery, pageTitleMap]);

  const sortedHistory = useMemo(
    () =>
      [...searchedHistory].sort((a, b) => (visibleFavorites.has(b.id) ? 1 : 0) - (visibleFavorites.has(a.id) ? 1 : 0)),
    [searchedHistory, visibleFavorites]
  );

  const historyById = useMemo(() => new Map(history.map((item) => [item.id, item])), [history]);
  const comparisonEligibilityById = useMemo(
    () => new Map(history.map((item) => [item.id, getHistoryComparisonEligibility(item)])),
    [history]
  );
  const hasCompatibleComparison = useMemo(() => {
    const counts = new Map<HistoryComparisonMetric, number>();
    for (const item of sortedHistory) {
      const eligibility = comparisonEligibilityById.get(item.id);
      if (!eligibility?.eligible) continue;
      const nextCount = (counts.get(eligibility.compatibilityKey) ?? 0) + 1;
      if (nextCount >= 2) return true;
      counts.set(eligibility.compatibilityKey, nextCount);
    }
    return false;
  }, [comparisonEligibilityById, sortedHistory]);
  const comparisonItems = comparisonSelection.filter((item) => historyById.get(item.id) === item);
  const comparisonReady =
    comparisonItems.length === 2 && areHistoryItemsComparable(comparisonItems[0], comparisonItems[1]);
  const comparisonDialogOpen =
    comparisonReady &&
    comparisonDialogSelection?.length === 2 &&
    comparisonDialogSelection[0] === comparisonItems[0] &&
    comparisonDialogSelection[1] === comparisonItems[1];
  const comparisonMetric = (() => {
    const eligibility = comparisonItems[0] ? comparisonEligibilityById.get(comparisonItems[0].id) : undefined;
    return eligibility?.eligible ? eligibility.compatibilityKey : null;
  })();

  const handleRestore = (item: CalculationHistoryItem) => {
    const persisted = safeSetSessionJSON(PENDING_RESTORE_KEY, {
      page: item.page,
      inputs: item.inputs,
      timestamp: Date.now(),
    });
    if (!persisted) {
      toast.error(t("common.storageOperationFailed"));
      return;
    }

    router.push(`/${item.page}/`);
    toast.success(t("history.restored"));
  };

  const persistenceMessage =
    persistenceError === "unsupported-version"
      ? t("history.persistenceUnsupported")
      : persistenceError === "storage" || favoritePersistenceError === "storage"
        ? t("history.persistenceFailed")
        : persistenceStatus === "saving" || favoritePersistenceStatus === "saving"
          ? t("history.saving")
          : t("history.persistencePending");

  const handleClearAll = () => {
    clearAllHistory();
    clearFavorites();
    setSelectedIds(new Set());
    setComparisonSelection([]);
    setComparisonDialogSelection(null);
    setSelectionMode(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteSelected = () => {
    removeManyFromHistory(selectedIds);
    removeFavorites(selectedIds);
    setSelectedIds(new Set());
    setSelectionMode(null);
  };

  const cancelSelection = () => {
    setSelectedIds(new Set());
    setComparisonSelection([]);
    setComparisonDialogSelection(null);
    setSelectionMode(null);
  };

  const startDeleteSelection = () => {
    setComparisonSelection([]);
    setComparisonDialogSelection(null);
    setSelectionMode("delete");
  };

  const startComparisonSelection = () => {
    setSelectedIds(new Set());
    setComparisonSelection([]);
    setComparisonDialogSelection(null);
    setSelectionMode("compare");
  };

  const clearComparisonForViewChange = () => {
    setComparisonSelection([]);
    setComparisonDialogSelection(null);
  };

  const selectHistoryTab = (tab: string) => {
    setActiveTab(tab);
    clearComparisonForViewChange();
  };

  const toggleComparison = (item: CalculationHistoryItem) => {
    const eligibility = comparisonEligibilityById.get(item.id);
    if (!eligibility?.eligible) return;

    setComparisonSelection((current) => {
      const active = current.filter((selected) => historyById.get(selected.id) === selected);
      if (active.some((selected) => selected.id === item.id)) {
        return active.filter((selected) => selected.id !== item.id);
      }
      if (active.length >= 2) return active;
      const baseline = active[0];
      if (baseline && !areHistoryItemsComparable(baseline, item)) return active;
      return [...active, item];
    });
  };

  const getComparisonDisabledReason = (item: CalculationHistoryItem) => {
    if (comparisonItems.some((selected) => selected.id === item.id)) return null;
    const eligibility = comparisonEligibilityById.get(item.id);
    if (!eligibility?.eligible) {
      return t(COMPARISON_REASON_KEYS[eligibility?.reason ?? "legacy-or-unsupported"]);
    }
    if (comparisonItems.length >= 2) return t("history.selectTwoCompatible");
    const baseline = comparisonItems[0];
    return baseline && !areHistoryItemsComparable(baseline, item) ? t("history.incompatibleMetric") : null;
  };

  const handleDelete = (id: string) => {
    removeFromHistory(id);
    removeFavorites([id]);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(language === "zh" ? "zh-CN" : "en-US");
  };

  const formatInputs = (inputs: Record<string, number | string>) => {
    return Object.entries(inputs)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");
  };

  const exportAllHistory = () => {
    if (history.length === 0) {
      toast.error(t("export.noData"));
      return;
    }
    const data = history.map((item) => ({
      page: pageTitleMap[item.page] || item.page,
      inputs: JSON.stringify(item.inputs),
      result: formatHistoryResult(item, historyFormatOptions),
      label: item.label || "",
      timestamp: formatDate(item.timestamp),
    }));
    exportToCSV(data as unknown as Record<string, unknown>[]);
  };

  if (!isInitialized) {
    return (
      <div className="page-stack" data-tone="neutral">
        <div className="page-header">
          <div>
            <h1 className="page-title">{t("history.title")}</h1>
            <p className="page-description">{t("history.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  const renderEmptyState = () => (
    <Card variant="subtle">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Clock className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold mb-2">{t("history.noHistory")}</h2>
        <p className="text-muted-foreground text-center max-w-sm">{t("history.noHistoryDesc")}</p>
      </CardContent>
    </Card>
  );

  const renderHistoryList = () => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1 xl:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="history-search"
              name="history-search"
              aria-label={t("history.searchPlaceholder")}
              placeholder={t("history.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                clearComparisonForViewChange();
              }}
              className="pl-9 h-9"
            />
          </div>
          {batchMode ? (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} {t("history.itemsSelected")}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteSelected}
                className="text-destructive"
                disabled={selectedIds.size === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t("history.delete")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 sm:h-9 sm:w-9"
                aria-label={t("history.cancelSelection")}
                onClick={cancelSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : comparisonMode ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-9 text-sm tabular-nums text-muted-foreground" aria-live="polite">
                {comparisonItems.length}/2
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setComparisonDialogSelection([...comparisonItems])}
                disabled={!comparisonReady}
              >
                <GitCompareArrows className="mr-1 h-4 w-4" />
                {t("history.compareSelected")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 sm:h-9 sm:w-9"
                aria-label={t("history.cancelSelection")}
                onClick={cancelSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            sortedHistory.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startComparisonSelection}
                  disabled={!hasCompatibleComparison}
                  title={!hasCompatibleComparison ? t("history.selectTwoCompatible") : undefined}
                >
                  <GitCompareArrows className="mr-1 h-4 w-4" />
                  {t("history.compare")}
                </Button>
                <Button variant="ghost" size="sm" onClick={startDeleteSelection}>
                  <CheckSquare className="mr-1 h-4 w-4" />
                  {t("history.select")}
                </Button>
              </div>
            )
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[min(62vh,42rem)] pr-1">
          <div className="divide-y border-y">
            {sortedHistory.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">{t("history.noResults")}</div>
            )}
            <AnimatePresence>
              {sortedHistory.map((item, index) => {
                const comparisonSelected = comparisonItems.some((selected) => selected.id === item.id);
                const comparisonDisabledReason = comparisonMode ? getComparisonDisabledReason(item) : null;
                const comparisonReasonId = comparisonDisabledReason ? `history-comparison-reason-${index}` : undefined;
                return (
                  <motion.div
                    key={item.id}
                    data-history-id={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "group flex items-start justify-between p-4 transition-colors hover:bg-muted/25",
                      visibleFavorites.has(item.id) && "bg-primary/5",
                      (selectedIds.has(item.id) || comparisonSelected) && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {batchMode ? (
                        <button
                          type="button"
                          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md sm:h-7 sm:w-7"
                          aria-label={selectedIds.has(item.id) ? t("history.deselectItem") : t("history.selectItem")}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(item.id);
                          }}
                        >
                          {selectedIds.has(item.id) ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                      ) : comparisonMode ? (
                        <>
                          <button
                            type="button"
                            className={cn(
                              "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md sm:h-7 sm:w-7",
                              comparisonDisabledReason && "cursor-not-allowed opacity-45"
                            )}
                            aria-describedby={comparisonReasonId}
                            aria-disabled={Boolean(comparisonDisabledReason)}
                            aria-label={
                              comparisonSelected
                                ? t("history.deselectFromComparison")
                                : t("history.selectForComparison")
                            }
                            aria-pressed={comparisonSelected}
                            title={comparisonDisabledReason ?? undefined}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (!comparisonDisabledReason) toggleComparison(item);
                            }}
                          >
                            {comparisonSelected ? (
                              <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-primary-foreground">
                                {comparisonItems.findIndex((selected) => selected.id === item.id) + 1}
                              </span>
                            ) : (
                              <Square className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                          {comparisonDisabledReason ? (
                            <span className="sr-only" id={comparisonReasonId}>
                              {comparisonDisabledReason}
                            </span>
                          ) : null}
                        </>
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-base sm:text-lg break-all">
                            {formatHistoryResult(item, historyFormatOptions)}
                          </span>
                          <span className="text-sm px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {pageTitleMap[item.page] || item.page}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</span>
                          {visibleFavorites.has(item.id) && (
                            <Star className="h-4 w-4 fill-primary text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 break-words leading-5">
                          {formatInputs(item.inputs)}
                        </p>
                        {item.label && (
                          <span className="text-xs text-primary font-medium mt-1 block">{item.label}</span>
                        )}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex gap-1 ml-2 shrink-0",
                        selectionMode !== null
                          ? "opacity-100"
                          : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                      )}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        title={t("history.favorites")}
                        aria-label={t("history.favorites")}
                        aria-pressed={visibleFavorites.has(item.id)}
                      >
                        <Star
                          className={cn("h-4 w-4", visibleFavorites.has(item.id) ? "fill-primary text-primary" : "")}
                        />
                      </Button>
                      {selectionMode === null && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(item);
                            }}
                            title={t("history.restore")}
                            aria-label={t("history.restore")}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            title={t("history.delete")}
                            aria-label={t("history.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="page-stack" data-tone="neutral">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("history.title")}</h1>
          <p className="page-description">
            {history.length} {t("history.recorded")}
          </p>
        </div>
        <div className="page-actions grid sm:flex">
          <Button variant="outline" size="sm" onClick={exportAllHistory} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {t("export.csv")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {t("history.clearAll")}
          </Button>
        </div>
      </div>

      {(hasPendingPersistence || hasPendingFavoritePersistence) && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          <span>{persistenceMessage}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void Promise.all([retryPersistence(), retryFavoritePersistence()]);
            }}
          >
            {t("history.retrySave")}
          </Button>
        </div>
      )}

      {history.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="w-full min-w-0">
          <div
            className="mb-4 flex w-full max-w-full flex-nowrap justify-start gap-1 overflow-x-auto rounded-lg bg-muted p-1 whitespace-nowrap [scrollbar-width:thin]"
            role="group"
            aria-label={t("history.filter")}
          >
            <Button
              type="button"
              variant={effectiveActiveTab === "all" ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              aria-pressed={effectiveActiveTab === "all"}
              onClick={() => selectHistoryTab("all")}
            >
              <Clock className="h-4 w-4" />
              {t("history.all")} ({history.length})
            </Button>
            <Button
              type="button"
              variant={effectiveActiveTab === "favorites" ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              aria-pressed={effectiveActiveTab === "favorites"}
              onClick={() => selectHistoryTab("favorites")}
            >
              <Star className="h-4 w-4" />
              {t("history.favorites")} ({history.filter((h) => visibleFavorites.has(h.id)).length})
            </Button>
            {Object.entries(groupedHistory).map(([page, items]) => (
              <Button
                key={page}
                type="button"
                variant={effectiveActiveTab === page ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
                aria-pressed={effectiveActiveTab === page}
                onClick={() => selectHistoryTab(page)}
              >
                {pageTitleMap[page] || page} ({items.length})
              </Button>
            ))}
          </div>
          {renderHistoryList()}
        </div>
      )}
      <ConfirmDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title={t("history.confirmClear")}
        description={t("history.noHistoryDesc")}
        confirmLabel={t("history.clearAll")}
        destructive
        onConfirm={handleClearAll}
      />
      {comparisonItems.length === 2 && comparisonMetric ? (
        <HistoryComparisonDialog
          baseline={comparisonItems[0]}
          comparison={comparisonItems[1]}
          copy={{
            baseline: t("history.baseline"),
            changeFromBaseline: t("history.changeFromBaseline"),
            close: t("common.close"),
            comparison: t("history.comparison"),
            input: t("history.input"),
            percentagePointsUnit: t("history.percentagePointsUnit"),
            periodsUnit: t("history.periodsUnit"),
            recordedOnly: t("history.comparisonRecordedOnly"),
            title: t("history.comparisonTitle"),
            yearsUnit: t("history.yearsUnit"),
          }}
          formatOptions={historyFormatOptions}
          getInputLabel={(key, metric) => {
            const translationKey = COMPARISON_INPUT_LABEL_KEYS[metric][key];
            return translationKey ? t(translationKey) : key;
          }}
          locale={language}
          metricLabel={getComparisonMetricLabel(comparisonMetric, t)}
          onOpenChange={(open) => {
            setComparisonDialogSelection(open && comparisonReady ? [...comparisonItems] : null);
          }}
          open={comparisonDialogOpen}
        />
      ) : null}
    </div>
  );
}
