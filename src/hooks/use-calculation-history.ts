"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CALCULATOR_PAGE_IDS,
  HISTORY_CLEAR_GENERATION_KEY,
  HISTORY_CHANGED_EVENT,
  HISTORY_KEY,
  MAX_HISTORY_ITEMS,
  type CalculatorPageId,
} from "@/lib/constants";
import { safeGetItem, safeGetJSON, safeSetJSON } from "@/lib/storage";
import {
  getPersistenceRetryDelay,
  getStorageGeneration,
  storageLockName,
  withStorageLock,
  type PersistenceResult,
  type PersistenceStatus,
} from "@/lib/storage-coordinator";
import { logger } from "@/lib/logger";
import { createHistoryId, stableSerialize } from "@/lib/stable-serialize";
import {
  createCalculationHistoryEnvelope,
  parseStoredCalculationHistory,
  type CalculationHistoryItem,
  type HistoryResultFormat,
} from "@/lib/calculation-history";

export type { CalculationHistoryItem, HistoryResultFormat } from "@/lib/calculation-history";
export type { PersistenceResult, PersistenceStatus } from "@/lib/storage-coordinator";

export interface AddToHistoryOptions {
  label?: string;
  resultFormat?: HistoryResultFormat;
  resultUnit?: string;
}

interface UseCalculationHistoryOptions {
  page: string;
  maxItems?: number;
}

type HistoryOperation =
  | { type: "add"; item: CalculationHistoryItem; maxItems: number }
  | { type: "remove"; id: string }
  | { type: "removeMany"; ids: ReadonlySet<string> }
  | { type: "clearPage"; page: string }
  | { type: "clearAll" };

type HistoryPersistenceError = "storage" | "unsupported-version" | null;

const HISTORY_LOCK_NAME = storageLockName(HISTORY_KEY);

function isCalculatorPageId(page: string): page is CalculatorPageId {
  return CALCULATOR_PAGE_IDS.includes(page as CalculatorPageId);
}

function normalizeMaxItems(maxItems: number): number {
  if (!Number.isInteger(maxItems) || maxItems <= 0) {
    return MAX_HISTORY_ITEMS;
  }

  return Math.min(maxItems, MAX_HISTORY_ITEMS);
}

function applyHistoryOperation(
  current: CalculationHistoryItem[],
  operation: HistoryOperation
): CalculationHistoryItem[] {
  switch (operation.type) {
    case "add": {
      // Labels are localized display text. They must not turn one calculation into multiple records.
      const nextSignature = stableSerialize({
        inputs: operation.item.inputs,
        resultFormat: operation.item.resultFormat,
        resultUnit: operation.item.resultUnit,
      });
      let pageItemCount = 0;

      return [
        operation.item,
        ...current.filter(
          (item) =>
            item.id !== operation.item.id &&
            (item.page !== operation.item.page ||
              stableSerialize({
                inputs: item.inputs,
                resultFormat: item.resultFormat,
                resultUnit: item.resultUnit,
              }) !== nextSignature)
        ),
      ]
        .sort((a, b) => b.timestamp - a.timestamp)
        .filter((item) => {
          if (item.page !== operation.item.page) {
            return true;
          }

          pageItemCount += 1;
          return pageItemCount <= operation.maxItems;
        });
    }
    case "remove":
      return current.filter((item) => item.id !== operation.id);
    case "removeMany":
      return current.filter((item) => !operation.ids.has(item.id));
    case "clearPage":
      return current.filter((item) => item.page !== operation.page);
    case "clearAll":
      return [];
  }
}

function applyHistoryOperations(
  current: CalculationHistoryItem[],
  operations: readonly HistoryOperation[]
): CalculationHistoryItem[] {
  return operations.reduce(applyHistoryOperation, current);
}

function useSafeStateSetter<T>(
  setter: (value: T | ((previous: T) => T)) => void,
  isMountedRef: React.MutableRefObject<boolean>
) {
  return useCallback(
    (value: T | ((previous: T) => T)) => {
      if (isMountedRef.current) {
        setter(value);
      }
    },
    [setter, isMountedRef]
  );
}

