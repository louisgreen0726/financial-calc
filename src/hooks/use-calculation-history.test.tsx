import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCalculationHistory } from "@/hooks/use-calculation-history";
import { HISTORY_CHANGED_EVENT, HISTORY_CLEAR_GENERATION_KEY, HISTORY_KEY } from "@/lib/constants";
import { storageLockName, withStorageLock } from "@/lib/storage-coordinator";

function storedItem(id: string, page: "tvm" | "risk", timestamp: number) {
  return { id, page, inputs: { value: id }, result: timestamp, timestamp };
}

describe("useCalculationHistory", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("loads valid records while repairing malformed legacy storage", async () => {
    const valid = {
      id: "valid",
      page: "tvm",
      inputs: { rate: "5" },
      result: 100,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify([valid, { id: "broken", timestamp: Date.now() }]));

    const { result } = renderHook(() => useCalculationHistory({ page: "tvm" }));

    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    expect(result.current.history).toEqual([valid]);
    expect(JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null")).toEqual({ version: 1, items: [valid] });
  });

  it("persists a versioned record and ignores non-finite results", async () => {
    const { result } = renderHook(() => useCalculationHistory({ page: "tvm" }));
    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    act(() => {
      void result.current.addToHistory({ rate: "5" }, Number.NaN, "invalid");
    });
    expect(result.current.history).toEqual([]);

    act(() => {
      void result.current.addToHistory({ rate: "5" }, 100, { label: "PV", resultFormat: "currency" });
    });
    await waitFor(() => expect(result.current.history).toHaveLength(1));
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null");
      expect(stored.version).toBe(1);
      expect(stored.items).toHaveLength(1);
      expect(stored.items[0]).toMatchObject({ page: "tvm", result: 100, label: "PV" });
    });
  });

  it("deduplicates equivalent calculations when only their localized label changes", async () => {
    const { result } = renderHook(() => useCalculationHistory({ page: "tvm" }));
    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    await act(async () => {
      await result.current.addToHistory({ rate: "5" }, 100, {
        label: "Present value",
        resultFormat: "currency",
      });
      await result.current.addToHistory({ rate: "5" }, 100, {
        label: "现值",
        resultFormat: "currency",
      });
    });

    await waitFor(() => expect(result.current.history).toHaveLength(1));
    expect(result.current.history[0]).toMatchObject({ label: "现值", resultFormat: "currency" });
    const stored = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null");
    expect(stored.items).toHaveLength(1);
    expect(stored.items[0]).toMatchObject({ label: "现值", resultFormat: "currency" });
  });

  it("does not overwrite an unknown future storage schema", async () => {
    const futureEnvelope = { version: 2, items: [{ future: true }], metadata: { source: "newer-app" } };
    const serialized = JSON.stringify(futureEnvelope);
    window.localStorage.setItem(HISTORY_KEY, serialized);

    const { result } = renderHook(() => useCalculationHistory({ page: "tvm" }));

    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    expect(result.current.history).toEqual([]);
    expect(window.localStorage.getItem(HISTORY_KEY)).toBe(serialized);
  });

  it("applies an add to the latest stored value without resurrecting a stale-tab deletion", async () => {
    const now = Date.now();
    const deletedElsewhere = storedItem("deleted", "tvm", now - 2);
    const retained = storedItem("retained", "risk", now - 1);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, items: [retained, deletedElsewhere] }));
    const { result } = renderHook(() => useCalculationHistory({ page: "tvm" }));
    await waitFor(() => expect(result.current.history).toHaveLength(2));

    // Another tab deletes the TVM record without notifying this stale hook instance.
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, items: [retained] }));
    act(() => {
      void result.current.addToHistory({ value: "new" }, 300);
    });

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null");
      expect(stored.items).toHaveLength(2);
      expect(stored.items.map((item: { id: string }) => item.id)).not.toContain("deleted");
      expect(stored.items).toContainEqual(retained);
      expect(stored.items).toContainEqual(expect.objectContaining({ page: "tvm", result: 300 }));
    });
  });

  it("keeps a pending mutation when a refresh races with its write", async () => {
    const { result } = renderHook(() => useCalculationHistory({ page: "tvm" }));
    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    act(() => {
      void result.current.addToHistory({ rate: "7" }, 700);
      window.dispatchEvent(new CustomEvent(HISTORY_CHANGED_EVENT));
    });

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null");
      expect(stored.items).toContainEqual(expect.objectContaining({ inputs: { rate: "7" }, result: 700 }));
    });
    expect(result.current.history).toContainEqual(expect.objectContaining({ result: 700 }));
  });

  it("limits only the active calculator page", async () => {
    const now = Date.now();
    const oldTvm = storedItem("old-tvm", "tvm", now - 2);
    const unrelated = storedItem("unrelated", "risk", now - 1);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, items: [unrelated, oldTvm] }));
    const { result } = renderHook(() => useCalculationHistory({ page: "tvm", maxItems: 1 }));
    await waitFor(() => expect(result.current.history).toHaveLength(2));

    act(() => {
      void result.current.addToHistory({ value: "replacement" }, 500);
    });

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null");
      expect(stored.items.filter((item: { page: string }) => item.page === "tvm")).toHaveLength(1);
      expect(stored.items).toContainEqual(unrelated);
      expect(stored.items.map((item: { id: string }) => item.id)).not.toContain("old-tvm");
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, 0, -1, 1.5])(
    "falls back to the default page limit for invalid maxItems=%s",
    async (maxItems) => {
      const { result } = renderHook(() => useCalculationHistory({ page: "tvm", maxItems }));
      await waitFor(() => expect(result.current.isInitialized).toBe(true));

      act(() => {
        void result.current.addToHistory({ value: "one" }, 1);
        void result.current.addToHistory({ value: "two" }, 2);
      });

      await waitFor(() => {
        const stored = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null");
        expect(stored.items.filter((item: { page: string }) => item.page === "tvm")).toHaveLength(2);
      });
    }
  );

  it("retains pending history and retries it after a persistence failure", async () => {
    const { result } = renderHook(() => useCalculationHistory({ page: "tvm" }));
    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    const dispatchEvent = vi.spyOn(window, "dispatchEvent");
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    act(() => {
      void result.current.addToHistory({ rate: "5" }, 100);
    });
    await waitFor(() => expect(result.current.history).toHaveLength(1));
    expect(dispatchEvent).not.toHaveBeenCalled();

    setItem.mockRestore();
    dispatchEvent.mockRestore();

    act(() => window.dispatchEvent(new CustomEvent(HISTORY_CHANGED_EVENT)));
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null");
      expect(stored.items).toContainEqual(expect.objectContaining({ page: "tvm", result: 100 }));
    });
  });

  it("exposes pending persistence and resolves it after a manual retry", async () => {
    const { result } = renderHook(() => useCalculationHistory({ page: "tvm" }));
    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    act(() => {
      result.current.removeFromHistory("missing-id");
    });
    await waitFor(() => {
      expect(result.current.hasPendingPersistence).toBe(true);
      expect(result.current.persistenceStatus).toBe("failed");
      expect(result.current.persistenceError).toBe("storage");
    });

    setItem.mockRestore();
    await act(async () => {
      await result.current.retryPersistence();
    });

    await waitFor(() => {
      expect(result.current.hasPendingPersistence).toBe(false);
      expect(result.current.persistenceStatus).toBe("idle");
      expect(result.current.persistenceError).toBeNull();
    });
  });

  it("does not let a pending stale-tab operation recreate history after Settings clears it", async () => {
    const { result } = renderHook(() => useCalculationHistory({ page: "tvm" }));
    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    act(() => {
      result.current.addToHistory({ rate: "5" }, 100);
    });
    await waitFor(() => expect(result.current.hasPendingPersistence).toBe(true));

    setItem.mockRestore();
    window.localStorage.setItem(HISTORY_CLEAR_GENERATION_KEY, "1");
    window.localStorage.removeItem(HISTORY_KEY);
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: HISTORY_CLEAR_GENERATION_KEY })));

    await waitFor(() => expect(result.current.hasPendingPersistence).toBe(false));
    expect(JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null")).toEqual({ version: 1, items: [] });
  });

  it("discards failed pending writes after another tab clears localStorage", async () => {
    const { result } = renderHook(() => useCalculationHistory({ page: "tvm" }));
    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    const originalSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(
      this: Storage,
      key,
      value
    ) {
      if (key === HISTORY_KEY) {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    });

    act(() => {
      result.current.addToHistory({ rate: "5" }, 100);
    });
    await waitFor(() => {
      expect(result.current.hasPendingPersistence).toBe(true);
      expect(result.current.persistenceStatus).toBe("failed");
      expect(result.current.history).toHaveLength(1);
    });

    window.localStorage.clear();
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: window.localStorage })));

    await waitFor(() => {
      expect(result.current.history).toEqual([]);
      expect(result.current.hasPendingPersistence).toBe(false);
      expect(result.current.persistenceStatus).toBe("idle");
      expect(result.current.persistenceError).toBeNull();
    });

    setItem.mockRestore();
    act(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));
    });
    await waitFor(() => expect(window.localStorage.getItem(HISTORY_KEY)).toBeNull());
  });

  it("invalidates a write that is still waiting for the storage lock when another tab clears storage", async () => {
    const { result } = renderHook(() => useCalculationHistory({ page: "tvm" }));
    await waitFor(() => expect(result.current.isInitialized).toBe(true));
    let releaseLock!: () => void;
    const lockBlocker = withStorageLock(storageLockName(HISTORY_KEY), () => {
      return new Promise<void>((resolve) => {
        releaseLock = resolve;
      });
    });

    act(() => {
      result.current.addToHistory({ rate: "7" }, 700);
    });
    await waitFor(() => expect(result.current.hasPendingPersistence).toBe(true));

    window.localStorage.clear();
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: window.localStorage })));
    await waitFor(() => expect(result.current.hasPendingPersistence).toBe(false));

    await act(async () => {
      releaseLock();
      await lockBlocker;
    });

    await waitFor(() => {
      expect(result.current.history).toEqual([]);
      expect(window.localStorage.getItem(HISTORY_KEY)).toBeNull();
    });
  });
});
