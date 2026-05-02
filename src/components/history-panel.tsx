"use client";

import { useState, useMemo, useEffect } from "react";
import { useCalculationHistory, CalculationHistoryItem } from "@/hooks/use-calculation-history";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Clock, Trash2, RotateCcw, X, Star, Search, CheckSquare, Square } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { PENDING_RESTORE_KEY, STORAGE_PREFIX } from "@/lib/constants";
import { safeGetJSON, safeGetSessionJSON, safeRemoveSessionItem, safeSetJSON } from "@/lib/storage";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface HistoryPanelProps {
  page: string;
  onRestore?: (inputs: Record<string, number | string>) => void;
  className?: string;
}

const FAVORITES_KEY = `${STORAGE_PREFIX}favorites`;

export function HistoryPanel({ page, onRestore, className }: HistoryPanelProps) {
  const { t } = useLanguage();
  const { pageHistory, removeFromHistory, clearHistory, isInitialized } = useCalculationHistory({ page });
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

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

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return pageHistory;
    const q = searchQuery.toLowerCase();
    return pageHistory.filter(
      (item) =>
        formatCurrency(item.result).toLowerCase().includes(q) ||
        Object.values(item.inputs).some((v) => String(v).toLowerCase().includes(q)) ||
        (item.label && item.label.toLowerCase().includes(q))
    );
  }, [pageHistory, searchQuery]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (favorites.has(b.id) ? 1 : 0) - (favorites.has(a.id) ? 1 : 0)),
    [filtered, favorites]
  );

  const handleRestore = (item: CalculationHistoryItem) => {
    if (onRestore) {
      onRestore(item.inputs);
      toast.success(t("history.restored"));
    }
  };

  useEffect(() => {
    if (!onRestore) {
      return;
    }

    try {
      const parsed = safeGetSessionJSON<{
        page?: string;
        inputs?: Record<string, number | string>;
        timestamp?: number;
      } | null>(PENDING_RESTORE_KEY, null);

      if (!parsed) {
        return;
      }

      const isExpired = typeof parsed.timestamp === "number" && Date.now() - parsed.timestamp > 5 * 60 * 1000;
      if (parsed.page !== page || !parsed.inputs || isExpired) {
        safeRemoveSessionItem(PENDING_RESTORE_KEY);
        return;
      }

      onRestore(parsed.inputs);
      safeRemoveSessionItem(PENDING_RESTORE_KEY);
    } catch {
      safeRemoveSessionItem(PENDING_RESTORE_KEY);
    }
  }, [onRestore, page]);

  const handleClear = () => {
    clearHistory();
    setSelectedIds(new Set());
    setBatchMode(false);
    toast.success(t("history.cleared"));
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
      .join(", ");
  };

  if (!isInitialized || pageHistory.length === 0) {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-22 right-4 lg:bottom-4 z-50 gap-2 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Clock className="h-4 w-4" />
        {t("history.title")} ({pageHistory.length})
      </Button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              "fixed inset-x-3 bottom-20 z-50 max-h-[75vh] rounded-3xl border bg-card shadow-xl sm:inset-x-auto sm:right-4 sm:bottom-36 sm:w-[calc(100vw-2rem)] sm:max-w-[420px] sm:max-h-[min(65vh,600px)] sm:rounded-xl lg:bottom-20",
              className
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
              <CardTitle className="text-sm font-semibold">{t("history.title")}</CardTitle>
              <div className="flex gap-1 items-center">
                {batchMode ? (
                  <>
                    <span className="text-xs text-muted-foreground mr-2">
                      {selectedIds.size} {t("history.itemsSelected")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={deleteSelected}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t("history.delete")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={t("history.cancelSelection")}
                      onClick={() => {
                        setBatchMode(false);
                        setSelectedIds(new Set());
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setBatchMode(true)}
                      title={t("history.select")}
                      aria-label={t("history.select")}
                    >
                      <CheckSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setClearDialogOpen(true)}
                      title={t("history.clearAll")}
                      aria-label={t("history.clearAll")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsOpen(false)}
                      aria-label={t("history.closePanel")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-3">
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={t("history.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>

              <ScrollArea className="h-80">
                <div className="space-y-2">
                  {sorted.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">{t("history.noResults")}</div>
                  )}
                  {sorted.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        "flex items-start justify-between p-3 rounded-lg border bg-card group transition-colors",
                        favorites.has(item.id) && "border-primary/30 bg-primary/5",
                        selectedIds.has(item.id) && "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {batchMode && (
                          <button
                            type="button"
                            className="mt-0.5 shrink-0"
                            aria-label={selectedIds.has(item.id) ? t("history.deselectItem") : t("history.selectItem")}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(item.id);
                            }}
                          >
                            {selectedIds.has(item.id) ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{formatCurrency(item.result)}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</span>
                            {favorites.has(item.id) && <Star className="h-3 w-3 fill-primary text-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{formatInputs(item.inputs)}</p>
                          {item.label && <span className="text-xs text-primary mt-1 block">{item.label}</span>}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "flex gap-1 ml-2",
                          batchMode
                            ? "opacity-100"
                            : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                          title={t("history.favorites")}
                          aria-label={t("history.favorites")}
                        >
                          <Star className={cn("h-3 w-3", favorites.has(item.id) ? "fill-primary text-primary" : "")} />
                        </Button>
                        {!batchMode && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestore(item);
                              }}
                              title={t("history.restore")}
                              aria-label={t("history.restore")}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromHistory(item.id);
                              }}
                              title={t("history.delete")}
                              aria-label={t("history.delete")}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title={t("history.confirmClear") || "Clear all history?"}
        description={t("history.noHistoryDesc")}
        confirmLabel={t("history.clearAll")}
        destructive
        onConfirm={handleClear}
      />
    </>
  );
}
