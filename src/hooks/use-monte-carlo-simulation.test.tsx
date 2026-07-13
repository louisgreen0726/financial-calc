import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMonteCarloSimulation } from "@/hooks/use-monte-carlo-simulation";

class MockWorker {
  static instances: MockWorker[] = [];

  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor() {
    MockWorker.instances.push(this);
  }
}

const payload = {
  simulations: 10,
  assets: [
    { id: 1, name: "A", return: 8, risk: 10 },
    { id: 2, name: "B", return: 5, risk: 4 },
  ],
};

describe("useMonteCarloSimulation", () => {
  beforeEach(() => {
    MockWorker.instances = [];
    vi.stubGlobal("Worker", MockWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ignores a stale worker error without terminating the active worker", async () => {
    const { result } = renderHook(() => useMonteCarloSimulation());

    await act(async () => {
      await result.current.run(payload);
    });
    const firstWorker = MockWorker.instances[0];

    await act(async () => {
      await result.current.run(payload);
    });
    const secondWorker = MockWorker.instances[1];
    expect(firstWorker.terminate).toHaveBeenCalledTimes(1);

    act(() => {
      firstWorker.onerror?.(new Event("error"));
    });

    expect(secondWorker.terminate).not.toHaveBeenCalled();
    expect(result.current.isRunning).toBe(true);

    act(() => {
      secondWorker.onmessage?.(
        new MessageEvent("message", {
          data: { type: "result", data: { simulations: [], optimal: null, minVol: null } },
        })
      );
    });

    expect(secondWorker.terminate).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.progress).toBe(100);
  });

  it("preserves a worker domain error when the in-process fallback rejects the same invalid payload", async () => {
    const onError = vi.fn();
    const invalidCorrelationPayload = {
      simulations: 10,
      assets: [
        { id: 1, name: "A", return: 8, risk: 10 },
        { id: 2, name: "B", return: 5, risk: 4 },
        { id: 3, name: "C", return: 6, risk: 7 },
      ],
      correlation: -0.8,
      rf: 2,
    };
    const correlationError = "Correlation is outside the valid range for this asset count.";
    const { result } = renderHook(() => useMonteCarloSimulation());

    await act(async () => {
      await result.current.run(invalidCorrelationPayload, { onError });
    });
    const worker = MockWorker.instances[0];

    act(() => {
      worker.onmessage?.(
        new MessageEvent("message", {
          data: { type: "error", data: correlationError },
        })
      );
    });

    await waitFor(() => expect(result.current.isRunning).toBe(false));
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(result.current.result).toBeNull();
    expect(result.current.error?.message).toBe(correlationError);
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toMatchObject({ message: correlationError });
  });

  it("includes equal-weight and corner baselines in the in-process fallback", async () => {
    vi.stubGlobal(
      "Worker",
      class {
        constructor() {
          throw new Error("worker unavailable");
        }
      }
    );
    const { result } = renderHook(() => useMonteCarloSimulation());

    await act(async () => {
      await result.current.run({ ...payload, simulations: 3 });
    });

    const fallbackResult = result.current.result as {
      simulations: { weights: number[] }[];
    };
    expect(fallbackResult.simulations.map((point) => point.weights)).toEqual([
      [0.5, 0.5],
      [1, 0],
      [0, 1],
    ]);
  });

  it("terminates a created worker when postMessage throws before falling back", async () => {
    class ThrowingPostMessageWorker extends MockWorker {
      postMessage = vi.fn(() => {
        throw new Error("postMessage failed");
      });
    }
    vi.stubGlobal("Worker", ThrowingPostMessageWorker);
    const { result } = renderHook(() => useMonteCarloSimulation());

    await act(async () => {
      await result.current.run({ ...payload, simulations: 3 });
    });

    const worker = MockWorker.instances[0];
    expect(worker.postMessage).toHaveBeenCalledWith({ ...payload, simulations: 3 });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning).toBe(false);
    expect(
      (result.current.result as { simulations: { weights: number[] }[] }).simulations.map((point) => point.weights)
    ).toEqual([
      [0.5, 0.5],
      [1, 0],
      [0, 1],
    ]);
  });
});
