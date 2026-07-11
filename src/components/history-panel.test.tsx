/// <reference types="vitest/globals" />

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HistoryPanel } from "@/components/history-panel";
import { PENDING_RESTORE_KEY, STORAGE_PREFIX } from "@/lib/constants";

const historyMock = vi.hoisted(() => ({
  removeManyFromHistory: vi.fn<(ids: Iterable<string>) => void>(),
  removeFromHistory: vi.fn<(id: string) => void>(),
  clearHistory: vi.fn<() => void>(),
  retryPersistence: vi.fn<() => Promise<"persisted">>(() => Promise.resolve("persisted")),
  persistenceStatus: "idle" as "idle" | "pending" | "saving" | "failed",
  persistenceError: null as "storage" | "unsupported-version" | null,
  hasPendingPersistence: false,
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
    retryPersistence: historyMock.retryPersistence,
    isInitialized: true,
    persistenceStatus: historyMock.persistenceStatus,
    persistenceError: historyMock.persistenceError,
    hasPendingPersistence: historyMock.hasPendingPersistence,
  }),
}));

vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: "en",
  }),
}));

describe("HistoryPanel pending restore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    historyMock.history = [
      {
        id: "1",
        page: "tvm",
        inputs: { rate: "5" },
        result: 100,
        timestamp: 1,
        label: "TVM",
      },
    ];
    historyMock.pageHistory = [...historyMock.history];
    historyMock.persistenceStatus = "idle";
    historyMock.persistenceError = null;
    historyMock.hasPendingPersistence = false;
    historyMock.removeManyFromHistory.mockClear();
    historyMock.removeFromHistory.mockClear();
    historyMock.clearHistory.mockClear();
    historyMock.retryPersistence.mockClear();
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

  it.each([
    { page: "tvm", inputs: { rate: "7" } },
    { page: "tvm", inputs: { rate: "7" }, timestamp: Date.now() + 6 * 60 * 1000 },
    { page: "tvm", inputs: [], timestamp: Date.now() },
    { page: "tvm", inputs: { rate: null }, timestamp: Date.now() },
  ])("rejects malformed or out-of-window pending restore payloads", async (payload) => {
    const onRestore = vi.fn();
    window.sessionStorage.setItem(PENDING_RESTORE_KEY, JSON.stringify(payload));

    render(<HistoryPanel page="tvm" onRestore={onRestore} />);

    await waitFor(() => expect(window.sessionStorage.getItem(PENDING_RESTORE_KEY)).toBeNull());
    expect(onRestore).not.toHaveBeenCalled();
  });

  it("hides orphaned favorite ids without rewriting them automatically", async () => {
    window.localStorage.setItem(`${STORAGE_PREFIX}favorites`, JSON.stringify(["1", "missing"]));

    render(<HistoryPanel page="tvm" onRestore={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /history.title/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "history.favorites" })).toHaveAttribute("aria-pressed", "true")
    );
    expect(JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}favorites`) ?? "[]")).toEqual(["1", "missing"]);
  });

  it("deletes selected items in one batch operation", async () => {
    window.localStorage.setItem(`${STORAGE_PREFIX}favorites`, JSON.stringify(["1", "missing"]));
    render(<HistoryPanel page="tvm" onRestore={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /history.title/ }));
    fireEvent.click(screen.getByRole("button", { name: "history.select" }));
    fireEvent.click(screen.getByRole("button", { name: "history.selectItem" }));
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

  it("opens with dialog semantics and closes on Escape", async () => {
    render(<HistoryPanel page="tvm" onRestore={vi.fn()} />);

    const toggle = screen.getByRole("button", { name: /history.title/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    const dialog = await screen.findByRole("dialog", { name: "history.title" });
    expect(dialog).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(screen.getByRole("textbox", { name: "history.searchPlaceholder" })).toHaveFocus());

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "history.title" })).not.toBeInTheDocument();
    });
    expect(toggle).toHaveFocus();
  });

  it("moves focus to main content after deleting the only item", async () => {
    const main = document.createElement("main");
    main.id = "main-content";
    main.tabIndex = -1;
    document.body.append(main);

    render(<HistoryPanel page="tvm" onRestore={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /history.title/ }));
    fireEvent.click(screen.getByRole("button", { name: "history.delete" }));

    await waitFor(() => expect(main).toHaveFocus());
    main.remove();
  });

  it("keeps the retry UI available after a failed deletion leaves the page history empty", async () => {
    historyMock.history = [];
    historyMock.pageHistory = [];
    historyMock.persistenceStatus = "failed";
    historyMock.persistenceError = "storage";
    historyMock.hasPendingPersistence = true;

    render(<HistoryPanel page="tvm" onRestore={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /history.title/ }));

    expect(await screen.findByRole("status")).toHaveTextContent("history.persistenceFailed");
    fireEvent.click(screen.getByRole("button", { name: "history.retrySave" }));

    await waitFor(() => expect(historyMock.retryPersistence).toHaveBeenCalledTimes(1));
  });
});
