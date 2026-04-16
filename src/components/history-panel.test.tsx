/// <reference types="vitest/globals" />

import { render, waitFor } from "@testing-library/react";
import { HistoryPanel } from "@/components/history-panel";
import { PENDING_RESTORE_KEY } from "@/lib/constants";

vi.mock("@/hooks/use-calculation-history", () => ({
  useCalculationHistory: () => ({
    pageHistory: [
      {
        id: "1",
        page: "tvm",
        inputs: { rate: "5" },
        result: 100,
        timestamp: Date.now(),
        label: "TVM",
      },
    ],
    removeFromHistory: vi.fn(),
    clearHistory: vi.fn(),
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
});
