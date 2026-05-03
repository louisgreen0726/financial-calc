"use client";

import { useState, useEffect, useCallback } from "react";
import { HISTORY_KEY, MAX_HISTORY_ITEMS, HISTORY_EXPIRY_DAYS } from "@/lib/constants";
import { safeGetJSON, safeSetJSON } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { createHistoryId, stableSerialize } from "@/lib/stable-serialize";

const HISTORY_CHANGED_EVENT = "financial-calc-history-changed";

export interface CalculationHistoryItem {
  id: string;
  page: string;
  inputs: Record<string, number | string>;
  result: number;
  timestamp: number;
  label?: string;
}

interface UseCalculationHistoryOptions {
  page: string;
  maxItems?: number;
}

export function useCalculationHistory({ page, maxItems = MAX_HISTORY_ITEMS }: UseCalculationHistoryOptions) {
  const [history, setHistory] = useState<CalculationHistoryItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadHistory = useCallback(() => {
    try {
      const stored = safeGetJSON<CalculationHistoryItem[]>(HISTORY_KEY, []);
      if (Array.isArray(stored)) {
        const now = Date.now();
        const expiryMs = HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        const validItems = stored.filter((item) => now - item.timestamp < expiryMs);
        if (validItems.length !== stored.length) {
          safeSetJSON(HISTORY_KEY, validItems);
        }
        return validItems;
      }
    } catch (error) {
      logger.warn("Error loading calculation history:", error);
    }
    return [] as CalculationHistoryItem[];
  }, []);

  const persistHistory = useCallback((nextHistory: CalculationHistoryItem[]) => {
    try {
      safeSetJSON(HISTORY_KEY, nextHistory);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(HISTORY_CHANGED_EVENT));
      }
    } catch (error) {
      logger.warn("Error saving calculation history:", error);
    }
  }, []);

  // Load history from localStorage on mount
  useEffect(() => {
    const initialHistory = loadHistory();
    queueMicrotask(() => {
      setHistory(initialHistory);
      setIsInitialized(true);
    });
  }, [loadHistory]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const refreshHistory = () => {
      setHistory(loadHistory());
      setIsInitialized(true);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === HISTORY_KEY) {
        refreshHistory();
      }
    };

    window.addEventListener(HISTORY_CHANGED_EVENT, refreshHistory);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(HISTORY_CHANGED_EVENT, refreshHistory);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadHistory]);

  const addToHistory = useCallback(
    (inputs: Record<string, number | string>, result: number, label?: string) => {
      const newItem: CalculationHistoryItem = {
        id: createHistoryId(),
        page,
        inputs,
        result,
        timestamp: Date.now(),
        label,
      };

      setHistory((prev) => {
        const nextSignature = stableSerialize(inputs);
        const filtered = prev.filter((item) => item.page !== page || stableSerialize(item.inputs) !== nextSignature);
        const updated = [newItem, ...filtered].slice(0, maxItems);
        queueMicrotask(() => persistHistory(updated));
        return updated;
      });
    },
    [page, maxItems, persistHistory]
  );

  const removeFromHistory = useCallback(
    (id: string) => {
      setHistory((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        queueMicrotask(() => persistHistory(updated));
        return updated;
      });
    },
    [persistHistory]
  );

  const removeManyFromHistory = useCallback(
    (ids: Iterable<string>) => {
      const idsToRemove = new Set(ids);
      if (idsToRemove.size === 0) {
        return;
      }

      setHistory((prev) => {
        const updated = prev.filter((item) => !idsToRemove.has(item.id));
        queueMicrotask(() => persistHistory(updated));
        return updated;
      });
    },
    [persistHistory]
  );

  const clearHistory = useCallback(() => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.page !== page);
      queueMicrotask(() => persistHistory(updated));
      return updated;
    });
  }, [page, persistHistory]);

  const clearAllHistory = useCallback(() => {
    setHistory([]);
    queueMicrotask(() => persistHistory([]));
  }, [persistHistory]);

  const getPageHistory = useCallback(() => {
    return history.filter((item) => item.page === page);
  }, [history, page]);

  return {
    history,
    pageHistory: getPageHistory(),
    addToHistory,
    removeFromHistory,
    removeManyFromHistory,
    clearHistory,
    clearAllHistory,
    isInitialized,
  };
}
