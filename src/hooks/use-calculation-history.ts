"use client";

import { useState, useEffect, useCallback } from "react";
import { HISTORY_KEY, MAX_HISTORY_ITEMS, HISTORY_EXPIRY_DAYS } from "@/lib/constants";
import { safeGetJSON, safeSetJSON } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { createHistoryId, stableSerialize } from "@/lib/stable-serialize";

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

  // Load history from localStorage on mount
  useEffect(() => {
    const loadHistory = () => {
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
    };

    const initialHistory = loadHistory();
    queueMicrotask(() => {
      setHistory(initialHistory);
      setIsInitialized(true);
    });
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        safeSetJSON(HISTORY_KEY, history);
      } catch (error) {
        logger.warn("Error saving calculation history:", error);
      }
    }
  }, [history, isInitialized]);

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
        return updated;
      });
    },
    [page, maxItems]
  );

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory((prev) => prev.filter((item) => item.page !== page));
  }, [page]);

  const clearAllHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getPageHistory = useCallback(() => {
    return history.filter((item) => item.page === page);
  }, [history, page]);

  return {
    history,
    pageHistory: getPageHistory(),
    addToHistory,
    removeFromHistory,
    clearHistory,
    clearAllHistory,
    isInitialized,
  };
}
