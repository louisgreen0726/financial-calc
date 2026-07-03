/// <reference types="vitest/globals" />

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HistoryPage from "@/app/history/page";
import { STORAGE_PREFIX } from "@/lib/constants";

const historyMock = vi.hoisted(() => ({
  removeManyFromHistory: vi.fn(),
  removeFromHistory: vi.fn(),
  clearAllHistory: vi.fn(),
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
    isInitialized: true,
  }),
}));

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

describe("HistoryPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    historyMock.removeManyFromHistory.mockClear();
    historyMock.removeFromHistory.mockClear();
    historyMock.clearAllHistory.mockClear();
    historyMock.push.mockClear();
  });

  it("cleans favorite ids that no longer exist in history", async () => {
    window.localStorage.setItem(`${STORAGE_PREFIX}favorites`, JSON.stringify(["1", "missing"]));

    render(<HistoryPage />);

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}favorites`) ?? "[]")).toEqual(["1"]);
    });
  });

  it("deletes selected rows in one batch operation", async () => {
    render(<HistoryPage />);

    fireEvent.click(screen.getByRole("button", { name: "history.select" }));
    fireEvent.click(screen.getAllByRole("button", { name: "history.selectItem" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "history.delete" }));

    await waitFor(() => {
      expect(historyMock.removeManyFromHistory).toHaveBeenCalledTimes(1);
    });

    expect([...historyMock.removeManyFromHistory.mock.calls[0][0]]).toEqual(["1"]);
    expect(historyMock.removeFromHistory).not.toHaveBeenCalled();
  });
});
