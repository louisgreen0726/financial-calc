"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useCalculationHistory, CalculationHistoryItem } from "@/hooks/use-calculation-history";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Clock, Trash2, RotateCcw, X, Star, Search, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { PENDING_RESTORE_KEY } from "@/lib/constants";
import { safeGetSessionJSON, safeRemoveSessionItem } from "@/lib/storage";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatHistoryResult } from "@/lib/history-format";
import { useHistoryFavorites } from "@/hooks/use-history-favorites";

interface HistoryPanelProps {
  page: string;
  onRestore?: (inputs: Record<string, number | string>) => void;
  className?: string;
}

const PENDING_RESTORE_MAX_AGE_MS = 5 * 60 * 1000;

function parsePendingRestore(value: unknown, page: string, now = Date.now()): Record<string, number | string> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    candidate.page !== page ||
    typeof candidate.timestamp !== "number" ||
    !Number.isFinite(candidate.timestamp) ||
    Math.abs(now - candidate.timestamp) > PENDING_RESTORE_MAX_AGE_MS ||
    typeof candidate.inputs !== "object" ||
    candidate.inputs === null ||
    Array.isArray(candidate.inputs)
  ) {
    return null;
  }

  const entries = Object.entries(candidate.inputs);
  if (
    entries.length > 100 ||
    entries.some(
      ([key, input]) =>
        key.length === 0 ||
        key.length > 100 ||
        (typeof input === "string" ? input.length > 20_000 : typeof input !== "number" || !Number.isFinite(input))
    )
  ) {
    return null;
  }

  return Object.fromEntries(entries) as Record<string, number | string>;
}

