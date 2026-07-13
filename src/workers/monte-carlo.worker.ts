// Monte Carlo worker: computes Efficient Frontier via random portfolio sampling.
// Uses actual asset expected returns, risks, and pairwise correlation.

import {
  calculatePortfolioPoint,
  createSeededRandom,
  getMonteCarloSimulationTarget,
  makeDeterministicBaselineWeights,
  makeRandomWeights,
  summarizePortfolioSimulations,
  type PortfolioPoint,
} from "@/lib/portfolio-math";

self.onmessage = (event: MessageEvent) => {
  try {
    const payload = event.data as {
      simulations?: number;
      assets?: { id: number; name: string; return: number; risk: number }[];
      rf?: number;
      correlation?: number;
      seed?: string | number;
    };
    const assets = payload?.assets ?? [];
    const rf = payload?.rf ?? 0;
    const correlation = payload?.correlation ?? 0; // scalar pairwise correlation
    const random = createSeededRandom(payload?.seed ?? "portfolio-default");

    if (assets.length === 0) {
      self.postMessage({ type: "result", data: { simulations: [], optimal: null, minVol: null } });
      return;
    }

    const simulationTarget = getMonteCarloSimulationTarget(payload?.simulations, assets.length);
    const baselineWeights = makeDeterministicBaselineWeights(assets.length);
    const simulations: PortfolioPoint[] = baselineWeights.map((weights) =>
      calculatePortfolioPoint(assets, weights, correlation, rf)
    );
    const randomSimulationCount = simulationTarget - baselineWeights.length;
    const totalSimulationCount = baselineWeights.length + randomSimulationCount;
    const step = Math.max(1, Math.floor(randomSimulationCount / 20));

    for (let i = 0; i < randomSimulationCount; i++) {
      const weights = makeRandomWeights(assets.length, random);
      simulations.push(calculatePortfolioPoint(assets, weights, correlation, rf));

      if (step > 0 && i % step === 0) {
        const progress = Math.round(((baselineWeights.length + i + 1) / totalSimulationCount) * 100);
        self.postMessage({ type: "progress", data: progress });
      }
    }

    self.postMessage({ type: "result", data: summarizePortfolioSimulations(simulations) });
  } catch (e) {
    self.postMessage({ type: "error", data: (e as Error).message });
  }
};
