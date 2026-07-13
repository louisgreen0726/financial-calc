import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHistoryFavorites } from "@/hooks/use-history-favorites";
import { FAVORITES_CLEAR_GENERATION_KEY, FAVORITES_KEY } from "@/lib/constants";
import { storageLockName, withStorageLock } from "@/lib/storage-coordinator";

describe("useHistoryFavorites", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("filters malformed and orphaned favorites from the view without rewriting storage", async () => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(["keep", "orphan", 42, "keep"]));
    const validIds = new Set(["keep"]);
    const { result } = renderHook(() => useHistoryFavorites(validIds));

    await waitFor(() => expect([...result.current.favorites]).toEqual(["keep"]));
    expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "null")).toEqual(["keep", "orphan", 42, "keep"]);
  });

  it("toggles only ids that exist in history and persists changes", async () => {
    const validIds = new Set(["one", "two"]);
    const { result } = renderHook(() => useHistoryFavorites(validIds));

    act(() => {
      void result.current.toggleFavorite("missing");
    });
    expect(result.current.favorites.size).toBe(0);

    act(() => {
      void result.current.toggleFavorite("one");
    });
    await waitFor(() => expect([...result.current.favorites]).toEqual(["one"]));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "null")).toEqual(["one"]));

    act(() => {
      void result.current.clearFavorites();
    });
    await waitFor(() => expect(result.current.favorites.size).toBe(0));
  });

  it("removes only explicitly deleted history ids", async () => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(["one", "two", "orphan"]));
    const validIds = new Set(["one", "two"]);
    const { result } = renderHook(() => useHistoryFavorites(validIds));
    await waitFor(() => expect([...result.current.favorites]).toEqual(["one", "two"]));

    act(() => {
      void result.current.removeFavorites(["one"]);
    });

    await waitFor(() => expect([...result.current.favorites]).toEqual(["two"]));
    expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "null")).toEqual(["two", "orphan"]);
  });

  it("persists the user's intended state when another tab changed a stale favorite", async () => {
    const validIds = new Set(["one"]);
    const { result } = renderHook(() => useHistoryFavorites(validIds));
    await waitFor(() => expect(result.current.favorites.size).toBe(0));

    // This hook still renders the item as unstarred, while storage was starred elsewhere.
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(["one"]));
    act(() => {
      void result.current.toggleFavorite("one");
    });

    await waitFor(() => expect([...result.current.favorites]).toEqual(["one"]));
    expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "null")).toEqual(["one"]);
  });

  it("keeps favorite operations pending and exposes their failure until retry succeeds", async () => {
    const validIds = new Set(["one"]);
    const { result } = renderHook(() => useHistoryFavorites(validIds));
    await waitFor(() => expect(result.current.favorites.size).toBe(0));
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    act(() => {
      result.current.toggleFavorite("one");
    });
    await waitFor(() => {
      expect(result.current.hasPendingPersistence).toBe(true);
      expect(result.current.persistenceStatus).toBe("failed");
      expect(result.current.persistenceError).toBe("storage");
      expect([...result.current.favorites]).toEqual(["one"]);
    });

    setItem.mockRestore();
    await act(async () => {
      await result.current.retryPersistence();
    });

    await waitFor(() => {
      expect(result.current.hasPendingPersistence).toBe(false);
      expect(result.current.persistenceStatus).toBe("idle");
      expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "null")).toEqual(["one"]);
    });
  });

  it("does not let a pending stale-tab operation recreate favorites after Settings clears them", async () => {
    const validIds = new Set(["one"]);
    const { result } = renderHook(() => useHistoryFavorites(validIds));
    await waitFor(() => expect(result.current.favorites.size).toBe(0));
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    act(() => {
      result.current.toggleFavorite("one");
    });
    await waitFor(() => expect(result.current.hasPendingPersistence).toBe(true));

    setItem.mockRestore();
    window.localStorage.setItem(FAVORITES_CLEAR_GENERATION_KEY, "1");
    window.localStorage.removeItem(FAVORITES_KEY);
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: FAVORITES_CLEAR_GENERATION_KEY })));

    await waitFor(() => expect(result.current.hasPendingPersistence).toBe(false));
    expect(window.localStorage.getItem(FAVORITES_KEY)).toBeNull();
  });

  it("discards failed pending writes after another tab clears localStorage", async () => {
    const validIds = new Set(["one"]);
    const { result } = renderHook(() => useHistoryFavorites(validIds));
    await waitFor(() => expect(result.current.favorites.size).toBe(0));
    const originalSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(
      this: Storage,
      key,
      value
    ) {
      if (key === FAVORITES_KEY) {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    });

    act(() => {
      result.current.toggleFavorite("one");
    });
    await waitFor(() => {
      expect(result.current.hasPendingPersistence).toBe(true);
      expect(result.current.persistenceStatus).toBe("failed");
      expect([...result.current.favorites]).toEqual(["one"]);
    });

    window.localStorage.clear();
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: window.localStorage })));

    await waitFor(() => {
      expect(result.current.favorites.size).toBe(0);
      expect(result.current.hasPendingPersistence).toBe(false);
      expect(result.current.persistenceStatus).toBe("idle");
      expect(result.current.persistenceError).toBeNull();
    });

    setItem.mockRestore();
    act(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));
    });
    await waitFor(() => expect(window.localStorage.getItem(FAVORITES_KEY)).toBeNull());
  });

  it("invalidates a write that is still waiting for the storage lock when another tab clears storage", async () => {
    let releaseLock!: () => void;
    const lockBlocker = withStorageLock(storageLockName(FAVORITES_KEY), () => {
      return new Promise<void>((resolve) => {
        releaseLock = resolve;
      });
    });
    const validIds = new Set(["one"]);
    const { result } = renderHook(() => useHistoryFavorites(validIds));
    await waitFor(() => expect(result.current.favorites.size).toBe(0));

    act(() => {
      result.current.toggleFavorite("one");
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
      expect(result.current.favorites.size).toBe(0);
      expect(window.localStorage.getItem(FAVORITES_KEY)).toBeNull();
    });
  });
});
