"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/i18n";
import { useCalculationHistory, CalculationHistoryItem } from "@/hooks/use-calculation-history";
import { NAV_CONFIG } from "@/lib/nav-config";
import { formatCurrency } from "@/lib/utils";
import { PENDING_RESTORE_KEY, STORAGE_PREFIX } from "@/lib/constants";
import { safeGetJSON, safeSetJSON, safeSetSessionJSON } from "@/lib/storage";
import { Clock, Trash2, RotateCcw, Search, Star, FileSpreadsheet, X, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useExport } from "@/hooks/use-export";

const FAVORITES_KEY = `${STORAGE_PREFIX}favorites`;

export default function HistoryPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { history, removeFromHistory, clearAllHistory, isInitialized } = useCalculationHistory({ page: "all" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { exportToCSV } = useExport({ filename: "calculation-history" });

  // Get page title mapping
  const pageTitleMap = useMemo(() => {
    const map: Record<string, string> = {};
    NAV_CONFIG.forEach((section) => {
      section.items.forEach((item) => {
        const key = item.href.replace("/", "");
        map[key] = t(item.titleKey);
      });
    });
    return map;
  }, [t]);

  // Favorites from localStorage
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      return new Set(safeGetJSON<string[]>(FAVORITES_KEY, []));
    } catch {
      return new Set();
    }
  });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      safeSetJSON(FAVORITES_KEY, [...next]);
      return next;
    });
  };

  // Group history by page
  const groupedHistory = useMemo(() => {
    const groups: Record<string, CalculationHistoryItem[]> = {};
    history.forEach((item) => {
      if (!groups[item.page]) groups[item.page] = [];
      groups[item.page].push(item);
    });
    return groups;
  }, [history]);

  // Filter by tab
  const filteredHistory = useMemo(() => {
    if (activeTab === "all") return history;
    if (activeTab === "favorites") return history.filter((item) => favorites.has(item.id));
    return groupedHistory[activeTab] || [];
  }, [activeTab, history, favorites, groupedHistory]);

  // Filter by search
  const searchedHistory = useMemo(() => {
    if (!searchQuery.trim()) return filteredHistory;
    const q = searchQuery.toLowerCase();
    return filteredHistory.filter(
      (item) =>
        formatCurrency(item.result).toLowerCase().includes(q) ||
        Object.values(item.inputs).some((v) => String(v).toLowerCase().includes(q)) ||
        (item.label && item.label.toLowerCase().includes(q)) ||
        (pageTitleMap[item.page] && pageTitleMap[item.page].toLowerCase().includes(q))
    );
  }, [filteredHistory, searchQuery, pageTitleMap]);

  const sortedHistory = useMemo(
    () => [...searchedHistory].sort((a, b) => (favorites.has(b.id) ? 1 : 0) - (favorites.has(a.id) ? 1 : 0)),
    [searchedHistory, favorites]
  );

  const handleRestore = (item: CalculationHistoryItem) => {
    safeSetSessionJSON(PENDING_RESTORE_KEY, {
      page: item.page,
      inputs: item.inputs,
      timestamp: Date.now(),
    });
    router.push(`/${item.page}`);
    toast.success(t("history.restored"));
  };

  const handleClearAll = () => {
    if (window.confirm(t("history.confirmClear") || "Clear all history?")) {
      clearAllHistory();
      setSelectedIds(new Set());
      setBatchMode(false);
      toast.success(t("history.cleared"));
    }
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
    selectedIds.forEach((id) => removeFromHistory(id));
    toast.success(`${selectedIds.size} ${t("history.itemsDeleted")}`);
    setSelectedIds(new Set());
    setBatchMode(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
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
      result: item.result,
      label: item.label || "",
      timestamp: formatDate(item.timestamp),
    }));
    exportToCSV(data as unknown as Record<string, unknown>[]);
  };

  if (!isInitialized) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("history.title") || "History"}</h1>
            <p className="text-muted-foreground mt-2">{t("history.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  const renderEmptyState = () => (
    <Card className="rounded-xl">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Clock className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t("history.noHistory")}</h3>
        <p className="text-muted-foreground text-center max-w-sm">{t("history.noHistoryDesc")}</p>
      </CardContent>
    </Card>
  );

  const renderHistoryList = () => (
    <Card className="rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1 xl:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
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
              <Button variant="ghost" size="sm" onClick={deleteSelected} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                {t("history.delete")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
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
          <div className="space-y-2">
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
                    "flex items-start justify-between p-4 rounded-xl border bg-card group transition-colors",
                    favorites.has(item.id) && "border-primary/30 bg-primary/5",
                    selectedIds.has(item.id) && "ring-2 ring-primary"
                  )}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {batchMode && (
                      <button
                        className="mt-1 shrink-0"
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
                        <span className="font-bold text-base sm:text-lg break-all">{formatCurrency(item.result)}</span>
                        <span className="text-sm px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {pageTitleMap[item.page] || item.page}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</span>
                        {favorites.has(item.id) && <Star className="h-4 w-4 fill-primary text-primary shrink-0" />}
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
                        : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                    >
                      <Star className={cn("h-4 w-4", favorites.has(item.id) ? "fill-primary text-primary" : "")} />
                    </Button>
                    {!batchMode && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(item);
                          }}
                          title={t("history.restore")}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromHistory(item.id);
                          }}
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("history.title") || "Calculation History"}
          </h1>
          <p className="text-muted-foreground mt-2">{history.length} calculations recorded</p>
        </div>
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
          <Button variant="outline" size="sm" onClick={exportAllHistory} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {t("export.csv")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {t("history.clearAll")}
          </Button>
        </div>
      </div>

      {history.length === 0 ? (
        renderEmptyState()
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
          <TabsList className="mb-4 flex w-full max-w-full flex-nowrap justify-start overflow-x-auto px-1 py-1 whitespace-nowrap">
            <TabsTrigger value="all" className="gap-2">
              <Clock className="h-4 w-4" />
              {t("history.all")} ({history.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Star className="h-4 w-4" />
              Favorites ({history.filter((h) => favorites.has(h.id)).length})
            </TabsTrigger>
            {Object.entries(groupedHistory).map(([page, items]) => (
              <TabsTrigger key={page} value={page} className="gap-2">
                {pageTitleMap[page] || page} ({items.length})
              </TabsTrigger>
            ))}
          </TabsList>
          {renderHistoryList()}
        </Tabs>
      )}
    </div>
  );
}
