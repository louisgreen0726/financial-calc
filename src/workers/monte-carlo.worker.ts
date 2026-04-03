// Monte Carlo worker: computes Efficient Frontier via random portfolio sampling.
// Uses actual asset expected returns, risks, and pairwise correlation.

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

    const n = assets.length;
    const returns = assets.map((a) => a.return); // in %
    const risks = assets.map((a) => a.risk); // std dev in %

    // Build covariance matrix: Cov(i,j) = rho * sigma_i * sigma_j  (i≠j), sigma_i^2 (i==j)
    const cov: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? risks[i] * risks[i] : correlation * risks[i] * risks[j]))
    );

    const simulations: { ret: number; risk: number; sharpe: number; weights: number[] }[] = [];
    const step = Math.max(1, Math.floor(simCount / 20));

    for (let i = 0; i < simCount; i++) {
      // Random weights summing to 1 (Dirichlet-like)
      const raw = assets.map(() => -Math.log(Math.random() + 1e-15));
      const sum = raw.reduce((a, b) => a + b, 0) || 1;
      const weights = raw.map((w) => w / sum);

      // Weighted portfolio return (%)
      const ret = weights.reduce((acc, w, k) => acc + w * returns[k], 0);

      // Portfolio variance = w^T * Cov * w
      let variance = 0;
      for (let a = 0; a < n; a++) {
        for (let b = 0; b < n; b++) {
          variance += weights[a] * weights[b] * cov[a][b];
        }
      }
      const risk = Math.sqrt(Math.max(0, variance));
      const sharpe = risk > 0 ? (ret - rf) / risk : 0;

      simulations.push({ ret, risk, sharpe, weights });

      if (step > 0 && i % step === 0) {
        const progress = Math.round((i / simCount) * 100);
        self.postMessage({ type: "progress", data: progress });
      }
    }

    // Max Sharpe portfolio
    let optimal: (typeof simulations)[0] | null = null;
    let bestSharpe = -Infinity;
    for (const s of simulations) {
      if (s.sharpe > bestSharpe) {
        bestSharpe = s.sharpe;
        optimal = s;
      }
    }

    // Min volatility portfolio
    const minVol = simulations.reduce((min, s) => (s.risk < (min?.risk ?? Infinity) ? s : min), simulations[0] ?? null);

    self.postMessage({ type: "result", data: { simulations, optimal, minVol } });
  } catch (e) {
    self.postMessage({ type: "error", data: (e as Error).message });
  }
};
