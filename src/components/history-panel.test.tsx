/// <reference types="vitest/globals" />

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HistoryPanel } from "@/components/history-panel";
import { PENDING_RESTORE_KEY, STORAGE_PREFIX } from "@/lib/constants";

const historyMock = vi.hoisted(() => ({
  removeManyFromHistory: vi.fn(),
  removeFromHistory: vi.fn(),
  clearHistory: vi.fn(),
  history: [
    {
      id: "1",
      page: "tvm",
      inputs: { rate: "5" },
      result: 100,
      timestamp: 1,
      label: "TVM",
    },
  ],
  pageHistory: [
    {
      id: "1",
      page: "tvm",
      inputs: { rate: "5" },
      result: 100,
      timestamp: 1,
      label: "TVM",
    },
  ],
}));

vi.mock("@/hooks/use-calculation-history", () => ({
  useCalculationHistory: () => ({
    history: historyMock.history,
    pageHistory: historyMock.pageHistory,
    removeFromHistory: historyMock.removeFromHistory,
    removeManyFromHistory: historyMock.removeManyFromHistory,
    clearHistory: historyMock.clearHistory,
    isInitialized: true,
  }),
}));

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

describe("HistoryPanel pending restore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    historyMock.removeManyFromHistory.mockClear();
    historyMock.removeFromHistory.mockClear();
    historyMock.clearHistory.mockClear();
  });

  it("consumes pending restore payload and calls onRestore once", async () => {
    const onRestore = vi.fn();
    window.sessionStorage.setItem(
      PENDING_RESTORE_KEY,
      JSON.stringify({
        page: "tvm",
        inputs: { rate: "7", nper: "20" },
        timestamp: Date.now(),
      })
    );

    render(<HistoryPanel page="tvm" onRestore={onRestore} />);

    await waitFor(() => {
      expect(onRestore).toHaveBeenCalledWith({ rate: "7", nper: "20" });
    });

    expect(window.sessionStorage.getItem(PENDING_RESTORE_KEY)).toBeNull();
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it("ignores pending restore payload for a different page", async () => {
    const onRestore = vi.fn();
    window.sessionStorage.setItem(
      PENDING_RESTORE_KEY,
      JSON.stringify({
        page: "bonds",
        inputs: { ytm: "4" },
        timestamp: Date.now(),
      })
    );

    render(<HistoryPanel page="tvm" onRestore={onRestore} />);

    await waitFor(() => {
      expect(onRestore).not.toHaveBeenCalled();
    });

    expect(window.sessionStorage.getItem(PENDING_RESTORE_KEY)).toBeNull();
  });

  it("cleans favorite ids that no longer exist in history", async () => {
    window.localStorage.setItem(`${STORAGE_PREFIX}favorites`, JSON.stringify(["1", "missing"]));

    render(<HistoryPanel page="tvm" onRestore={vi.fn()} />);

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}favorites`) ?? "[]")).toEqual(["1"]);
    });
  });

  it("deletes selected items in one batch operation", async () => {
    render(<HistoryPanel page="tvm" onRestore={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /history.title/ }));
    fireEvent.click(screen.getByRole("button", { name: "history.select" }));
    fireEvent.click(screen.getByRole("button", { name: "history.selectItem" }));
    fireEvent.click(screen.getByRole("button", { name: "history.delete" }));

    await waitFor(() => {
      expect(historyMock.removeManyFromHistory).toHaveBeenCalledTimes(1);
    });
    expect([...historyMock.removeManyFromHistory.mock.calls[0][0]]).toEqual(["1"]);
    expect(historyMock.removeFromHistory).not.toHaveBeenCalled();
  });
});
