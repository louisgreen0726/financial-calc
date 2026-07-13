/// <reference types="vitest/globals" />

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import HistoryPage from "@/app/history/page";
import type { CalculationHistoryItem } from "@/lib/calculation-history";
import { STORAGE_PREFIX } from "@/lib/constants";

const historyMock = vi.hoisted(() => ({
  removeManyFromHistory: vi.fn<(ids: Iterable<string>) => void>(),
  removeFromHistory: vi.fn<(id: string) => void>(),
  clearAllHistory: vi.fn<() => void>(),
  retryPersistence: vi.fn<() => Promise<"persisted">>(() => Promise.resolve("persisted")),
  push: vi.fn(),
  isInitialized: true,
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
  ] as CalculationHistoryItem[],
}));

const toastMock = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

const exportMock = vi.hoisted(() => ({
  exportToCSV: vi.fn(),
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
    isInitialized: historyMock.isInitialized,
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

vi.mock("sonner", () => ({ toast: toastMock }));

vi.mock("@/hooks/use-export", () => ({
  useExport: () => exportMock,
}));

describe("HistoryPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    historyMock.history = [
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
    ];
    historyMock.isInitialized = true;
    historyMock.removeManyFromHistory.mockClear();
    historyMock.removeFromHistory.mockClear();
    historyMock.clearAllHistory.mockClear();
    historyMock.retryPersistence.mockClear();
    historyMock.push.mockClear();
    toastMock.error.mockClear();
    toastMock.success.mockClear();
    exportMock.exportToCSV.mockClear();
  });

  it("keeps the History layout stable while client storage initializes", () => {
    historyMock.isInitialized = false;

    const { container } = render(<HistoryPage />);

    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("history.loading");
    expect(screen.getByRole("heading", { name: "history.title" })).toBeInTheDocument();
    expect(container.querySelectorAll("[data-history-loading-row]")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "export.csv" })).not.toBeInTheDocument();
  });

  it("exports stable raw history fields alongside localized display values", () => {
    historyMock.history = [
      {
        id: "capm-export",
        page: "equity",
        inputs: { rf: "3.5", beta: "1.2", rm: "10" },
        result: 0.08,
        timestamp: 1_700_000_000_000,
        label: "CAPM",
        resultFormat: "percentDecimal",
        resultUnit: "percentage points",
      },
    ];
    render(<HistoryPage />);

    fireEvent.click(screen.getByRole("button", { name: "export.csv" }));

    expect(exportMock.exportToCSV).toHaveBeenCalledOnce();
    expect(exportMock.exportToCSV).toHaveBeenCalledWith([
      {
        id: "capm-export",
        pageId: "equity",
        page: "nav.investing.equity.title",
        inputs: JSON.stringify({ rf: "3.5", beta: "1.2", rm: "10" }),
        result: "8%",
        rawResult: 0.08,
        resultFormat: "percentDecimal",
        resultUnit: "percentage points",
        label: "CAPM",
        timestamp: new Date(1_700_000_000_000).toLocaleString("en-US"),
        timestampIso: "2023-11-14T22:13:20.000Z",
      },
    ]);
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
      expect(toastMock.error).toHaveBeenCalledWith("common.storageOperationFailed");
    } finally {
      setItem.mockRestore();
    }
  });

  it("returns to all records when the active category loses its final item", async () => {
    const { container, rerender } = render(<HistoryPage />);
    const tvmFilter = screen.getByRole("button", { name: /tvm.*\(1\)/i });
    fireEvent.click(tvmFilter);
    expect(tvmFilter).toHaveAttribute("aria-pressed", "true");

    await waitFor(() => expect(screen.getAllByRole("button", { name: "history.delete" })).toHaveLength(1));
    fireEvent.click(screen.getByRole("button", { name: "history.delete" }));
    expect(historyMock.removeFromHistory).toHaveBeenCalledWith("1");
    const noResultsInsertions: Node[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        noResultsInsertions.push(
          ...[...record.addedNodes].filter((node) => node.textContent?.includes("history.noResults"))
        );
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    historyMock.history = historyMock.history.filter((item) => item.id !== "1");
    rerender(<HistoryPage />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /history\.all.*\(1\)/ })).toHaveAttribute("aria-pressed", "true")
    );
    expect(screen.queryByRole("button", { name: /tvm.*\(1\)/i })).not.toBeInTheDocument();
    expect(screen.getByText("VaR")).toBeInTheDocument();
    expect(screen.queryByText("history.noResults")).not.toBeInTheDocument();
    observer.disconnect();
    expect(noResultsInsertions).toEqual([]);
  });

  it("keeps an empty favorites filter selected", async () => {
    window.localStorage.setItem(`${STORAGE_PREFIX}favorites`, JSON.stringify(["1"]));
    render(<HistoryPage />);

    const favoritesFilter = await screen.findByRole("button", { name: /history\.favorites.*\(1\)/ });
    fireEvent.click(favoritesFilter);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "history.favorites" })).toHaveLength(1));
    fireEvent.click(screen.getByRole("button", { name: "history.favorites" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /history\.favorites.*\(0\)/ })).toHaveAttribute("aria-pressed", "true")
    );
    expect(screen.getByText("history.noResults")).toBeInTheDocument();
  });

  it("compares exactly two compatible records while explaining disabled alternatives", () => {
    historyMock.history = [
      {
        id: "capm-baseline",
        page: "equity",
        inputs: { rf: "3.5", beta: "1.2", rm: "10" },
        result: 0.08,
        timestamp: 1_700_000_000_000,
        label: "CAPM",
        resultFormat: "percentDecimal",
      },
      {
        id: "capm-comparison",
        page: "equity",
        inputs: { rf: "4", beta: "1.3", rm: "11" },
        result: 0.105,
        timestamp: 1_700_000_100_000,
        label: "资本资产定价",
        resultFormat: "percentDecimal",
      },
      {
        id: "wacc",
        page: "equity",
        inputs: { equity: "1000", debt: "500", costEquity: "12", costDebt: "6", taxRate: "25" },
        result: 0.09,
        timestamp: 3,
        resultFormat: "percentDecimal",
      },
      {
        id: "currency",
        page: "tvm",
        inputs: { rate: "5", nper: "10", pmt: "0", pv: "", fv: "1500", type: "0", target: "pv" },
        result: 1000,
        timestamp: 4,
        resultFormat: "currency",
      },
    ];
    render(<HistoryPage />);

    const compareMode = screen.getByRole("button", { name: "history.compare" });
    expect(compareMode).toBeEnabled();
    fireEvent.click(compareMode);

    const selectionButtons = screen.getAllByRole("button", { name: "history.selectForComparison" });
    expect(selectionButtons).toHaveLength(4);
    fireEvent.click(selectionButtons[0]);
    expect(selectionButtons[2]).toHaveAttribute("aria-disabled", "true");
    expect(selectionButtons[2]).toHaveAttribute("title", "history.incompatibleMetric");
    expect(selectionButtons[2]).toHaveAccessibleDescription("history.incompatibleMetric");
    expect(selectionButtons[3]).toHaveAttribute("aria-disabled", "true");
    expect(selectionButtons[3]).toHaveAttribute("title", "history.notComparableCurrency");
    expect(selectionButtons[3]).toHaveAccessibleDescription("history.notComparableCurrency");

    const compareSelected = screen.getByRole("button", { name: "history.compareSelected" });
    expect(compareSelected).toBeDisabled();
    fireEvent.click(selectionButtons[1]);
    expect(compareSelected).toBeEnabled();
    fireEvent.click(compareSelected);

    const dialog = screen.getByRole("dialog", {
      name: "history.comparisonTitle: equity.capm.tab",
    });
    expect(dialog).toHaveTextContent("history.comparisonRecordedOnly");
    expect(dialog).toHaveTextContent("8%");
    expect(dialog).toHaveTextContent("10.5%");
    expect(dialog).toHaveTextContent("+2.5 history.percentagePointsUnit");

    const swap = within(dialog).getByRole("button", { name: "history.swapComparison" });
    expect(swap).toHaveAttribute("title", "history.swapComparison");
    fireEvent.click(swap);

    expect(dialog).toBeVisible();
    const swappedBaseline = within(dialog).getByRole("region", { name: "history.baseline" });
    const swappedComparison = within(dialog).getByRole("region", { name: "history.comparison" });
    expect(swappedBaseline).toHaveTextContent("10.5%");
    expect(swappedBaseline).toHaveTextContent(new Date(1_700_000_100_000).toLocaleString("en-US"));
    expect(swappedComparison).toHaveTextContent("8%");
    expect(swappedComparison).toHaveTextContent(new Date(1_700_000_000_000).toLocaleString("en-US"));
    expect(within(dialog).getByText("-2.5 history.percentagePointsUnit")).toBeInTheDocument();
    expect(within(dialog).getByRole("row", { name: /equity\.capm\.rf 4 3\.5/ })).toHaveAttribute(
      "data-changed",
      "true"
    );

    const closeButtons = within(dialog).getAllByRole("button", { name: "common.close" });
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const remainingAlternatives = screen.getAllByRole("button", { name: "history.selectForComparison" });
    expect(remainingAlternatives[0]).toHaveAttribute("title", "history.selectTwoCompatible");
    expect(remainingAlternatives[1]).toHaveAttribute("title", "history.notComparableCurrency");
  });

  it("clears comparison selection when the view changes or a selected record disappears", async () => {
    historyMock.history = [
      {
        id: "capm-one",
        page: "equity",
        inputs: { rf: "3", beta: "1", rm: "9" },
        result: 0.09,
        timestamp: 1,
        resultFormat: "percentDecimal",
      },
      {
        id: "capm-two",
        page: "equity",
        inputs: { rf: "4", beta: "1.2", rm: "10" },
        result: 0.112,
        timestamp: 2,
        resultFormat: "percentDecimal",
      },
    ];
    const { rerender } = render(<HistoryPage />);

    fireEvent.click(screen.getByRole("button", { name: "history.compare" }));
    fireEvent.click(screen.getAllByRole("button", { name: "history.selectForComparison" })[0]);
    expect(screen.getByText("1/2")).toBeInTheDocument();

    const search = screen.getByRole("textbox", { name: "history.searchPlaceholder" });
    fireEvent.change(search, { target: { value: "no match" } });
    expect(screen.getByText("0/2")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "" } });
    fireEvent.click(screen.getAllByRole("button", { name: "history.selectForComparison" })[0]);
    expect(screen.getByText("1/2")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "history.selectForComparison" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "history.compareSelected" }));
    expect(screen.getByRole("dialog")).toBeVisible();

    historyMock.history = historyMock.history.filter((item) => item.id !== "capm-one");
    rerender(<HistoryPage />);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });
});
