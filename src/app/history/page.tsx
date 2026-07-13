"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/i18n";
import { useCalculationHistory, CalculationHistoryItem } from "@/hooks/use-calculation-history";
import { NAV_CONFIG } from "@/lib/nav-config";
import { formatHistoryResult } from "@/lib/history-format";
import { PENDING_RESTORE_KEY } from "@/lib/constants";
import { safeSetSessionJSON } from "@/lib/storage";
import { Clock, Trash2, RotateCcw, Search, Star, FileSpreadsheet, X, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useExport } from "@/hooks/use-export";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useHistoryFavorites } from "@/hooks/use-history-favorites";

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
  const [batchMode, setBatchMode] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

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
    setBatchMode(false);
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
    setBatchMode(false);
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
                onClick={() => {
                  setBatchMode(false);
                  setSelectedIds(new Set());
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            sortedHistory.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setBatchMode(true)}>
                <CheckSquare className="h-4 w-4 mr-1" />
                {t("history.select")}
              </Button>
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
              {sortedHistory.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "group flex items-start justify-between p-4 transition-colors hover:bg-muted/25",
                    visibleFavorites.has(item.id) && "bg-primary/5",
                    selectedIds.has(item.id) && "ring-2 ring-primary"
                  )}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {batchMode && (
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
                    )}
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
                      {item.label && <span className="text-xs text-primary font-medium mt-1 block">{item.label}</span>}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex gap-1 ml-2 shrink-0",
                      batchMode
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
                    {!batchMode && (
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
              ))}
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
              onClick={() => setActiveTab("all")}
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
              onClick={() => setActiveTab("favorites")}
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
                onClick={() => setActiveTab(page)}
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
    </div>
  );
}