export function useCalculationHistory({ page, maxItems = MAX_HISTORY_ITEMS }: UseCalculationHistoryOptions) {
  const [history, setHistory] = useState<CalculationHistoryItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>("idle");
  const [persistenceError, setPersistenceError] = useState<HistoryPersistenceError>(null);
  const [pendingOperationCount, setPendingOperationCount] = useState(0);
  const pendingOperationsRef = useRef<HistoryOperation[]>([]);
  const pendingGenerationRef = useRef(0);
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);
  const [retryRevision, setRetryRevision] = useState(0);
  const normalizedMaxItems = normalizeMaxItems(maxItems);
  const safeSetHistory = useSafeStateSetter(setHistory, isMountedRef);
  const safeSetInitialized = useSafeStateSetter(setIsInitialized, isMountedRef);
  const safeSetPersistenceStatus = useSafeStateSetter(setPersistenceStatus, isMountedRef);
  const safeSetPersistenceError = useSafeStateSetter(setPersistenceError, isMountedRef);
  const safeSetPendingOperationCount = useSafeStateSetter(setPendingOperationCount, isMountedRef);

  const readHistory = useCallback(() => {
    try {
      const stored = safeGetJSON<unknown>(HISTORY_KEY, []);
      return parseStoredCalculationHistory(stored);
    } catch (error) {
      logger.warn("Error loading calculation history:", error);
    }

    return { items: [], needsWriteBack: false, unsupportedVersion: false };
  }, []);

  const readClearGeneration = useCallback(() => getStorageGeneration(safeGetItem(HISTORY_CLEAR_GENERATION_KEY)), []);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const discardStaleOperations = useCallback(
    (currentGeneration = readClearGeneration()) => {
      if (pendingOperationsRef.current.length === 0 || pendingGenerationRef.current === currentGeneration) {
        return false;
      }

      pendingOperationsRef.current = [];
      pendingGenerationRef.current = currentGeneration;
      clearRetryTimer();
      retryAttemptRef.current = 0;
      safeSetPendingOperationCount(0);
      safeSetPersistenceStatus("idle");
      safeSetPersistenceError(null);
      return true;
    },
    [
      clearRetryTimer,
      readClearGeneration,
      safeSetPendingOperationCount,
      safeSetPersistenceError,
      safeSetPersistenceStatus,
    ]
  );

  const scheduleRetry = useCallback(() => {
    if (typeof window === "undefined" || pendingOperationsRef.current.length === 0 || retryTimerRef.current !== null) {
      return;
    }

    const delay = getPersistenceRetryDelay(retryAttemptRef.current);
    retryAttemptRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      if (isMountedRef.current) {
        setRetryRevision((revision) => revision + 1);
      }
    }, delay);
  }, []);

  const readAndRepairHistory = useCallback(async () => {
    return withStorageLock(HISTORY_LOCK_NAME, () => {
      const parsed = readHistory();
      if (!parsed.needsWriteBack || parsed.unsupportedVersion) {
        return parsed;
      }

      // The lock guarantees this is still the latest value when the migration writes it back.
      if (!safeSetJSON(HISTORY_KEY, createCalculationHistoryEnvelope(parsed.items))) {
        logger.warn("Calculation history could not be repaired.");
      }

      return parsed;
    });
  }, [readHistory]);

  const flushPendingOperations = useCallback(async (): Promise<PersistenceResult> => {
    if (!isInitializedRef.current || pendingOperationsRef.current.length === 0) {
      return "persisted";
    }

    if (discardStaleOperations()) {
      safeSetHistory(readHistory().items);
      return "persisted";
    }

    safeSetPersistenceStatus("saving");
    safeSetPersistenceError(null);

    try {
      const outcome = await withStorageLock(HISTORY_LOCK_NAME, () => {
        if (discardStaleOperations()) {
          return { type: "cleared" as const, items: readHistory().items };
        }

        const operations = pendingOperationsRef.current.slice();
        if (operations.length === 0) {
          return { type: "empty" as const };
        }

        const storedHistory = readHistory();
        if (storedHistory.unsupportedVersion) {
          return { type: "unsupported" as const };
        }

        const nextHistory = applyHistoryOperations(storedHistory.items, operations);
        if (!safeSetJSON(HISTORY_KEY, createCalculationHistoryEnvelope(nextHistory))) {
          return { type: "failed" as const };
        }

        pendingOperationsRef.current.splice(0, operations.length);
        return { type: "persisted" as const, nextHistory };
      });

      if (outcome.type === "persisted") {
        const remainingOperations = pendingOperationsRef.current;
        safeSetHistory(applyHistoryOperations(outcome.nextHistory, remainingOperations));
        safeSetPendingOperationCount(remainingOperations.length);
        if (remainingOperations.length === 0) {
          clearRetryTimer();
          retryAttemptRef.current = 0;
          safeSetPersistenceStatus("idle");
          safeSetPersistenceError(null);
        } else {
          safeSetPersistenceStatus("pending");
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(HISTORY_CHANGED_EVENT));
        }
        return remainingOperations.length === 0 ? "persisted" : "pending";
      }

      if (outcome.type === "empty") {
        safeSetPendingOperationCount(0);
        clearRetryTimer();
        retryAttemptRef.current = 0;
        safeSetPersistenceStatus("idle");
        safeSetPersistenceError(null);
        return "persisted";
      }

      if (outcome.type === "cleared") {
        safeSetHistory(applyHistoryOperations(outcome.items, pendingOperationsRef.current));
        return "persisted";
      }

      const error: Exclude<HistoryPersistenceError, null> =
        outcome.type === "unsupported" ? "unsupported-version" : "storage";
      safeSetPersistenceStatus("failed");
      safeSetPersistenceError(error);
      safeSetPendingOperationCount(pendingOperationsRef.current.length);
      if (error === "storage") {
        scheduleRetry();
      }
      if (error === "unsupported-version") {
        logger.warn("Calculation history uses a newer unsupported storage schema; pending changes were not persisted.");
      } else {
        logger.warn("Calculation history could not be persisted.");
      }
      return "pending";
    } catch (error) {
      safeSetPersistenceStatus("failed");
      safeSetPersistenceError("storage");
      safeSetPendingOperationCount(pendingOperationsRef.current.length);
      scheduleRetry();
      logger.warn("Calculation history could not be persisted:", error);
      return "pending";
    }
  }, [
    clearRetryTimer,
    discardStaleOperations,
    readHistory,
    safeSetHistory,
    safeSetPendingOperationCount,
    safeSetPersistenceError,
    safeSetPersistenceStatus,
    scheduleRetry,
  ]);

  // Load history from localStorage on mount. Operations received during hydration stay queued.
  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    queueMicrotask(() => {
      void readAndRepairHistory().then((initialHistory) => {
        if (cancelled) {
          return;
        }

        safeSetHistory(applyHistoryOperations(initialHistory.items, pendingOperationsRef.current));
        if (pendingOperationsRef.current.length === 0) {
          pendingGenerationRef.current = readClearGeneration();
        }
        isInitializedRef.current = true;
        safeSetInitialized(true);
        safeSetPendingOperationCount(pendingOperationsRef.current.length);
        if (pendingOperationsRef.current.length > 0) {
          void flushPendingOperations();
        }
      });
    });

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      clearRetryTimer();
    };
  }, [
    clearRetryTimer,
    flushPendingOperations,
    readClearGeneration,
    readAndRepairHistory,
    safeSetHistory,
    safeSetInitialized,
    safeSetPendingOperationCount,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const refreshHistory = () => {
      void (async () => {
        const discarded = discardStaleOperations();
        const pendingOperations = pendingOperationsRef.current;
        const storedHistory = pendingOperations.length === 0 ? await readAndRepairHistory() : readHistory();
        safeSetHistory(applyHistoryOperations(storedHistory.items, pendingOperationsRef.current));
        isInitializedRef.current = true;
        safeSetInitialized(true);
        safeSetPendingOperationCount(pendingOperationsRef.current.length);
        if (!discarded && pendingOperationsRef.current.length > 0) {
          void flushPendingOperations();
        }
      })();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === HISTORY_KEY || event.key === HISTORY_CLEAR_GENERATION_KEY) {
        refreshHistory();
      }
    };
    const retryNow = () => {
      if (pendingOperationsRef.current.length > 0) {
        clearRetryTimer();
        void flushPendingOperations();
      }
    };

    window.addEventListener(HISTORY_CHANGED_EVENT, refreshHistory);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("online", retryNow);
    window.addEventListener("focus", retryNow);
    return () => {
      window.removeEventListener(HISTORY_CHANGED_EVENT, refreshHistory);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("online", retryNow);
      window.removeEventListener("focus", retryNow);
    };
  }, [
    clearRetryTimer,
    discardStaleOperations,
    flushPendingOperations,
    readAndRepairHistory,
    readHistory,
    safeSetHistory,
    safeSetInitialized,
    safeSetPendingOperationCount,
  ]);

  useEffect(() => {
    if (retryRevision > 0 && pendingOperationsRef.current.length > 0) {
      void flushPendingOperations();
    }
  }, [flushPendingOperations, retryRevision]);

  const commitOperation = useCallback(
    (operation: HistoryOperation): void => {
      const currentGeneration = readClearGeneration();
      if (discardStaleOperations(currentGeneration)) {
        safeSetHistory(readHistory().items);
      }
      if (pendingOperationsRef.current.length === 0) {
        pendingGenerationRef.current = currentGeneration;
      }
      pendingOperationsRef.current.push(operation);
      safeSetPendingOperationCount(pendingOperationsRef.current.length);
      safeSetHistory((current) => applyHistoryOperation(current, operation));
      safeSetPersistenceStatus("pending");
      safeSetPersistenceError(null);

      if (!isInitializedRef.current) {
        return;
      }

      void flushPendingOperations();
    },
    [
      flushPendingOperations,
      discardStaleOperations,
      readClearGeneration,
      readHistory,
      safeSetHistory,
      safeSetPendingOperationCount,
      safeSetPersistenceError,
      safeSetPersistenceStatus,
    ]
  );

  const addToHistory = useCallback(
    (inputs: Record<string, number | string>, result: number, labelOrOptions?: string | AddToHistoryOptions): void => {
      if (
        !isCalculatorPageId(page) ||
        !Number.isFinite(result) ||
        Object.values(inputs).some(
          (value) =>
            (typeof value !== "string" && typeof value !== "number") ||
            (typeof value === "number" && !Number.isFinite(value))
        )
      ) {
        return;
      }

      const options: AddToHistoryOptions =
        typeof labelOrOptions === "string" ? { label: labelOrOptions } : (labelOrOptions ?? {});
      const newItem: CalculationHistoryItem = {
        id: createHistoryId(),
        page,
        inputs,
        result,
        timestamp: Date.now(),
        label: options.label,
        resultFormat: options.resultFormat,
        resultUnit: options.resultUnit,
      };

      return commitOperation({ type: "add", item: newItem, maxItems: normalizedMaxItems });
    },
    [commitOperation, normalizedMaxItems, page]
  );

  const removeFromHistory = useCallback(
    (id: string): void => {
      if (!id) {
        return;
      }

      return commitOperation({ type: "remove", id });
    },
    [commitOperation]
  );

  const removeManyFromHistory = useCallback(
    (ids: Iterable<string>): void => {
      const idsToRemove = new Set([...ids].filter((id) => id.length > 0));
      if (idsToRemove.size === 0) {
        return;
      }

      return commitOperation({ type: "removeMany", ids: idsToRemove });
    },
    [commitOperation]
  );

  const clearHistory = useCallback((): void => {
    commitOperation({ type: "clearPage", page });
  }, [commitOperation, page]);

  const clearAllHistory = useCallback((): void => {
    commitOperation({ type: "clearAll" });
  }, [commitOperation]);

  const retryPersistence = useCallback((): Promise<PersistenceResult> => {
    clearRetryTimer();
    return flushPendingOperations();
  }, [clearRetryTimer, flushPendingOperations]);

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
    retryPersistence,
    isInitialized,
    persistenceStatus,
    persistenceError,
    hasPendingPersistence: pendingOperationCount > 0,
  };
}
