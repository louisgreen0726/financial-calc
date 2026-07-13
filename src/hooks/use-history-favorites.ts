"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FAVORITES_CHANGED_EVENT, FAVORITES_CLEAR_GENERATION_KEY, FAVORITES_KEY } from "@/lib/constants";
import { isLocalStorageEventForKey, safeGetItem, safeGetJSON, safeRemoveItem, safeSetJSON } from "@/lib/storage";
import {
  getPersistenceRetryDelay,
  getStorageGeneration,
  storageLockName,
  withStorageLock,
  type PersistenceResult,
  type PersistenceStatus,
} from "@/lib/storage-coordinator";
import { logger } from "@/lib/logger";

type FavoriteOperation =
  { type: "set"; id: string; favorite: boolean } | { type: "remove"; ids: ReadonlySet<string> } | { type: "clear" };

type FavoritePersistenceError = "storage" | null;

const FAVORITES_LOCK_NAME = storageLockName(FAVORITES_KEY);

function readFavoriteIds(): Set<string> {
  const stored = safeGetJSON<unknown>(FAVORITES_KEY, []);
  if (!Array.isArray(stored)) {
    return new Set();
  }

  return new Set(
    stored.filter((value): value is string => typeof value === "string" && value.length > 0 && value.length <= 200)
  );
}

function applyFavoriteOperation(current: Set<string>, operation: FavoriteOperation): Set<string> {
  const next = new Set(current);
  switch (operation.type) {
    case "set":
      if (operation.favorite) {
        next.add(operation.id);
      } else {
        next.delete(operation.id);
      }
      return next;
    case "remove":
      operation.ids.forEach((id) => next.delete(id));
      return next;
    case "clear":
      return new Set();
  }
}

