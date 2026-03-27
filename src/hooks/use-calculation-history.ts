"use client";

import { useState, useEffect, useCallback } from "react";
import { HISTORY_KEY, MAX_HISTORY_ITEMS, HISTORY_EXPIRY_DAYS } from "@/lib/constants";

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
        const stored = localStorage.getItem(HISTORY_KEY);
        if (stored) {
          const parsed: CalculationHistoryItem[] = JSON.parse(stored);
          // Filter out expired items
          const now = Date.now();
          const expiryMs = HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
          const validItems = parsed.filter((item) => now - item.timestamp < expiryMs);

          // Save back if we removed expired items
          if (validItems.length !== parsed.length) {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(validItems));
          }

          return validItems;
        }
      } catch (error) {
        console.warn("Error loading calculation history:", error);
      }
      return [];
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
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      } catch (error) {
        console.warn("Error saving calculation history:", error);
      }
    }
  }, [history, isInitialized]);

  const addToHistory = useCallback(
    (inputs: Record<string, number | string>, result: number, label?: string) => {
      const newItem: CalculationHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        page,
        inputs,
        result,
        timestamp: Date.now(),
        label,
      };

      setHistory((prev) => {
        const filtered = prev.filter(
          (item) => item.page !== page || JSON.stringify(item.inputs) !== JSON.stringify(inputs)
        );
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
