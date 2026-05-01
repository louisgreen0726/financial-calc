/// <reference types="vitest/globals" />

import { renderHook, waitFor } from "@testing-library/react";
import { useHistoryRecorder } from "@/hooks/use-history-recorder";

describe("useHistoryRecorder", () => {
  it("does not record while disabled", async () => {
    const addToHistory = vi.fn();

    renderHook(() =>
      useHistoryRecorder({
        addToHistory,
        inputs: { rate: "5" },
        result: 100,
        label: "TVM",
        enabled: false,
      })
    );

    await waitFor(() => {
      expect(addToHistory).not.toHaveBeenCalled();
    });
  });

  it("records once when enabled with a finite result", async () => {
    const addToHistory = vi.fn();

    const { rerender } = renderHook(
      ({ enabled }) =>
        useHistoryRecorder({
          addToHistory,
          inputs: { rate: "5" },
          result: 100,
          label: "TVM",
          enabled,
        }),
      { initialProps: { enabled: false } }
    );

    rerender({ enabled: true });

    await waitFor(() => {
      expect(addToHistory).toHaveBeenCalledWith({ rate: "5" }, 100, "TVM");
    });
    expect(addToHistory).toHaveBeenCalledTimes(1);

    rerender({ enabled: true });
    expect(addToHistory).toHaveBeenCalledTimes(1);
  });

  it("skips invalid numeric results", async () => {
    const addToHistory = vi.fn();

    renderHook(() =>
      useHistoryRecorder({
        addToHistory,
        inputs: { rate: "5" },
        result: Number.NaN,
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(addToHistory).not.toHaveBeenCalled();
    });
  });
});
