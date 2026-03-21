interface Asset {
  id: number;
  name: string;
  return: number;
  risk: number;
}

interface PortfolioPoint {
  ret: number;
  risk: number;
  sharpe: number;
  weights: number[];
}

interface WorkerInput {
  assets: Asset[];
  correlation: number;
  rf: number;
  simulations: number;
}

interface WorkerOutput {
  simulations: PortfolioPoint[];
  optimal: PortfolioPoint | null;
  minVol: PortfolioPoint | null;
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { assets, correlation, rf, simulations: N } = e.data;

  if (assets.length < 2) {
    self.postMessage({ simulations: [], optimal: null, minVol: null } as WorkerOutput);
    return;
  }

  const sims: PortfolioPoint[] = [];
  let maxSharpe = -Infinity;
  let minRisk = Infinity;
  let bestPort: PortfolioPoint | null = null;
  let safestPort: PortfolioPoint | null = null;

  for (let i = 0; i < N; i++) {
    let weights = assets.map(() => Math.random());
    const sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map((w) => w / sum);

    const portRet = weights.reduce((acc, w, idx) => acc + w * assets[idx].return, 0);

    let portVar = 0;
    for (let j = 0; j < assets.length; j++) {
      for (let k = 0; k < assets.length; k++) {
        const w1 = weights[j];
        const w2 = weights[k];
        const sig1 = assets[j].risk;
        const sig2 = assets[k].risk;
        const rho = j === k ? 1 : correlation;
        portVar += w1 * w2 * rho * sig1 * sig2;
      }
    }
    const portRisk = Math.sqrt(portVar);
    const sharpe = portRisk > 0 ? (portRet - rf) / portRisk : 0;

    const point = { ret: portRet, risk: portRisk, sharpe, weights };
    sims.push(point);

    if (sharpe > maxSharpe) {
      maxSharpe = sharpe;
      bestPort = point;
    }
    if (portRisk < minRisk) {
      minRisk = portRisk;
      safestPort = point;
    }
  }

  self.postMessage({ simulations: sims, optimal: bestPort, minVol: safestPort } as WorkerOutput);
};