export function HistoryPanel({ page, onRestore, className }: HistoryPanelProps) {
  const { t, language } = useLanguage();
  const {
    history,
    pageHistory,
    removeFromHistory,
    removeManyFromHistory,
    clearHistory,
    retryPersistence,
    isInitialized,
    persistenceStatus,
    persistenceError,
    hasPendingPersistence,
  } = useCalculationHistory({ page });
  const panelId = `${page}-history-panel`;
  const panelTitleId = `${page}-history-panel-title`;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);

  const validHistoryIds = useMemo(() => new Set(history.map((item) => item.id)), [history]);
  const {
    favorites: visibleFavorites,
    toggleFavorite,
    removeFavorites,
    retryPersistence: retryFavoritePersistence,
    persistenceStatus: favoritePersistenceStatus,
    persistenceError: favoritePersistenceError,
    hasPendingPersistence: hasPendingFavoritePersistence,
  } = useHistoryFavorites(validHistoryIds);
  const historyFormatOptions = useMemo(
    () => ({
      locale: language,
      notAvailable: t("common.notAvailable"),
      periodsUnit: t("history.periodsUnit"),
      yearsUnit: t("history.yearsUnit"),
    }),
    [language, t]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      const frame = window.requestAnimationFrame(() => {
        (searchInputRef.current ?? panelRef.current)?.focus();
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      toggleButtonRef.current?.focus();
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return pageHistory;
    const q = searchQuery.toLowerCase();
    return pageHistory.filter(
      (item) =>
        formatHistoryResult(item, historyFormatOptions).toLowerCase().includes(q) ||
        Object.values(item.inputs).some((v) => String(v).toLowerCase().includes(q)) ||
        (item.label && item.label.toLowerCase().includes(q))
    );
  }, [historyFormatOptions, pageHistory, searchQuery]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (visibleFavorites.has(b.id) ? 1 : 0) - (visibleFavorites.has(a.id) ? 1 : 0)),
    [filtered, visibleFavorites]
  );

  const handleRestore = (item: CalculationHistoryItem) => {
    if (onRestore) {
      onRestore(item.inputs);
      setIsOpen(false);
      toast.success(t("history.restored"));
    }
  };

  useEffect(() => {
    if (!onRestore) {
      return;
    }

    try {
      const parsed = safeGetSessionJSON<unknown>(PENDING_RESTORE_KEY, null);

      if (!parsed) {
        return;
      }

      const pendingInputs = parsePendingRestore(parsed, page);
      if (!pendingInputs) {
        safeRemoveSessionItem(PENDING_RESTORE_KEY);
        return;
      }

      onRestore(pendingInputs);
      safeRemoveSessionItem(PENDING_RESTORE_KEY);
    } catch {
      safeRemoveSessionItem(PENDING_RESTORE_KEY);
    }
  }, [onRestore, page]);

  const persistenceMessage =
    persistenceError === "unsupported-version"
      ? t("history.persistenceUnsupported")
      : persistenceError === "storage" || favoritePersistenceError === "storage"
        ? t("history.persistenceFailed")
        : persistenceStatus === "saving" || favoritePersistenceStatus === "saving"
          ? t("history.saving")
          : t("history.persistencePending");

  const handleClear = () => {
    const shouldMoveFocus = pageHistory.length > 0;
    clearHistory();
    removeFavorites(pageHistory.map((item) => item.id));
    setSelectedIds(new Set());
    setBatchMode(false);
    if (shouldMoveFocus) {
      window.requestAnimationFrame(() => document.getElementById("main-content")?.focus());
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
    const shouldMoveFocus = pageHistory.every((item) => selectedIds.has(item.id));
    removeManyFromHistory(selectedIds);
    removeFavorites(selectedIds);
    setSelectedIds(new Set());
    setBatchMode(false);
    if (shouldMoveFocus) {
      window.requestAnimationFrame(() => document.getElementById("main-content")?.focus());
    }
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
      .join(", ");
  };

  if (!isInitialized || (pageHistory.length === 0 && !hasPendingPersistence && !hasPendingFavoritePersistence)) {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <Button
        ref={toggleButtonRef}
        variant="outline"
        size="sm"
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] right-4 z-50 gap-2 shadow-lg lg:bottom-4"
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Clock className="h-4 w-4" />
        {t("history.title")} ({pageHistory.length})
      </Button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            id={panelId}
            role="dialog"
            aria-modal="false"
            aria-labelledby={panelTitleId}
            tabIndex={-1}
            className={cn(
              "fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] z-50 max-h-[min(72vh,34rem)] rounded-3xl border bg-card shadow-xl sm:inset-x-auto sm:right-4 sm:bottom-36 sm:w-[calc(100vw-2rem)] sm:max-w-[420px] sm:max-h-[min(65vh,600px)] sm:rounded-xl lg:bottom-20",
              className
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
              <CardTitle id={panelTitleId} className="text-sm font-semibold">
                {t("history.title")}
              </CardTitle>
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
                      disabled={selectedIds.size === 0}
                      onClick={deleteSelected}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t("history.delete")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8"
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
                      className="h-10 w-10 sm:h-8 sm:w-8"
                      onClick={() => setBatchMode(true)}
                      title={t("history.select")}
                      aria-label={t("history.select")}
                    >
                      <CheckSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8"
                      onClick={() => setClearDialogOpen(true)}
                      title={t("history.clearAll")}
                      aria-label={t("history.clearAll")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 sm:h-8 sm:w-8"
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
              {(hasPendingPersistence || hasPendingFavoritePersistence) && (
                <div
                  className="mb-3 flex items-center justify-between gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-foreground"
                  role="status"
                >
                  <span>{persistenceMessage}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      void Promise.all([retryPersistence(), retryFavoritePersistence()]);
                    }}
                  >
                    {t("history.retrySave")}
                  </Button>
                </div>
              )}
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  aria-label={t("history.searchPlaceholder")}
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
                        visibleFavorites.has(item.id) && "border-primary/30 bg-primary/5",
                        selectedIds.has(item.id) && "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {batchMode && (
                          <button
                            type="button"
                            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md sm:h-6 sm:w-6"
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
                            <span className="font-semibold text-sm">
                              {formatHistoryResult(item, historyFormatOptions)}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</span>
                            {visibleFavorites.has(item.id) && (
                              <Star className="h-3 w-3 fill-primary text-primary shrink-0" />
                            )}
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
                            : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 sm:h-8 sm:w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                          title={t("history.favorites")}
                          aria-label={t("history.favorites")}
                          aria-pressed={visibleFavorites.has(item.id)}
                        >
                          <Star
                            className={cn("h-3 w-3", visibleFavorites.has(item.id) ? "fill-primary text-primary" : "")}
                          />
                        </Button>
                        {!batchMode && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 sm:h-8 sm:w-8"
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
                              className="h-10 w-10 text-destructive hover:text-destructive sm:h-8 sm:w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                const shouldMoveFocus = pageHistory.length === 1;
                                handleDelete(item.id);
                                if (shouldMoveFocus) {
                                  window.requestAnimationFrame(() => document.getElementById("main-content")?.focus());
                                }
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
        title={t("history.confirmClear")}
        description={t("history.noHistoryDesc")}
        confirmLabel={t("history.clearAll")}
        destructive
        onConfirm={handleClear}
      />
    </>
  );
}
