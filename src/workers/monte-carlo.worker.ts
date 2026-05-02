// Monte Carlo worker: computes Efficient Frontier via random portfolio sampling.
// Uses actual asset expected returns, risks, and pairwise correlation.

import {
  calculatePortfolioPoint,
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
    };
    const simCount = payload?.simulations ?? 1000;
    const assets = payload?.assets ?? [];
    const rf = payload?.rf ?? 0;
    const correlation = payload?.correlation ?? 0; // scalar pairwise correlation

    if (assets.length === 0) {
      self.postMessage({ type: "result", data: { simulations: [], optimal: null, minVol: null } });
      return;
    }

    const simulations: PortfolioPoint[] = [];
    const step = Math.max(1, Math.floor(simCount / 20));

    for (let i = 0; i < simCount; i++) {
      const weights = makeRandomWeights(assets.length);
      simulations.push(calculatePortfolioPoint(assets, weights, correlation, rf));

      if (step > 0 && i % step === 0) {
        const progress = Math.round((i / simCount) * 100);
        self.postMessage({ type: "progress", data: progress });
      }
    }

    self.postMessage({ type: "result", data: summarizePortfolioSimulations(simulations) });
  } catch (e) {
    self.postMessage({ type: "error", data: (e as Error).message });
  }
};