function applyFavoriteOperations(current: Set<string>, operations: readonly FavoriteOperation[]): Set<string> {
  return operations.reduce(applyFavoriteOperation, current);
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

export function useHistoryFavorites(validHistoryIds: Set<string>) {
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>("idle");
  const [persistenceError, setPersistenceError] = useState<FavoritePersistenceError>(null);
  const [pendingOperationCount, setPendingOperationCount] = useState(0);
  const favoritesRef = useRef<Set<string>>(new Set());
  const pendingOperationsRef = useRef<FavoriteOperation[]>([]);
  const pendingGenerationRef = useRef(0);
  const externalClearRevisionRef = useRef(0);
  const isMountedRef = useRef(true);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);
  const [retryRevision, setRetryRevision] = useState(0);
  const safeSetFavorites = useSafeStateSetter(setFavorites, isMountedRef);
  const safeSetPersistenceStatus = useSafeStateSetter(setPersistenceStatus, isMountedRef);
  const safeSetPersistenceError = useSafeStateSetter(setPersistenceError, isMountedRef);
  const safeSetPendingOperationCount = useSafeStateSetter(setPendingOperationCount, isMountedRef);

  const visibleFavorites = useMemo(
    () => new Set([...favorites].filter((id) => validHistoryIds.has(id))),
    [favorites, validHistoryIds]
  );

  const readClearGeneration = useCallback(() => getStorageGeneration(safeGetItem(FAVORITES_CLEAR_GENERATION_KEY)), []);

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
      const nextFavorites = readFavoriteIds();
      favoritesRef.current = nextFavorites;
      safeSetFavorites(nextFavorites);
      safeSetPendingOperationCount(0);
      safeSetPersistenceStatus("idle");
      safeSetPersistenceError(null);
      return true;
    },
    [
      clearRetryTimer,
      readClearGeneration,
      safeSetFavorites,
      safeSetPendingOperationCount,
      safeSetPersistenceError,
      safeSetPersistenceStatus,
    ]
  );

  const handleExternalStorageClear = useCallback(() => {
    externalClearRevisionRef.current += 1;
    pendingOperationsRef.current = [];
    pendingGenerationRef.current = readClearGeneration();
    clearRetryTimer();
    retryAttemptRef.current = 0;
    safeRemoveItem(FAVORITES_KEY);
    const nextFavorites = new Set<string>();
    favoritesRef.current = nextFavorites;
    safeSetFavorites(nextFavorites);
    safeSetPendingOperationCount(0);
    safeSetPersistenceStatus("idle");
    safeSetPersistenceError(null);
  }, [
    clearRetryTimer,
    readClearGeneration,
    safeSetFavorites,
    safeSetPendingOperationCount,
    safeSetPersistenceError,
    safeSetPersistenceStatus,
  ]);

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

  const flushPendingOperations = useCallback(async (): Promise<PersistenceResult> => {
    if (pendingOperationsRef.current.length === 0) {
      return "persisted";
    }

    if (discardStaleOperations()) {
      return "persisted";
    }

    safeSetPersistenceStatus("saving");
    safeSetPersistenceError(null);
    const externalClearRevision = externalClearRevisionRef.current;

    try {
      const outcome = await withStorageLock(FAVORITES_LOCK_NAME, () => {
        if (externalClearRevision !== externalClearRevisionRef.current) {
          return { type: "cleared" as const };
        }
        if (discardStaleOperations()) {
          return { type: "cleared" as const };
        }

        const operations = pendingOperationsRef.current.slice();
        if (operations.length === 0) {
          return { type: "empty" as const };
        }

        const nextFavorites = applyFavoriteOperations(readFavoriteIds(), operations);
        if (!safeSetJSON(FAVORITES_KEY, [...nextFavorites])) {
          return { type: "failed" as const };
        }

        pendingOperationsRef.current.splice(0, operations.length);
        return { type: "persisted" as const, nextFavorites };
      });

      if (externalClearRevision !== externalClearRevisionRef.current) {
        return "persisted";
      }

      if (outcome.type === "persisted") {
        const remainingOperations = pendingOperationsRef.current;
        const nextFavorites = applyFavoriteOperations(outcome.nextFavorites, remainingOperations);
        favoritesRef.current = nextFavorites;
        safeSetFavorites(nextFavorites);
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
          window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
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
        return "persisted";
      }

      safeSetPersistenceStatus("failed");
      safeSetPersistenceError("storage");
      safeSetPendingOperationCount(pendingOperationsRef.current.length);
      scheduleRetry();
      logger.warn("History favorites could not be persisted.");
      return "pending";
    } catch (error) {
      if (externalClearRevision !== externalClearRevisionRef.current) {
        return "persisted";
      }
      safeSetPersistenceStatus("failed");
      safeSetPersistenceError("storage");
      safeSetPendingOperationCount(pendingOperationsRef.current.length);
      scheduleRetry();
      logger.warn("History favorites could not be persisted:", error);
      return "pending";
    }
  }, [
    clearRetryTimer,
    discardStaleOperations,
    safeSetFavorites,
    safeSetPendingOperationCount,
    safeSetPersistenceError,
    safeSetPersistenceStatus,
    scheduleRetry,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    const initialClearRevision = externalClearRevisionRef.current;
    queueMicrotask(() => {
      if (initialClearRevision !== externalClearRevisionRef.current) {
        return;
      }
      const nextFavorites = applyFavoriteOperations(readFavoriteIds(), pendingOperationsRef.current);
      if (pendingOperationsRef.current.length === 0) {
        pendingGenerationRef.current = readClearGeneration();
      }
      favoritesRef.current = nextFavorites;
      safeSetFavorites(nextFavorites);
      safeSetPendingOperationCount(pendingOperationsRef.current.length);
      if (pendingOperationsRef.current.length > 0) {
        void flushPendingOperations();
      }
    });

    return () => {
      isMountedRef.current = false;
      clearRetryTimer();
    };
  }, [clearRetryTimer, flushPendingOperations, readClearGeneration, safeSetFavorites, safeSetPendingOperationCount]);

  useEffect(() => {
    const refreshFavorites = () => {
      const discarded = discardStaleOperations();
      const nextFavorites = applyFavoriteOperations(readFavoriteIds(), pendingOperationsRef.current);
      favoritesRef.current = nextFavorites;
      safeSetFavorites(nextFavorites);
      safeSetPendingOperationCount(pendingOperationsRef.current.length);
      if (!discarded && pendingOperationsRef.current.length > 0) {
        void flushPendingOperations();
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null && isLocalStorageEventForKey(event, FAVORITES_KEY)) {
        handleExternalStorageClear();
      } else if (
        isLocalStorageEventForKey(event, FAVORITES_KEY) ||
        isLocalStorageEventForKey(event, FAVORITES_CLEAR_GENERATION_KEY)
      ) {
        refreshFavorites();
      }
    };
    const retryNow = () => {
      if (pendingOperationsRef.current.length > 0) {
        clearRetryTimer();
        void flushPendingOperations();
      }
    };

    window.addEventListener(FAVORITES_CHANGED_EVENT, refreshFavorites);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("online", retryNow);
    window.addEventListener("focus", retryNow);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, refreshFavorites);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("online", retryNow);
      window.removeEventListener("focus", retryNow);
    };
  }, [
    clearRetryTimer,
    discardStaleOperations,
    flushPendingOperations,
    handleExternalStorageClear,
    safeSetFavorites,
    safeSetPendingOperationCount,
  ]);

  useEffect(() => {
    if (retryRevision > 0 && pendingOperationsRef.current.length > 0) {
      void flushPendingOperations();
    }
  }, [flushPendingOperations, retryRevision]);

  const commitOperation = useCallback(
    (operation: FavoriteOperation): void => {
      const currentGeneration = readClearGeneration();
      discardStaleOperations(currentGeneration);
      if (pendingOperationsRef.current.length === 0) {
        pendingGenerationRef.current = currentGeneration;
      }
      pendingOperationsRef.current.push(operation);
      safeSetPendingOperationCount(pendingOperationsRef.current.length);
      const nextFavorites = applyFavoriteOperation(favoritesRef.current, operation);
      favoritesRef.current = nextFavorites;
      safeSetFavorites(nextFavorites);
      safeSetPersistenceStatus("pending");
      safeSetPersistenceError(null);
      void flushPendingOperations();
    },
    [
      flushPendingOperations,
      discardStaleOperations,
      readClearGeneration,
      safeSetFavorites,
      safeSetPendingOperationCount,
      safeSetPersistenceError,
      safeSetPersistenceStatus,
    ]
  );

  const toggleFavorite = useCallback(
    (id: string): void => {
      if (!validHistoryIds.has(id)) {
        return;
      }

      return commitOperation({ type: "set", id, favorite: !favoritesRef.current.has(id) });
    },
    [commitOperation, validHistoryIds]
  );

  const removeFavorites = useCallback(
    (ids: Iterable<string>): void => {
      const idsToRemove = new Set([...ids].filter((id) => id.length > 0));
      if (idsToRemove.size === 0) {
        return;
      }

      return commitOperation({ type: "remove", ids: idsToRemove });
    },
    [commitOperation]
  );

  const clearFavorites = useCallback((): void => {
    commitOperation({ type: "clear" });
  }, [commitOperation]);

  const retryPersistence = useCallback((): Promise<PersistenceResult> => {
    clearRetryTimer();
    return flushPendingOperations();
  }, [clearRetryTimer, flushPendingOperations]);

  return {
    favorites: visibleFavorites,
    toggleFavorite,
    removeFavorites,
    clearFavorites,
    retryPersistence,
    persistenceStatus,
    persistenceError,
    hasPendingPersistence: pendingOperationCount > 0,
  };
}
