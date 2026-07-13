import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_MONTE_CARLO_SIMULATIONS, MAX_PORTFOLIO_ASSETS } from "@/lib/constants";

interface WorkerScopeStub {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: ReturnType<typeof vi.fn>;
}

const assets = [
  { id: 1, name: "A", return: 8, risk: 10 },
  { id: 2, name: "B", return: 5, risk: 4 },
];

describe("Monte Carlo worker boundaries", () => {
  const workerScope: WorkerScopeStub = {
    onmessage: null,
    postMessage: vi.fn(),
  };

  beforeAll(async () => {
    vi.stubGlobal("self", workerScope);
    await import("@/workers/monte-carlo.worker");
  });

  beforeEach(() => {
    workerScope.postMessage.mockClear();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  const dispatch = (data: unknown) => {
    expect(workerScope.onmessage).not.toBeNull();
    workerScope.onmessage?.(new MessageEvent("message", { data }));
  };

  it.each([Number.POSITIVE_INFINITY, Number.NaN])(
    "rejects non-finite simulation count %s before entering the loop",
    (simulations) => {
      dispatch({ assets, simulations });

      expect(workerScope.postMessage).toHaveBeenCalledOnce();
      expect(workerScope.postMessage).toHaveBeenCalledWith({
        type: "error",
        data: "Simulation count must be finite.",
      });
    }
  );

  it("rejects an oversized asset payload before allocating baselines", () => {
    const oversizedAssets = Array.from({ length: MAX_PORTFOLIO_ASSETS + 1 }, (_, index) => ({
      id: index + 1,
      name: `Asset ${index + 1}`,
      return: 5,
      risk: 10,
    }));

    dispatch({ assets: oversizedAssets, simulations: 100 });

    expect(workerScope.postMessage).toHaveBeenCalledOnce();
    expect(workerScope.postMessage).toHaveBeenCalledWith({
      type: "error",
      data: `Asset count must be between 1 and ${MAX_PORTFOLIO_ASSETS}.`,
    });
  });

  it("caps a huge finite request and completes with the bounded result", () => {
    dispatch({ assets, simulations: Number.MAX_VALUE, seed: "bounded-worker" });

    const resultMessage = workerScope.postMessage.mock.calls
      .map(([message]) => message as { type: string; data: unknown })
      .find((message) => message.type === "result") as { type: "result"; data: { simulations: unknown[] } } | undefined;
    expect(resultMessage?.data.simulations).toHaveLength(MAX_MONTE_CARLO_SIMULATIONS);
  });
});
