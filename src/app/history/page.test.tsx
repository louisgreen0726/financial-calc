/// <reference types="vitest/globals" />

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HistoryPage from "@/app/history/page";
import { STORAGE_PREFIX } from "@/lib/constants";

const historyMock = vi.hoisted(() => ({
  removeManyFromHistory: vi.fn<(ids: Iterable<string>) => void>(),
  removeFromHistory: vi.fn<(id: string) => void>(),
  clearAllHistory: vi.fn<() => void>(),
  retryPersistence: vi.fn<() => Promise<"persisted">>(() => Promise.resolve("persisted")),
  push: vi.fn(),
  history: [
    {
      id: "1",
      page: "tvm",
      inputs: { rate: "5" },
      result: 100,
      timestamp: 1,
      label: "TVM",
    },
    {
      id: "2",
      page: "risk",
      inputs: { value: "1000" },
      result: 50,
      timestamp: 2,
      label: "VaR",
    },
  ],
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: historyMock.push,
  }),
}));

vi.mock("@/hooks/use-calculation-history", () => ({
  useCalculationHistory: () => ({
    history: historyMock.history,
    removeFromHistory: historyMock.removeFromHistory,
    removeManyFromHistory: historyMock.removeManyFromHistory,
    clearAllHistory: historyMock.clearAllHistory,
    retryPersistence: historyMock.retryPersistence,
    isInitialized: true,
    persistenceStatus: "idle",
    persistenceError: null,
    hasPendingPersistence: false,
  }),
}));

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: "en",
  }),
}));

describe("HistoryPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    historyMock.removeManyFromHistory.mockClear();
    historyMock.removeFromHistory.mockClear();
    historyMock.clearAllHistory.mockClear();
    historyMock.retryPersistence.mockClear();
    historyMock.push.mockClear();
  });

  it("hides orphaned favorite ids without rewriting them automatically", async () => {
    window.localStorage.setItem(`${STORAGE_PREFIX}favorites`, JSON.stringify(["1", "missing"]));

    render(<HistoryPage />);

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "history.favorites" })[0]).toHaveAttribute("aria-pressed", "true")
    );
    expect(JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}favorites`) ?? "[]")).toEqual(["1", "missing"]);
  });

  it("deletes selected rows in one batch operation", async () => {
    window.localStorage.setItem(`${STORAGE_PREFIX}favorites`, JSON.stringify(["1", "missing"]));
    render(<HistoryPage />);

    fireEvent.click(screen.getByRole("button", { name: "history.select" }));
    fireEvent.click(screen.getAllByRole("button", { name: "history.selectItem" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "history.delete" }));

    await waitFor(() => {
      expect(historyMock.removeManyFromHistory).toHaveBeenCalledTimes(1);
    });

    const removedIds = historyMock.removeManyFromHistory.mock.calls[0]?.[0];
    expect(removedIds).toBeDefined();
    expect([...removedIds]).toEqual(["1"]);
    expect(historyMock.removeFromHistory).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}favorites`) ?? "[]")).toEqual(["missing"]);
    });
  });

  it("does not navigate when the cross-page restore payload cannot be persisted", () => {
    render(<HistoryPage />);
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });

    try {
      fireEvent.click(screen.getAllByRole("button", { name: "history.restore" })[0]);
      expect(historyMock.push).not.toHaveBeenCalled();
    } finally {
      setItem.mockRestore();
    }
  });
});
